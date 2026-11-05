import "server-only";
import { serviceClient } from "../supabase";

export function db() {
  const c = serviceClient();
  if (!c) throw new Error("Database not configured");
  return c;
}
export const today = () => new Date().toISOString().slice(0, 10);
export const startOfMonth = () => `${today().slice(0, 7)}-01`;
export const rows = <T,>(r: { data: T[] | null }) => r.data ?? [];
