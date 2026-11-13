import { defineConfig, devices } from "@playwright/test";

// E2E_PORT lets you test a separate build (e.g. `pnpm start -p 3100`) while `pnpm dev` keeps 3000.
const PORT = Number(process.env.E2E_PORT ?? 3000);
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests/e2e",
  // Staff accounts for the admin auth specs (needs a migrated database).
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // CI runs against the production build; locally the dev server is reused if already running.
    command: isCI ? `pnpm start -p ${PORT}` : `pnpm dev -p ${PORT}`,
    port: PORT,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
