-- RLS on EVERY table. The public site reads only published rows through the anon key.
-- All public writes (leads, reviews, tracking…) go through Next.js route handlers using the service-role key
-- (which bypasses RLS) after zod + Turnstile + rate-limit checks. Staff policies below allow read-only access via a login.

create or replace function staff_role() returns text language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- public read (published only)
create policy "public read settings" on settings for select using (true);
create policy "public read countries" on countries for select using (is_published);
create policy "public read faqs" on faqs for select using (is_published);
create policy "public read reviews" on reviews for select using (status = 'approved');
create policy "public read case studies" on case_studies for select using (is_published and client_consent);
create policy "public read news" on news_items for select using (is_relevant);
create policy "public read news sources" on news_sources for select using (true);
create policy "public read posts" on posts for select using (status = 'published');
create policy "public read hero videos" on hero_videos for select using (is_active);
create policy "public read media" on media for select using (true);

-- staff read (writes go through server actions with the service role after a role check)
do $$
declare t text;
begin
  foreach t in array array['profiles','leads','people','cases','case_documents','timeline_events','reminders','message_templates','chat_sessions','chat_messages','page_views','events','live_presence','seo_pages','search_console_daily','activity_log','youtube_videos','case_stage_templates'] loop
    execute format('create policy "staff read %1$s" on %1$I for select using (staff_role() in (''owner'',''consultant'',''editor''))', t);
  end loop;
  foreach t in array array['services','money_accounts','partners','invoices','invoice_lines','payments','expense_categories','expenses','pass_through_payments','commissions','account_transfers','bank_checks'] loop
    execute format('create policy "staff read %1$s" on %1$I for select using (staff_role() in (''owner'',''consultant''))', t);
  end loop;
  foreach t in array array['ledger_accounts','ledger_entries','period_locks'] loop
    execute format('create policy "owner read %1$s" on %1$I for select using (staff_role() = ''owner'')', t);
  end loop;
end $$;
-- rate_limits: no policies at all (service role only)

-- Realtime for the live-visitors screen
alter publication supabase_realtime add table live_presence;
