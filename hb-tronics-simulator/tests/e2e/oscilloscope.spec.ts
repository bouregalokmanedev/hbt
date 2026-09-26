import { test, expect } from "@playwright/test";

/**
 * Oscilloscope workstation E2E (P4.2) — runs against the production build on the
 * authentic ScopeEngine: 5 views, 6 right tabs, engine-driven waveform +
 * measurements, controls, auto-detected procedure, diagnosis/score, and RTL.
 */

/** Connect Ch A to the driver terminal + GND to battery negative (Connect view). */
async function connect(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  const selects = page.locator("select");
  await selects.first().selectOption("2");
  await selects.last().selectOption("BAT−");
  await page.getByRole("button", { name: /Scope/ }).first().click();
}

test("oscilloscope loads: header, view tabs, procedure, measurements, right tabs", async ({ page }) => {
  await page.goto("/en/tools/oscilloscope");
  await expect(page.getByRole("heading", { name: /Fuel Injector/ })).toBeVisible();
  for (const v of ["Library", "Connect", "Scope", "Compare", "Tablet"]) {
    await expect(page.getByRole("button", { name: v, exact: true })).toBeVisible();
  }
  await expect(page.getByText("Procedure")).toBeVisible();
  await expect(page.getByText("V MAX", { exact: true })).toBeVisible();
  await expect(page.getByText("PULSE W", { exact: true })).toBeVisible();
  for (const r of ["Info", "Pinout", "Probes", "Ref", "AI", "Score"]) {
    await expect(page.getByRole("button", { name: r, exact: true })).toBeVisible();
  }
});

test("oscilloscope: connecting the signal probe gives the authentic injector reading", async ({ page }) => {
  await page.goto("/en/tools/oscilloscope");
  await connect(page);
  // authentic injector spike ≈ 67 V (small baseline noise → 66–67 V)
  await expect(page.getByText(/6[567]\.\d V/).first()).toBeVisible();
  await expect(page.getByText("Connect the probes to the correct terminals").locator("..")).toContainText("✓");
});

test("oscilloscope: fault chip drives the AI tab explanation (probe connected)", async ({ page }) => {
  await page.goto("/en/tools/oscilloscope");
  await connect(page);
  await page.getByRole("button", { name: "Open circuit" }).click();
  await page.getByRole("button", { name: "AI", exact: true }).click();
  await expect(page.getByText(/Circuit broken between the component/)).toBeVisible();
});

test("oscilloscope: diagnosis on the Score tab updates the score", async ({ page }) => {
  await page.goto("/en/tools/oscilloscope");
  await page.getByRole("button", { name: "Score", exact: true }).click();
  await page.getByRole("button", { name: "Submit diagnosis" }).click();
  await expect(page.getByText(/\/ 100/)).toBeVisible();
});

test("oscilloscope: Library and Tablet views render", async ({ page }) => {
  await page.goto("/en/tools/oscilloscope");
  await page.getByRole("button", { name: "Library", exact: true }).click();
  await expect(page.getByText("Oxygen Sensor")).toBeVisible();
  await page.getByRole("button", { name: "Tablet", exact: true }).click();
  await expect(page.getByText(/HB-T14/)).toBeVisible();
});

test("oscilloscope: arabic renders RTL with canonical values, no raw keys", async ({ page }) => {
  await page.goto("/ar/tools/oscilloscope");
  await expect(page.getByText("الوظيفة")).toBeVisible();
  await expect(page.getByText(/INJ-01/).first()).toBeVisible();
  await expect(page.getByText(/oscilloscope\.|content\./)).toHaveCount(0);
});
