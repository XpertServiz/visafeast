-- Ledger posting functions (brief §9A.3 / §9A.4). Every money action posts a BALANCED group inside one transaction.
-- The app calls ONLY these functions (via the service role). Entries are immutable: corrections post a reversing group.

create or replace function ledger_code_for_account(acc uuid) returns text language sql stable as $$
  select case kind when 'cash' then '1000' when 'bank' then '1100' else '1200' end from money_accounts where id = acc
$$;

create or replace function assert_period_open(d date) returns void language plpgsql as $$
begin
  if exists (select 1 from period_locks where month = date_trunc('month', d)::date) then
    raise exception 'The month % is closed. Ask the owner to reopen it.', to_char(d, 'Mon YYYY');
  end if;
end $$;

-- core: lines = [{"code":"1000","debit":100,"credit":0,"memo":"..."}, ...]
create or replace function post_entries(p_date date, p_lines jsonb, p_source_table text, p_source_id uuid, p_group uuid default gen_random_uuid())
returns uuid language plpgsql as $$
declare l jsonb; d bigint := 0; c bigint := 0;
begin
  perform assert_period_open(p_date);
  for l in select * from jsonb_array_elements(p_lines) loop
    d := d + coalesce((l->>'debit')::bigint, 0);
    c := c + coalesce((l->>'credit')::bigint, 0);
  end loop;
  if d <> c then raise exception 'Unbalanced entry: debits % <> credits %', d, c; end if;
  if d = 0 then raise exception 'Empty entry'; end if;
  for l in select * from jsonb_array_elements(p_lines) loop
    if coalesce((l->>'debit')::bigint, 0) = 0 and coalesce((l->>'credit')::bigint, 0) = 0 then continue; end if;
    insert into ledger_entries (entry_group, entry_date, ledger_code, debit_pkr, credit_pkr, source_table, source_id, memo)
    values (p_group, p_date, l->>'code', coalesce((l->>'debit')::bigint, 0), coalesce((l->>'credit')::bigint, 0), p_source_table, p_source_id, l->>'memo');
  end loop;
  return p_group;
end $$;

-- Invoice: Dr Owed by clients; Cr Service fees (services − discounts); Cr Client money held (pass-through); Cr Tax payable.
create or replace function post_invoice(p_invoice uuid) returns uuid language plpgsql as $$
declare inv invoices; svc bigint; pt bigint; disc bigint; tax bigint; total bigint; lines jsonb := '[]';
begin
  select * into inv from invoices where id = p_invoice for update;
  if inv.posted then raise exception 'Invoice already posted'; end if;
  select coalesce(sum(amount_pkr) filter (where line_type='service'),0), coalesce(sum(amount_pkr) filter (where line_type='pass_through'),0),
         coalesce(sum(amount_pkr) filter (where line_type='discount'),0), coalesce(sum(amount_pkr) filter (where line_type='tax'),0)
    into svc, pt, disc, tax from invoice_lines where invoice_id = p_invoice;
  total := svc + pt + tax - disc;
  if total <= 0 then raise exception 'Invoice total must be above zero'; end if;
  lines := jsonb_build_array(jsonb_build_object('code','1300','debit',total,'memo','Invoice '||inv.number));
  if svc - disc <> 0 then lines := lines || jsonb_build_array(jsonb_build_object('code','4000','credit',svc - disc,'memo','Service fees')); end if;
  if pt <> 0 then lines := lines || jsonb_build_array(jsonb_build_object('code','2000','credit',pt,'memo','Embassy/VFS fee held for client')); end if;
  if tax <> 0 then lines := lines || jsonb_build_array(jsonb_build_object('code','2200','credit',tax,'memo','Tax')); end if;
  update invoices set posted = true, status = case when status = 'draft' then 'sent' else status end where id = p_invoice;
  return post_entries(inv.issue_date, lines, 'invoices', p_invoice);
end $$;

-- Payment received: Dr account (cash/bank/wallet); Cr Owed by clients. With no invoice (advance): Cr Client money held.
create or replace function post_payment(p_payment uuid) returns uuid language plpgsql as $$
declare p payments; code text; paid bigint; total bigint; inv invoices; cred text; grp uuid;
begin
  select * into p from payments where id = p_payment;
  code := ledger_code_for_account(p.account_id);
  if code is null then raise exception 'Choose where the money went (cash / bank / wallet)'; end if;
  cred := case when p.invoice_id is null then '2000' else '1300' end;
  grp := post_entries(p.paid_on, jsonb_build_array(
    jsonb_build_object('code', code, 'debit', p.amount_pkr, 'memo', 'Payment received'),
    jsonb_build_object('code', cred, 'credit', p.amount_pkr, 'memo', coalesce(p.reference, 'Payment'))), 'payments', p_payment);
  if p.invoice_id is not null then
    select coalesce(sum(case line_type when 'discount' then -amount_pkr else amount_pkr end),0) into total from invoice_lines where invoice_id = p.invoice_id;
    select coalesce(sum(amount_pkr),0) into paid from payments where invoice_id = p.invoice_id and reversed_by is null;
    update invoices set status = case when paid >= total then 'paid' else 'part_paid' end where id = p.invoice_id and status <> 'cancelled';
    select * into inv from invoices where id = p.invoice_id;
    -- partner commission accrues when the invoice is fully paid
    if paid >= total and inv.partner_id is not null and not exists (select 1 from commissions where invoice_id = inv.id) then
      perform accrue_commission(inv.id);
    end if;
  end if;
  return grp;
end $$;

create or replace function accrue_commission(p_invoice uuid) returns uuid language plpgsql as $$
declare inv invoices; pt partners; svc bigint; amt bigint; cid uuid;
begin
  select * into inv from invoices where id = p_invoice;
  select * into pt from partners where id = inv.partner_id;
  select coalesce(sum(amount_pkr),0) - coalesce((select sum(amount_pkr) from invoice_lines where invoice_id = p_invoice and line_type='discount'),0) into svc from invoice_lines where invoice_id = p_invoice and line_type='service';
  amt := case pt.commission_type when 'fixed' then round(pt.commission_value) else round(svc * pt.commission_value / 100) end;
  if amt <= 0 then return null; end if;
  insert into commissions (partner_id, invoice_id, amount_pkr) values (pt.id, p_invoice, amt) returning id into cid;
  perform post_entries(current_date, jsonb_build_array(
    jsonb_build_object('code','5100','debit',amt,'memo','Commission '||pt.name), jsonb_build_object('code','2100','credit',amt,'memo','Commission payable')), 'commissions', cid);
  return cid;
end $$;

create or replace function post_commission_paid(p_commission uuid, p_account uuid, p_date date default current_date) returns uuid language plpgsql as $$
declare c commissions;
begin
  select * into c from commissions where id = p_commission for update;
  if c.status = 'paid' then raise exception 'Already paid'; end if;
  update commissions set status = 'paid', paid_on = p_date where id = p_commission;
  return post_entries(p_date, jsonb_build_array(
    jsonb_build_object('code','2100','debit',c.amount_pkr,'memo','Commission paid'), jsonb_build_object('code',ledger_code_for_account(p_account),'credit',c.amount_pkr,'memo','Commission paid')), 'commissions', p_commission);
end $$;

-- Expense: Dr expense account; Cr cash/bank/wallet.
create or replace function post_expense(p_expense uuid) returns uuid language plpgsql as $$
declare e expenses; code text;
begin
  select * into e from expenses where id = p_expense;
  select ledger_code into code from expense_categories where id = e.category_id;
  return post_entries(e.spent_on, jsonb_build_array(
    jsonb_build_object('code', coalesce(code,'5900'), 'debit', e.amount_pkr, 'memo', coalesce(e.vendor,'Expense')),
    jsonb_build_object('code', ledger_code_for_account(e.account_id), 'credit', e.amount_pkr, 'memo', coalesce(e.vendor,'Expense'))), 'expenses', p_expense);
end $$;

-- Pay embassy/VFS fee for a client: Dr Client money held; Cr cash/bank/wallet. (Never an expense — it is the client's money.)
create or replace function post_pass_through(p_id uuid) returns uuid language plpgsql as $$
declare x pass_through_payments;
begin
  select * into x from pass_through_payments where id = p_id;
  return post_entries(coalesce(x.paid_on, current_date), jsonb_build_array(
    jsonb_build_object('code','2000','debit',x.amount_pkr,'memo','Fee paid for client: '||coalesce(x.payee,'')),
    jsonb_build_object('code',ledger_code_for_account(x.account_id),'credit',x.amount_pkr,'memo','Fee paid for client')), 'pass_through_payments', p_id);
end $$;

-- Refund to client. p_kind = 'service' (reduces income) or 'client_money' (returns held money). Cr cash/bank/wallet.
create or replace function post_refund(p_kind text, p_amount bigint, p_account uuid, p_date date default current_date, p_memo text default 'Refund') returns uuid language plpgsql as $$
begin
  return post_entries(p_date, jsonb_build_array(
    jsonb_build_object('code', case p_kind when 'service' then '4000' else '2000' end, 'debit', p_amount, 'memo', p_memo),
    jsonb_build_object('code', ledger_code_for_account(p_account), 'credit', p_amount, 'memo', p_memo)), 'refund', null);
end $$;

create or replace function post_transfer(p_id uuid) returns uuid language plpgsql as $$
declare t account_transfers;
begin
  select * into t from account_transfers where id = p_id;
  return post_entries(t.on_date, jsonb_build_array(
    jsonb_build_object('code',ledger_code_for_account(t.to_account),'debit',t.amount_pkr,'memo','Transfer in'),
    jsonb_build_object('code',ledger_code_for_account(t.from_account),'credit',t.amount_pkr,'memo','Transfer out')), 'account_transfers', p_id);
end $$;

-- Owner's drawings / capital / opening balance
create or replace function post_owner(p_kind text, p_amount bigint, p_account uuid, p_date date default current_date) returns uuid language plpgsql as $$
begin
  if p_kind = 'drawings' then
    return post_entries(p_date, jsonb_build_array(jsonb_build_object('code','3100','debit',p_amount,'memo','Owner took money out'), jsonb_build_object('code',ledger_code_for_account(p_account),'credit',p_amount)), 'owner', null);
  end if;
  return post_entries(p_date, jsonb_build_array(jsonb_build_object('code',ledger_code_for_account(p_account),'debit',p_amount,'memo','Owner put money in'), jsonb_build_object('code','3000','credit',p_amount)), 'owner', null);
end $$;

-- Reverse any group (edits = reverse + new). Cancelling an invoice reverses its posting.
create or replace function reverse_group(p_group uuid, p_date date default current_date) returns uuid language plpgsql as $$
declare g uuid := gen_random_uuid();
begin
  perform assert_period_open(p_date);
  insert into ledger_entries (entry_group, entry_date, ledger_code, debit_pkr, credit_pkr, source_table, source_id, memo)
    select g, p_date, ledger_code, credit_pkr, debit_pkr, source_table, source_id, 'Reversal: ' || coalesce(memo,'') from ledger_entries where entry_group = p_group;
  if not found then raise exception 'Nothing to reverse'; end if;
  return g;
end $$;

-- immutability + nightly integrity check
create or replace function ledger_immutable() returns trigger language plpgsql as $$ begin raise exception 'Money records cannot be edited or deleted. Post a reversal instead.'; end $$;
drop trigger if exists ledger_no_update on ledger_entries;
create trigger ledger_no_update before update or delete on ledger_entries for each row execute function ledger_immutable();

create or replace function ledger_is_balanced() returns table (ok boolean, debits bigint, credits bigint) language sql stable as $$
  select coalesce(sum(debit_pkr),0) = coalesce(sum(credit_pkr),0), coalesce(sum(debit_pkr),0), coalesce(sum(credit_pkr),0) from ledger_entries
$$;

-- Reports (owner only through the app)
create or replace function report_profit(p_from date, p_to date) returns table (income bigint, expenses bigint, profit bigint) language sql stable as $$
  select i, e, i - e from (
    select coalesce(sum(credit_pkr - debit_pkr) filter (where a.type = 'income'),0) as i,
           coalesce(sum(debit_pkr - credit_pkr) filter (where a.type = 'expense'),0) as e
    from ledger_entries l join ledger_accounts a on a.code = l.ledger_code where entry_date between p_from and p_to) x
$$;
create or replace function report_balances() returns table (code text, name text, balance bigint) language sql stable as $$
  select a.code, a.name, coalesce(sum(case when a.type in ('asset','expense') then debit_pkr - credit_pkr else credit_pkr - debit_pkr end),0)
  from ledger_accounts a left join ledger_entries l on l.ledger_code = a.code group by a.code, a.name order by a.code
$$;
