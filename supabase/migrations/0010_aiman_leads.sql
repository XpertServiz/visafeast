-- "Talk with Aiman": leads from the ad landing page, and the admin-editable funds figures. Safe to run more than once.
-- Both tables are server-only (RLS on, no policies): the website and the admin read and write them with the service key after their own checks.

create table if not exists aiman_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,                         -- set when the client sent their WhatsApp number
  status text not null check (status in ('qualified','not_qualified')),
  name text not null,
  phone text,
  city text,
  visitor_country text,                             -- from the hosting edge, 2 letters
  lang text,
  purpose text,                                     -- visit / study / work / immigration
  target_country text,                              -- the country the client chose ("open to suggestions" if none)
  family_size int,
  balance_lacs numeric,
  program text,                                     -- the recommended program
  p1 text,                                          -- the two short paragraphs shown in admin and in the email
  p2 text,
  answers jsonb not null default '{}',
  utm jsonb not null default '{}',
  secs int,
  seen boolean not null default false,
  contacted boolean not null default false,
  contacted_at timestamptz,
  email_sent boolean not null default false
);
create index if not exists aiman_leads_created on aiman_leads (created_at desc);
create index if not exists aiman_leads_unseen on aiman_leads (seen) where seen = false;
alter table aiman_leads enable row level security;

create table if not exists aiman_settings (
  id int primary key check (id = 1),
  funds jsonb not null default '{}',
  updated_at timestamptz default now()
);
alter table aiman_settings enable row level security;
insert into aiman_settings (id) values (1) on conflict (id) do nothing;
