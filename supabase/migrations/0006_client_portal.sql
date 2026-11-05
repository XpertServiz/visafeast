-- Client portal: clients sign in, upload documents, see their file status and chat with their consultant.
-- All reads and writes go through server routes that check ownership, using the service role. RLS stays closed to clients.

alter table people add column if not exists auth_user_id uuid unique references auth.users on delete set null;

alter table case_documents add column if not exists person_id uuid references people on delete cascade; -- for documents not yet on a case
alter table case_documents add column if not exists status text not null default 'missing' check (status in ('missing','uploaded','approved','rejected'));
alter table case_documents add column if not exists review_note text;   -- shown to the client: why it needs redoing
alter table case_documents add column if not exists file_name text;
alter table case_documents add column if not exists mime text;
alter table case_documents add column if not exists size_bytes bigint;
alter table case_documents add column if not exists uploaded_by text check (uploaded_by in ('client','staff'));
create index if not exists case_documents_status on case_documents (status);
create index if not exists case_documents_person on case_documents (person_id);
update case_documents set status = 'approved' where received and status = 'missing';

-- One-time codes the consultant sends by WhatsApp. Only the hash is stored.
create table if not exists portal_codes (
  code_hash text primary key,
  person_id uuid not null references people on delete cascade,
  kind text not null check (kind in ('join','reset')),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_by uuid references profiles,
  created_at timestamptz default now()
);

create table if not exists client_messages (
  id bigserial primary key,
  person_id uuid not null references people on delete cascade,
  sender text not null check (sender in ('client','staff')),
  staff_id uuid references profiles,
  body text not null check (char_length(body) between 1 and 4000),
  read_by_staff_at timestamptz,
  read_by_client_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists client_messages_person on client_messages (person_id, id);
create index if not exists client_messages_unread on client_messages (sender) where read_by_staff_at is null;

alter table portal_codes enable row level security;     -- no policies: server only
alter table client_messages enable row level security;
drop policy if exists "staff read client_messages" on client_messages;
create policy "staff read client_messages" on client_messages for select using (staff_role() in ('owner','consultant'));

-- Private bucket limits are enforced by Supabase itself, not only by our code.
update storage.buckets
  set file_size_limit = 10485760, allowed_mime_types = array['application/pdf','image/jpeg','image/png','image/webp']
  where id = 'case-documents';

-- Link a login to the person the consultant issued the code for. All-or-nothing: a bad code changes nothing.
-- A temporary record made at self sign-up is merged into the real client record.
create or replace function portal_claim_code(p_hash text, p_user uuid) returns uuid language plpgsql as $$
declare c portal_codes; old uuid;
begin
  update portal_codes set used_at = now()
    where code_hash = p_hash and kind = 'join' and used_at is null and expires_at > now()
    returning * into c;
  if c.person_id is null then raise exception 'This link is not valid any more. Please ask your consultant for a new one.'; end if;
  if exists (select 1 from people where id = c.person_id and auth_user_id is not null and auth_user_id <> p_user) then
    raise exception 'This file is already linked to another login. Please ask your consultant.';
  end if;
  select id into old from people where auth_user_id = p_user;
  if old is not null and old <> c.person_id then
    update people set auth_user_id = null, deleted_at = now() where id = old;
    update client_messages set person_id = c.person_id where person_id = old;
    update case_documents set person_id = c.person_id where person_id = old;
    update cases set person_id = c.person_id where person_id = old;
    update leads set person_id = c.person_id where person_id = old;
    update timeline_events set person_id = c.person_id where person_id = old;
    update reminders set person_id = c.person_id where person_id = old;
    update invoices set person_id = c.person_id where person_id = old;
    update payments set person_id = c.person_id where person_id = old;
  end if;
  update people set auth_user_id = p_user, is_client = true where id = c.person_id;
  return c.person_id;
end $$;

-- Consume a password-reset code; returns the login to reset. A bad code changes nothing.
create or replace function portal_use_reset_code(p_hash text) returns uuid language plpgsql as $$
declare c portal_codes; u uuid;
begin
  update portal_codes set used_at = now()
    where code_hash = p_hash and kind = 'reset' and used_at is null and expires_at > now()
    returning * into c;
  if c.person_id is null then raise exception 'This link is not valid any more. Please ask your consultant for a new one.'; end if;
  select auth_user_id into u from people where id = c.person_id;
  if u is null then raise exception 'This client has no login yet.'; end if;
  return u;
end $$;
