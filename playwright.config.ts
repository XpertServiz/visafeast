import { defineConfig } from "@playwright/test";

// Smoke tests (brief §16 Phase 7). Uses the Edge/Chrome already on this computer — no browser download needed.
// Run:  npm run e2e        (starts the site by itself if it is not already running)
const PORT = Number(process.env.E2E_PORT || 3100);
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  retries: 1,
  workers: 1,
  reporter: "list",
  use: { baseURL: `http://localhost:${PORT}`, channel: process.env.E2E_BROWSER || "msedge", reducedMotion: "reduce" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1366, height: 900 } } },
    { name: "phone-360", use: { viewport: { width: 360, height: 740 } } },
  ],
  webServer: { command: `npx next dev -p ${PORT}`, url: `http://localhost:${PORT}`, reuseExistingServer: true, timeout: 120_000 },
});
