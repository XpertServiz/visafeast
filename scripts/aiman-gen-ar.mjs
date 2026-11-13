// One-off: builds lib/aiman/gen/ar.json (Arabic, word for word from the approved prototype) keyed by copy id.
// Usage: node scripts/aiman-gen-ar.mjs <path to talk-with-aiman-prototype.html>
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";
const html = readFileSync(process.argv[2], "utf8");
const a = html.indexOf("const AR={"), b = html.indexOf("};", a);
const AR = vm.runInNewContext("(" + html.slice(a + 9, b + 1) + ")");
const { COPY } = await import("../lib/aiman/copy.ts");
const out = {}, missing = [];
for (const [id, row] of Object.entries(COPY)) {
  if (row[2]) continue;
  const ar = AR[row[0]];
  if (ar) out[id] = ar; else missing.push(id);
}
writeFileSync("lib/aiman/gen/ar.json", JSON.stringify(out, null, 1));
console.log("arabic rows:", Object.keys(out).length, "| still without Arabic:", missing.join(", "));
