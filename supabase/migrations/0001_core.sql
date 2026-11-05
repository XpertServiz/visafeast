-- Visafeast core schema (brief §5). Run in Supabase → SQL editor (or `supabase db push`).
create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role text not null default 'editor' check (role in ('owner','consultant','editor')),
  created_at timestamptz default now()
);

create table if not exists settings (
  id int primary key default 1 check (id = 1),
  whatsapp_number text not null default '+16479662297',
  whatsapp_number_pk text,
  email text default 'visafeast@gmail.com',
  facebook_url text default 'https://www.facebook.com/visafeast/',
  address_line text default 'Karachi · consultations online across Pakistan',
  office_hours text default 'Mon–Sat 10am–7pm PKT',
  ntn text,
  calcom_link text default 'visafeast/15min',
  service_fee_mode text default 'quote' check (service_fee_mode in ('exact','from','quote')),
  digest_auto_publish boolean default false,
  chatbot_enabled boolean default true,
  llm_provider text default 'none' check (llm_provider in ('none','gemini','anthropic')),
  google_reviews_url text,
  youtube_channel_url text,
  hero_globe_style text default 'realistic' check (hero_globe_style in ('realistic','dotted')),
  heading_font text default 'Fraunces',
  body_font text default 'Inter',
  urdu_font text default 'Noto Nastaliq Urdu',
  theme text default 'night_flight' check (theme in ('night_flight','passport','window','gate','custom')),
  accent_color text default '#F2A93B',
  splash_style text default 'logo_fade' check (splash_style in ('plane_stamp','globe_spin','passport_open','boarding_pass','logo_fade','off')),
  splash_duration_ms int default 2200,
  splash_once_per_session boolean default true,
  splash_custom_logo_media_id uuid,
  case_doc_retention_months int default 12,
  updated_at timestamptz default now()
);
insert into settings (id) values (1) on conflict do nothing;

create table if not exists countries (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  kind text not null check (kind in ('visit','study','immigration')),
  pathways jsonb default '[]',
  licensed_partner text,
  content_ur jsonb,
  ur_status text default 'none' check (ur_status in ('none','draft','approved')),
  country_name text not null,
  country_code text,
  flag text,
  from_code text default 'KHI',
  to_code text,
  visa_name text,
  card_note text,
  h1 text not null,
  meta_title text not null,
  meta_description text not null,
  intro text,
  embassy_fee_text text, embassy_fee_pkr int, vfs_fee_text text, service_fee_pkr int,
  processing_time_text text, max_stay_text text, apply_window_text text, biometrics_text text,
  facts_source_url text, facts_last_checked date,
  who_for_md jsonb default '[]',
  documents jsonb default '[]',
  funds_md text,
  steps jsonb default '[]',
  refusal_reasons jsonb default '[]',
  extra_sections jsonb default '[]',
  related_slugs text[] default '{}',
  keywords text[] default '{}',
  old_slugs text[] default '{}',
  is_published boolean default false,
  sort_order int default 100,
  updated_at timestamptz default now()
);

create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references countries on delete cascade,
  question text not null, answer_md text not null,
  sort_order int default 100, is_published boolean default true
);

create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  full_name text, whatsapp text unique, email text, city text,
  language text default 'en' check (language in ('en','ur')),
  is_client boolean default false, notes text,
  id_number_enc bytea,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  person_id uuid references people,
  name text, phone text, email text, city text,
  destination text, visa_type text, travel_date date,
  prior_refusal text, message text,
  source text not null,
  page_path text, utm jsonb, eligibility jsonb,
  nationality text, residence_country text,
  status text default 'new' check (status in ('new','contacted','docs_received','submitted','approved','refused','closed','not_interested')),
  notes text,
  assigned_to uuid references profiles
);
create index if not exists leads_created on leads (created_at desc);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null, city text, visa_type text,
  rating int not null check (rating between 1 and 5),
  body text not null,
  photo_path text,
  consent boolean not null default false,
  submitted_via text default 'website' check (submitted_via in ('website','whatsapp')),
  admin_confirmed_client_consent boolean default false,
  status text default 'pending' check (status in ('pending','approved','rejected')),
  approved_at timestamptz,
  ip_hash text
);

create table if not exists case_studies (
  id uuid primary key default gen_random_uuid(),
  title text not null, profile text, destination text, visa_type text,
  challenge text, what_we_did text, outcome text,
  badge text default 'VISA GRANTED', photo_path text,
  client_consent boolean not null default false,
  is_published boolean default false, sort_order int default 100
);

create table if not exists news_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null, url text not null unique,
  kind text not null check (kind in ('official_rss','google_news_rss','youtube_channel')),
  country_codes text[] default '{}', is_official boolean default true, is_active boolean default true,
  last_fetched_at timestamptz, last_status text
);
create table if not exists news_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references news_sources on delete set null,
  title text not null, url text not null unique, published_at timestamptz,
  summary text, country_codes text[] default '{}', topics text[] default '{}',
  is_relevant boolean default true, what_it_means text, created_at timestamptz default now()
);
create index if not exists news_pub on news_items (published_at desc);

create table if not exists youtube_videos (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references news_sources on delete cascade,
  video_id text unique not null, title text, description text, published_at timestamptz,
  claim text,
  verification text default 'unchecked' check (verification in ('unchecked','confirmed','unconfirmed','rejected')),
  official_url text, checked_at timestamptz
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  type text not null check (type in ('digest','guide','blog')),
  title text not null, excerpt text, body_md text not null,
  sources jsonb default '[]', country_codes text[] default '{}',
  status text default 'draft' check (status in ('draft','published','archived')),
  generated_by text, published_at timestamptz, created_at timestamptz default now(),
  meta_title text, meta_description text
);

create table if not exists page_views (
  id bigserial primary key, ts timestamptz default now(),
  path text not null, referrer_host text, utm_source text, utm_medium text, utm_campaign text,
  country text, region text, city text, device text, visitor_hash text, session_id text,
  browser text, os text, screen text, browser_language text, accept_language text, site_locale text,
  is_new_visitor boolean, landing boolean default false, duration_ms int
);
create index if not exists pv_ts on page_views (ts);
create index if not exists pv_path on page_views (path);

create table if not exists events (
  id bigserial primary key, ts timestamptz default now(),
  name text not null, path text, meta jsonb, visitor_hash text, country text
);
create index if not exists ev_ts on events (ts);

create table if not exists live_presence (
  session_id text primary key, visitor_hash text, path text, country text, city text,
  device text, browser_language text, site_locale text, referrer_host text, last_seen timestamptz default now()
);

create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(), created_at timestamptz default now(),
  visitor_hash text, page_path text, lead_id uuid references leads, message_count int default 0
);
create table if not exists chat_messages (
  id bigserial primary key, session_id uuid references chat_sessions on delete cascade,
  role text check (role in ('user','assistant')), content text, used_llm boolean default false, ts timestamptz default now()
);

create table if not exists hero_videos (
  id uuid primary key default gen_random_uuid(),
  youtube_url text not null, video_id text not null unique, title text, caption text,
  is_short boolean default false, is_active boolean default true, sort_order int not null default 100,
  show_on_country_slug text, created_at timestamptz default now()
);

create table if not exists rate_limits (key text primary key, window_start timestamptz, count int);

create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  slot text, storage_path text not null, width int, height int, alt_en text, alt_ur text,
  source text check (source in ('pexels','unsplash','pixabay','owner','other')),
  source_url text, photographer text, licence text, used_on text[], created_at timestamptz default now()
);

create table if not exists seo_pages (
  path text primary key, locale text default 'en', title text, meta_description text, h1 text,
  focus_keyword text, word_count int, internal_links int, images_missing_alt int,
  score int, issues jsonb, checked_at timestamptz
);
create table if not exists search_console_daily (
  day date, page text, query text, country text, device text,
  clicks int, impressions int, ctr numeric, position numeric,
  primary key (day, page, query, country, device)
);

create table if not exists activity_log (
  id bigserial primary key, actor uuid references profiles, action text, target_table text, target_id text, meta jsonb, ts timestamptz default now()
);

insert into storage.buckets (id, name, public) values ('review-photos', 'review-photos', false), ('case-studies', 'case-studies', true),
  ('checklists', 'checklists', true), ('media', 'media', true), ('case-documents', 'case-documents', false), ('receipts', 'receipts', false)
  on conflict (id) do nothing;
