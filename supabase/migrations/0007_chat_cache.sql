-- Saved GPT answers, so the same question never costs twice. Emptied whenever visa facts change. Server only.
create table if not exists chat_cache (
  q_hash text primary key,
  answer text not null,
  link text,
  created_at timestamptz default now()
);
alter table chat_cache enable row level security;
