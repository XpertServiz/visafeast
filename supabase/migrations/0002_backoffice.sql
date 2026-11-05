-- Back office: people, cases, money (brief §9A.4). Money is whole PKR in bigint — no floating point.

create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  ref text unique not null,                      -- VF-1042
  person_id uuid not null references people,
  service_type text not null check (service_type in ('visit','study','immigration')),
  country_id uuid references countries,
  visa_or_pathway text,
  consultant_id uuid references profiles,
  stage text not null default 'new',
  agreed_fee_pkr int,
  travel_date date, apply_by date, biometrics_at timestamptz, submitted_at date, decision_at date,
  decision text check (decision in ('approved','refused','withdrawn')),
  closed_at timestamptz, deleted_at timestamptz, created_at timestamptz default now()
);
create sequence if not exists case_ref_seq start 1001;
create or replace function next_case_ref() returns text language sql as $$ select 'VF-' || nextval('case_ref_seq') $$;

create table if not exists case_stage_templates (
  service_type text, stage text, label_en text, label_ur text, sort int, primary key (service_type, stage)
);
insert into case_stage_templates values
 ('visit','new','New','نیا',1),('visit','docs_requested','Documents requested','دستاویزات طلب',2),('visit','docs_received','Documents received','دستاویزات موصول',3),
 ('visit','review','File review','فائل ریویو',4),('visit','submitted','Submitted','جمع شدہ',5),('visit','biometrics','Biometrics','بایومیٹرکس',6),('visit','decision','Decision','فیصلہ',7),('visit','closed','Closed','بند',8),
 ('study','new','New','نیا',1),('study','docs_requested','Documents requested','دستاویزات طلب',2),('study','docs_received','Documents received','دستاویزات موصول',3),
 ('study','review','File review','فائل ریویو',4),('study','submitted','Submitted','جمع شدہ',5),('study','biometrics','Biometrics','بایومیٹرکس',6),('study','decision','Decision','فیصلہ',7),('study','closed','Closed','بند',8),
 ('immigration','assessment','Assessment','جائزہ',1),('immigration','agreement','Agreement signed','معاہدہ',2),('immigration','documents','Documents','دستاویزات',3),
 ('immigration','filed','Filed by licensed partner','لائسنس یافتہ پارٹنر نے جمع کرایا',4),('immigration','in_process','In process','کارروائی میں',5),('immigration','decision','Decision','فیصلہ',6),('immigration','closed','Closed','بند',7)
on conflict do nothing;

create table if not exists case_documents (
  id uuid primary key default gen_random_uuid(), case_id uuid references cases on delete cascade,
  title text not null, required boolean default true, received boolean default false,
  file_path text, uploaded_at timestamptz, delete_after date
);
create table if not exists timeline_events (
  id bigserial primary key, person_id uuid references people, case_id uuid references cases,
  kind text not null, body text, meta jsonb, actor uuid references profiles, ts timestamptz default now()
);
create table if not exists reminders (
  id uuid primary key default gen_random_uuid(), person_id uuid references people, case_id uuid references cases,
  due_on date not null, note text, done boolean default false, assigned_to uuid references profiles
);
create table if not exists message_templates (key text primary key, label text, body_en text, body_ur text);
insert into message_templates values
 ('welcome','Welcome','Assalam-o-Alaikum {name}, thank you for contacting Visafeast. How can we help with your visa?','السلام علیکم {name}، ویزا فیسٹ سے رابطہ کرنے کا شکریہ۔ ہم آپ کے ویزا میں کیسے مدد کر سکتے ہیں؟'),
 ('documents','Documents request','Assalam-o-Alaikum {name}, to continue your file (ref {ref}) please send: {missing}.','السلام علیکم {name}، آپ کی فائل ({ref}) کے لیے براہ کرم یہ بھیجیں: {missing}۔'),
 ('appointment','Appointment reminder','Reminder {name}: your appointment is on {date}. Please bring your passport and documents.','یاد دہانی {name}: آپ کی اپائنٹمنٹ {date} کو ہے۔ پاسپورٹ اور دستاویزات ساتھ لائیں۔'),
 ('payment','Payment reminder','Assalam-o-Alaikum {name}, a gentle reminder: PKR {amount} is due for invoice {invoice}.','السلام علیکم {name}، یاد دہانی: انوائس {invoice} کی PKR {amount} واجب الادا ہے۔'),
 ('approved','Visa approved','Congratulations {name}! Your visa has been approved. We wish you a wonderful journey.','مبارک ہو {name}! آپ کا ویزا منظور ہو گیا ہے۔'),
 ('review','Review request','Assalam-o-Alaikum {name}, thank you for choosing Visafeast. Could you share your experience here? {link}','السلام علیکم {name}، ویزا فیسٹ کا انتخاب کرنے کا شکریہ۔ کیا آپ اپنا تجربہ یہاں شیئر کر سکتے ہیں؟ {link}')
on conflict do nothing;

-- money
create table if not exists services (id uuid primary key default gen_random_uuid(), name text not null, default_fee_pkr int, is_active boolean default true);
create table if not exists money_accounts (id uuid primary key default gen_random_uuid(), name text not null, kind text not null check (kind in ('cash','bank','wallet')), opening_balance_pkr bigint default 0, is_active boolean default true);
create table if not exists partners (id uuid primary key default gen_random_uuid(), name text not null, licence_no text, commission_type text check (commission_type in ('fixed','percent')), commission_value numeric, phone text);
create sequence if not exists invoice_seq start 1;
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(), number text unique not null,
  person_id uuid references people, case_id uuid references cases,
  issue_date date default current_date, due_date date,
  status text default 'draft' check (status in ('draft','sent','part_paid','paid','overdue','cancelled')),
  language text default 'en', notes text, partner_id uuid references partners, posted boolean default false, is_quote boolean default false
);
create table if not exists invoice_lines (
  id uuid primary key default gen_random_uuid(), invoice_id uuid references invoices on delete cascade,
  line_type text not null check (line_type in ('service','pass_through','discount','tax')),
  description text, service_id uuid references services,
  amount_pkr bigint not null, foreign_amount numeric, foreign_currency text, fx_rate numeric
);
create table if not exists payments (
  id uuid primary key default gen_random_uuid(), invoice_id uuid references invoices, person_id uuid references people,
  amount_pkr bigint not null check (amount_pkr > 0), paid_on date not null, method text, account_id uuid references money_accounts,
  reference text, receipt_path text, created_by uuid references profiles, reversed_by uuid
);
create table if not exists expense_categories (id uuid primary key default gen_random_uuid(), name text unique not null, ledger_code text not null default '5900');
insert into expense_categories (name, ledger_code) values
 ('Rent','5000'),('Salaries','5010'),('Internet & phone','5020'),('Ads & marketing','5030'),('Software & hosting','5040'),
 ('Travel & fuel','5050'),('Office','5060'),('Partner commission','5100'),('Bank charges','5070'),('Other','5900') on conflict do nothing;
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(), category_id uuid references expense_categories,
  amount_pkr bigint not null check (amount_pkr > 0), spent_on date not null, account_id uuid references money_accounts,
  case_id uuid references cases, vendor text, note text, receipt_path text,
  recurring text check (recurring in ('none','monthly','yearly')) default 'none', reversed_by uuid
);
create table if not exists pass_through_payments (
  id uuid primary key default gen_random_uuid(), case_id uuid references cases, amount_pkr bigint not null check (amount_pkr > 0),
  paid_on date, account_id uuid references money_accounts, payee text, receipt_path text
);
create table if not exists commissions (id uuid primary key default gen_random_uuid(), partner_id uuid references partners, invoice_id uuid references invoices, amount_pkr bigint, status text default 'due' check (status in ('due','paid')), paid_on date);
create table if not exists account_transfers (id uuid primary key default gen_random_uuid(), from_account uuid references money_accounts, to_account uuid references money_accounts, amount_pkr bigint not null check (amount_pkr > 0), on_date date, note text);
create table if not exists bank_checks (id uuid primary key default gen_random_uuid(), account_id uuid references money_accounts, entry_id bigint, checked boolean default true, month date);

-- hidden double-entry engine
create table if not exists ledger_accounts (code text primary key, name text not null, type text not null check (type in ('asset','liability','equity','income','expense')));
create table if not exists ledger_entries (
  id bigserial primary key, entry_group uuid not null,
  entry_date date not null, ledger_code text not null references ledger_accounts,
  debit_pkr bigint not null default 0 check (debit_pkr >= 0), credit_pkr bigint not null default 0 check (credit_pkr >= 0),
  check ((debit_pkr = 0) <> (credit_pkr = 0)),
  source_table text, source_id uuid, memo text, created_at timestamptz default now()
);
create index if not exists le_date on ledger_entries (entry_date);
create index if not exists le_code on ledger_entries (ledger_code);
create table if not exists period_locks (month date primary key, locked_by uuid references profiles, locked_at timestamptz default now(), reopen_reason text);

insert into ledger_accounts values
 ('1000','Cash in hand','asset'),('1100','Bank accounts','asset'),('1200','Wallets (JazzCash / Easypaisa)','asset'),('1300','Money owed by clients','asset'),
 ('2000','Client money held','liability'),('2100','Commissions payable','liability'),('2200','Tax payable','liability'),
 ('3000','Owner''s capital','equity'),('3100','Owner''s drawings','equity'),
 ('4000','Service fees','income'),('4100','Other income','income'),
 ('5000','Rent','expense'),('5010','Salaries','expense'),('5020','Internet & phone','expense'),('5030','Ads & marketing','expense'),('5040','Software & hosting','expense'),
 ('5050','Travel & fuel','expense'),('5060','Office','expense'),('5070','Bank charges','expense'),('5100','Partner commission','expense'),('5900','Other expenses','expense')
on conflict do nothing;
