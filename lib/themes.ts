// Each theme = a set of CSS variables. settings.theme is read server-side and set on <html data-theme>.
export type ThemeKey = "night_flight" | "passport" | "window" | "gate";
export const THEMES: Record<ThemeKey, { label: string; vars: Record<string, string> }> = {
  night_flight: {
    label: "Night Flight",
    vars: { "--navy": "#0A1A33", "--navy-2": "#102849", "--navy-hover": "#163463", "--paper": "#F7F4EE", "--line": "#E4DED3", "--on-navy": "#C9D3E2", "--on-navy-2": "#9FB0C8", "--radius": "18px" },
  },
  passport: {
    label: "Passport",
    vars: { "--navy": "#4A1620", "--navy-2": "#5E2230", "--navy-hover": "#7A2E40", "--paper": "#F5EEDF", "--line": "#E2D6BF", "--on-navy": "#EBD9D2", "--on-navy-2": "#D2B3A8", "--radius": "14px" },
  },
  window: {
    label: "Window Seat",
    vars: { "--navy": "#134A7C", "--navy-2": "#1B5E9B", "--navy-hover": "#226FB4", "--paper": "#F2F8FD", "--line": "#D6E4F0", "--on-navy": "#DCEBF8", "--on-navy-2": "#B3CFE8", "--radius": "22px" },
  },
  gate: {
    label: "Boarding Gate",
    vars: { "--navy": "#15221E", "--navy-2": "#1F322C", "--navy-hover": "#2B463D", "--paper": "#F3F6F4", "--line": "#D9E2DD", "--on-navy": "#CFDDD6", "--on-navy-2": "#9DB5A9", "--radius": "12px" },
  },
};
export const isTheme = (v: string): v is ThemeKey => v in THEMES;

export function themeStyle(theme: string, accent?: string): string {
  const t = THEMES[isTheme(theme) ? theme : "night_flight"];
  const vars = { ...t.vars };
  if (accent && /^#[0-9a-fA-F]{6}$/.test(accent)) vars["--amber"] = accent;
  return Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(";");
}

// WCAG contrast ratio, used by the Admin → Appearance accent picker (warn if < 4.5)
export function contrast(hexA: string, hexB: string): number {
  const lum = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [a, b] = [lum(hexA), lum(hexB)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}
