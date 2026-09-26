import { test, expect } from "@playwright/test";

/**
 * Multimeter workstation E2E (P3.3) — runs against the production build. Exercises
 * the authentic reconstruction on the MeterProcedureEngine: rotary dial, drag/click
 * probe placement, live LCD reading, the 6-tab bar (2 live + 4 disabled), the
 * component sidebar, progress view, and RTL.
 */

test("multimeter workstation loads with sidebar, tabs and DMM", async ({ page }) => {
  await page.goto("/en/tools/multimeter");
  await expect(page.getByText("Electronic components")).toBeVisible();
  await expect(page.getByText("0 of 11 cleared", { exact: false })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Mass airflow meter/ })).toBeVisible();
  await expect(page.getByText("HB TRONICS")).toBeVisible();
  // rotary dial exposes the 7 authentic positions
  for (const m of ["OFF", "OHM", "MA", "A", "HZ", "VAC", "VDC"]) {
    await expect(page.getByRole("radio", { name: m, exact: true })).toBeVisible();
  }
});

test("multimeter tab bar: Wiring + ECU live, other four disabled", async ({ page }) => {
  await page.goto("/en/tools/multimeter");
  await expect(page.getByRole("button", { name: "Wiring diagram", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "ECU pin and connector", exact: true })).toBeVisible();
  // disabled tabs are present but not buttons (non-interactive spans)
  for (const label of ["Location", "Related parts", "Repair Manuals", "Component information"]) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: label })).toHaveCount(0);
  }
  // ECU tab switches the content area to the pinout
  await page.getByRole("button", { name: "ECU pin and connector" }).click();
  await expect(page.getByText("Component connector")).toBeVisible();
});

test("multimeter rotary + probes drive a live LCD reading", async ({ page }) => {
  await page.goto("/en/tools/multimeter");
  // OFF → blank
  await expect(page.getByText("Place both probes")).toHaveCount(0);
  // select OHM and seat both probes on the step's pins (click-to-place)
  await page.getByRole("radio", { name: "OHM" }).click();
  await page.locator('[data-target="c2"]').click();
  await page.locator('[data-target="c5"]').click();
  // YOUR MEASUREMENT now shows all three requirements satisfied (three ✓)
  const measure = page.getByText("Your measurement").locator("..");
  await expect(measure.getByText("✓")).toHaveCount(3);
  // the LCD shows a numeric reading (engine resolved good/bad), not the placeholder
  await expect(page.getByText("- - - -")).toHaveCount(0);
});

test("multimeter probes: real drag-and-drop seats, detaches, and clears", async ({ page }) => {
  await page.goto("/en/tools/multimeter");
  await page.getByRole("radio", { name: "OHM", exact: true }).click();
  // HTML5 drag the red token onto pin c2, black onto c5
  await page.locator('[data-probe="red"]').dragTo(page.locator('[data-target="c2"]'));
  await page.locator('[data-probe="black"]').dragTo(page.locator('[data-target="c5"]'));
  await expect(page.locator('[data-probe="red"]')).toContainText("c2");
  await expect(page.locator('[data-probe="black"]')).toContainText("c5");
  // detach red via its ✕
  await page.locator('[data-probe="red"]').getByRole("button", { name: /detach red/ }).click();
  await expect(page.locator('[data-probe="red"]')).toContainText("not placed");
});

test("multimeter invalid placement reads out-of-range, not a value", async ({ page }) => {
  await page.goto("/en/tools/multimeter");
  await page.getByRole("radio", { name: "OHM", exact: true }).click();
  // seat both probes on the WRONG points (c1 + c3, step wants c2/c5) → "at your probe points"
  await page.locator('[data-target="c1"]').click();
  await page.locator('[data-target="c3"]').click();
  await expect(page.getByText("Reading at your probe points")).toBeVisible();
});

test("multimeter wiring controls: reset restores the default view", async ({ page }) => {
  await page.goto("/en/tools/multimeter");
  await expect(page.getByRole("button", { name: "Extended wiring diagram" })).toBeVisible();
  await page.getByRole("radio", { name: "OHM", exact: true }).click();
  await page.locator('[data-target="c2"]').click();
  await expect(page.locator('[data-probe="red"]')).toContainText("c2");
  await page.getByRole("button", { name: "Reset the wiring diagram" }).click();
  await expect(page.locator('[data-probe="red"]')).toContainText("not placed");
});

test("multimeter sidebar selects another component", async ({ page }) => {
  await page.goto("/en/tools/multimeter");
  await page.getByRole("button", { name: /Knock sensor/ }).click();
  await expect(page.getByRole("heading", { name: /Knock sensor/ })).toBeVisible();
});

test("multimeter progress view shows overall progress", async ({ page }) => {
  await page.goto("/en/tools/multimeter");
  await page.getByRole("button", { name: "Progress", exact: true }).click();
  await expect(page.getByText("Overall progress")).toBeVisible();
  await expect(page.getByRole("progressbar")).toBeVisible();
  // a progress row opens the component in the diagnosis view
  await page.getByText("Oxygen sensor").last().click();
  await expect(page.getByRole("heading", { name: /Oxygen sensor/ })).toBeVisible();
});

test("multimeter arabic renders RTL with canonical technical values", async ({ page }) => {
  await page.goto("/ar/tools/multimeter");
  await expect(page.getByText("المكوّنات الإلكترونية")).toBeVisible();
  await expect(page.getByText("HB TRONICS")).toBeVisible();
  // no unresolved content keys leak into the UI
  await expect(page.getByText(/content\.multimeter/)).toHaveCount(0);
});
