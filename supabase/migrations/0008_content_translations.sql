-- Automatic translations of website content (country guides, FAQs, digests) into each language.
-- source_hash records which English text was translated: when the English changes, that row is out of date and is redone.
-- A row is public website content; only the server (service key) can write.
create table if not exists content_translations (
  entity text not null check (entity in ('country', 'faq', 'post')),
  entity_id text not null,
  locale text not null,
  source_hash text not null,
  content jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (entity, entity_id, locale)
);
alter table content_translations enable row level security;
drop policy if exists content_translations_read on content_translations;
create policy content_translations_read on content_translations for select to anon, authenticated using (true);
