-- "Visa Reality Check": sourced fact-checks of common visa and study-abroad claims. Safe to run more than once.
-- Server-only tables (RLS on, no policies): the website and admin read and write with the service key after their own checks.

create table if not exists reality_checks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  claim text not null,
  country text,
  type text not null check (type in ('study','visit','work','immigration')),
  verdict text not null check (verdict in ('true','partly_true','misleading','cannot_verify')),
  summary text not null default '',
  what_true text not null default '',
  what_misleading text not null default '',
  what_missing text not null default '',
  rows jsonb not null default '[]',        -- [{claim, rule, verdict}]
  checklist jsonb not null default '[]',   -- ["step", ...]
  sources jsonb not null default '[]',     -- [{title, url}]
  verified_on date not null default current_date,
  ur_summary text,
  status text not null default 'draft' check (status in ('draft','published')),
  -- a post can never be published without an official source link
  constraint reality_published_needs_source check (status = 'draft' or jsonb_array_length(sources) >= 1)
);
create index if not exists reality_checks_pub on reality_checks (status, published_at desc);
alter table reality_checks enable row level security;

create table if not exists reality_settings (
  id int primary key check (id = 1),
  do_not_name text[] not null default '{}',   -- agency / page names that must never appear in a post
  updated_at timestamptz default now()
);
alter table reality_settings enable row level security;
insert into reality_settings (id) values (1) on conflict (id) do nothing;

-- first post: a DRAFT for the admin to verify and publish
insert into reality_checks (slug, title, claim, country, type, verdict, summary, what_true, what_misleading, what_missing, rows, checklist, sources, ur_summary, status)
values (
  'study-in-norway-with-spouse-and-children-no-fee-no-interview',
  'Study in Norway with spouse and children: what is true?',
  'Study in Norway with spouse and children. No application fee. No interview. Deadline 1 Dec.',
  'Norway', 'study', 'partly_true',
  'Family members can usually apply to join a student in Norway, but the fee, the deadline and the interview depend on the university and the programme. Check each one before you pay.',
  'Spouses and children can usually apply for a family permit through UDI. Some universities, such as NTNU and the University of Bergen, use 1 December for some programmes.',
  'The claim treats every university as the same. UiT, for example, uses 15 November. Each programme sets its own deadline. The university application may be free, but UDI charges a fee for the study permit.',
  'It does not say that UDI does not process the family application at the same time as the student''s. It does not mention tuition (non-EU students pay tuition in Norway since 2023) or the funds you must show.',
  '[{"claim":"Family can join","rule":"UDI: spouse and children can usually apply, but UDI does not process family applications at the same time as the student''s.","verdict":"partly_true"},
    {"claim":"No application fee","rule":"UDI requires a fee for the study permit. The university''s own application may be free.","verdict":"misleading"},
    {"claim":"Deadline 1 Dec","rule":"True for some universities such as NTNU and Bergen, but UiT''s is 15 November. Each programme sets its own deadline.","verdict":"partly_true"},
    {"claim":"No interview","rule":"Not verified. Check each programme.","verdict":"cannot_verify"},
    {"claim":"Tuition and funds not mentioned","rule":"Non-EU students pay tuition in Norway since 2023, and funds must also be shown.","verdict":"misleading"}]',
  '["Open the official UDI student page and read the fee and funds rules","Open the university programme page and read its own deadline","Ask the university in writing if an interview is needed","Read the UDI family immigration page for your spouse and children","Pay only through the official payment page, never to a personal account"]',
  '[{"title":"UDI: studies","url":"https://www.udi.no/en/want-to-apply/studies/"},{"title":"UDI: family immigration","url":"https://www.udi.no/en/want-to-apply/family-immigration/"},{"title":"NTNU: admission","url":"https://www.ntnu.edu/studies/admission"},{"title":"University of Bergen","url":"https://www.uib.no/en"},{"title":"UiT The Arctic University of Norway","url":"https://en.uit.no/"}]',
  null, 'draft')
on conflict (slug) do nothing;
