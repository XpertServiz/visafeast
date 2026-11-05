import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const supabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const serviceConfigured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

let _service: SupabaseClient | null = null;
/** Server-only client with the service-role key. Never import this in a client component. */
export function serviceClient(): SupabaseClient | null {
  if (!serviceConfigured()) return null;
  _service ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _service;
}

/** Anonymous (RLS-limited) client for public reads. */
export function anonClient(): SupabaseClient | null {
  if (!supabaseConfigured()) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
