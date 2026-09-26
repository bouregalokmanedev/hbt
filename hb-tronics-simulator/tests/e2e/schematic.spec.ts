import { test, expect } from "@playwright/test";

/**
 * Schematic workspace E2E (P6.2) — runs against the production build on the authentic
 * SchematicWorkspaceEngine: 3-region workspace, real raster diagram, 5 modes, netlist
 * pin table, guided traces, layers, search, connector/vehicle modals, circuit view, RTL.
 */

test("schematic loads: bars, modes, views, raster diagram, sidebar, summary", async ({ page }) => {
  await page.goto("/en/tools/schematic");
  for (const m of ["Study", "Trace", "Training", "Practice", "Exam"]) await expect(page.getByRole("button", { name: m, exact: true })).toBeVisible();
  for (const v of ["Schematic", "Circuit view"]) await expect(page.getByRole("button", { name: v, exact: true })).toBeVisible();
  // the authentic raster diagram is the visual base
  await expect(page.locator('img[src*="/assets/simulator/diagram-r16.png"]').first()).toBeVisible();
  // sheet summary shows the verified counts
  await expect(page.getByText("133", { exact: true }).first()).toBeVisible();
});

test("schematic component selection loads the pin table + stats", async ({ page }) => {
  await page.goto("/en/tools/schematic");
  await page.getByRole("button", { name: "E1 Engine control unit" }).first().click();
  await expect(page.getByRole("heading", { name: /Engine control unit/ })).toBeVisible();
  await expect(page.getByText("ECU PIN TABLE — ALL ROWS")).toBeVisible();
});

test("schematic pin-table row selection reveals the selected wire", async ({ page }) => {
  await page.goto("/en/tools/schematic");
  await page.getByRole("button", { name: /Knock sensor/ }).first().click();
  await expect(page.getByText("PIN-TABLE ROWS", { exact: true })).toBeVisible();
  // click a pin-table row (I2 uses ECU pin B 124)
  await page.getByRole("button", { name: /B 124/ }).first().click();
  await expect(page.getByText("SELECTED WIRE")).toBeVisible();
});

test("schematic trace mode: pick a trace + play/pause", async ({ page }) => {
  await page.goto("/en/tools/schematic");
  await page.getByRole("button", { name: "Trace", exact: true }).click();
  await expect(page.getByText("TRACE", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ignition coil 1" }).first().click();
  await expect(page.getByRole("button", { name: /Pause/ }).first()).toBeVisible();
});

test("schematic layers panel toggles a layer", async ({ page }) => {
  await page.goto("/en/tools/schematic");
  await page.getByRole("button", { name: /Layers/ }).first().click();
  const grounds = page.getByRole("button", { name: "Grounds", exact: true });
  await expect(grounds).toHaveAttribute("aria-pressed", "true");
  await grounds.click();
  await expect(grounds).toHaveAttribute("aria-pressed", "false");
  // NO-DATA layers are disabled
  await expect(page.getByRole("button", { name: /FlexRay/ })).toBeDisabled();
});

test("schematic search palette finds a component", async ({ page }) => {
  await page.goto("/en/tools/schematic");
  await page.getByRole("button", { name: /Search wire/ }).click();
  const box = page.getByRole("dialog").getByRole("textbox");
  await box.fill("ignition coil");
  await expect(page.getByRole("dialog").getByText(/Ignition coil relay/).first()).toBeVisible();
});

test("schematic connector modal lists ECU pins", async ({ page }) => {
  await page.goto("/en/tools/schematic");
  await page.getByRole("button", { name: /Connector A — 34 pins/ }).click();
  await expect(page.getByRole("dialog").getByText(/connector A/)).toBeVisible();
});

test("schematic training: answering the task target scores", async ({ page }) => {
  await page.goto("/en/tools/schematic");
  await page.getByRole("button", { name: "Training", exact: true }).click();
  await expect(page.getByText("TRAINING TASK", { exact: true })).toBeVisible();
  // task 0 target is fuse EFI 1 — click its hotspot
  await page.getByRole("button", { name: /Fuse EFI 1/ }).first().click();
  await expect(page.getByText(/Correct\./).first()).toBeVisible();
});

test("schematic practice: deterministic MCQ options render", async ({ page }) => {
  await page.goto("/en/tools/schematic");
  await page.getByRole("button", { name: "Practice", exact: true }).click();
  await expect(page.getByText("PRACTICE — GENERATED FROM PIN TABLE")).toBeVisible();
  await expect(page.getByRole("button", { name: /ECU pin/ }).first()).toBeVisible();
});

test("schematic exam: masked labels + submit flow", async ({ page }) => {
  await page.goto("/en/tools/schematic");
  await page.getByRole("button", { name: "Exam", exact: true }).click();
  await expect(page.getByText("EXAM", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next question" })).toBeVisible();
});

test("schematic circuit view renders the column graph", async ({ page }) => {
  await page.goto("/en/tools/schematic");
  await page.getByRole("button", { name: "Circuit view", exact: true }).click();
  await expect(page.getByText("SENSORS", { exact: true })).toBeVisible();
  await expect(page.getByText("GROUNDS", { exact: true })).toBeVisible();
});

test("schematic arabic renders RTL with canonical codes/pins, no raw keys", async ({ page }) => {
  await page.goto("/ar/tools/schematic");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByText(/دراسة/).first()).toBeVisible(); // Study
  await expect(page.getByText(/R16/).first()).toBeVisible(); // canonical LTR
  await expect(page.getByText(/content\.schematic|schematic\.[a-z]+\.[a-z]/)).toHaveCount(0);
});
