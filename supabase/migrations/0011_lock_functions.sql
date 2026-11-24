-- Security: database functions must not be callable by strangers.
-- Supabase publishes every function in the public schema to the internet through the anon key unless access is removed.
-- The website calls these functions only from its server with the service key, so the public and logged-in roles lose access.
-- Safe to run more than once.

-- 1) no function in "public" may be called by the public, strangers (anon) or ordinary logins (authenticated)
revoke execute on all functions in schema public from public, anon, authenticated;
-- the server (service key) keeps full access
grant execute on all functions in schema public to service_role;
-- the one helper that table policies call while checking who is asking; it only returns the caller's own staff role
grant execute on function staff_role() to anon, authenticated;

-- 2) functions created in the future start closed, too
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges in schema public grant execute on functions to service_role;

-- 3) row-level security on every table (tables that already have it, and their policies, are unchanged)
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- the schema changed: make the data API notice at once
notify pgrst, 'reload schema';
