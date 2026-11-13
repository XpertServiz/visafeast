import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseConfigured, serviceClient } from "../supabase";

export type Role = "owner" | "consultant" | "editor";
export interface Admin { id: string; email: string | undefined; role: Role; name: string | null }

/** Supabase client bound to the logged-in user's cookies (for sign-in / session reads). */
/** Login cookies: hidden from page scripts, HTTPS only in production, never sent along with another site's requests. */
const SESSION_COOKIE = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" } as const;

export async function authClient() {
  if (!supabaseConfigured()) return null;
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => { try { list.forEach(({ name, value, options }) => jar.set(name, value, { ...options, ...SESSION_COOKIE })); } catch { /* called from a Server Component */ } },
    },
  });
}

/** Returns the signed-in team member (role from profiles) or null. Always re-verified on the server. */
export async function getAdmin(): Promise<Admin | null> {
  const c = await authClient();
  if (!c) return null;
  const { data: { user } } = await c.auth.getUser();
  if (!user) return null;
  const db = serviceClient();
  if (!db) return null;
  const { data: p } = await db.from("profiles").select("role,full_name").eq("id", user.id).maybeSingle();
  if (!p?.role) return null;
  return { id: user.id, email: user.email, role: p.role as Role, name: p.full_name };
}

export const can = {
  money: (r: Role) => r === "owner" || r === "consultant",
  reports: (r: Role) => r === "owner",
  settings: (r: Role) => r === "owner",
  website: (r: Role) => r === "owner" || r === "editor",
  people: (r: Role) => r === "owner" || r === "consultant",
};
