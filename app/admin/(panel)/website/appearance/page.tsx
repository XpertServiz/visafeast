import { db } from "@/lib/server/admin-data";
import { DEFAULT_SETTINGS } from "@/lib/seed";
import { AppearanceForm } from "@/components/admin/AppearanceForm";
import { resetAppearance, saveAppearance } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function Appearance() {
  const { data } = await db().from("settings").select("*").eq("id", 1).maybeSingle();
  const s = { ...DEFAULT_SETTINGS, ...(data ?? {}) };
  return <AppearanceForm s={s} save={saveAppearance} reset={resetAppearance} />;
}
