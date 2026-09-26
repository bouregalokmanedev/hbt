import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config (11 tests/e2e, 13). Runs against the production build so the tests
 * mirror what ships. Reuses an already-running server on :3000 if present.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["line"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm start",
    url: "http://localhost:3000/en/login",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
