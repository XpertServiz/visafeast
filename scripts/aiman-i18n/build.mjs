// Builds lib/aiman/gen/<lang>.json from scripts/aiman-i18n/<lang>.txt (lines "N|translation", N = position in lib/aiman/copy.ts, starting at 1).
// Checks that every {placeholder} of the English text is kept. Rows left out stay in English. Run: node --no-warnings scripts/aiman-i18n/build.mjs
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
const { COPY } = await import("../../lib/aiman/copy.ts");
const ids = Object.keys(COPY);
const ph = (s) => (s.match(/\{\w+\}/g) || []).filter((x) => x !== "{s}").sort().join(",");
let bad = 0;
for (const f of readdirSync("scripts/aiman-i18n").filter((x) => x.endsWith(".txt"))) {
  const lang = f.replace(".txt", ""), out = {};
  for (const line of readFileSync(`scripts/aiman-i18n/${f}`, "utf8").split(/\r?\n/)) {
    const m = line.match(/^(\d+)\|(.*)$/); if (!m) continue;
    const id = ids[Number(m[1]) - 1]; if (!id) { console.log(lang, "unknown row", m[1]); bad++; continue; }
    if (ph(COPY[id][0]) !== ph(m[2])) { console.log(lang, "row", m[1], id, "placeholders differ:", ph(COPY[id][0]), "vs", ph(m[2])); bad++; }
    out[id] = m[2].trim();
  }
  writeFileSync(`lib/aiman/gen/${lang}.json`, JSON.stringify(out, null, 1));
  console.log(lang, Object.keys(out).length, "rows");
}
process.exit(bad ? 1 : 0);
