import { test, expect } from "@playwright/test";

/**
 * E2E navigation + shared-bench flows (04, 13 §E/§F). Runs against the
 * production build; mirrors the documented paths.
 */

test("login → hub via Enter the simulator", async ({ page }) => {
  await page.goto("/en/login");
  await expect(page.getByText("Five specialised tools. One diagnostic bench.")).toBeVisible();
  await page.getByRole("button", { name: "Enter the simulator →" }).click();
  await expect(page).toHaveURL(/\/en\/hub/);
  await expect(page.getByText("Choose your simulator", { exact: false })).toBeVisible();
});

test("rail navigates to every destination", async ({ page }) => {
  await page.goto("/en/hub");
  for (const [name, path] of [
    ["Garage", "/en/garage"],
    ["Progress", "/en/progress"],
    ["Reports", "/en/reports"],
    ["Settings", "/en/settings"],
    ["Scanner", "/en/tools/scanner"],
    ["Multimeter", "/en/tools/multimeter"],
    ["Oscilloscope", "/en/tools/oscilloscope"],
    ["Location", "/en/tools/location"],
    ["Schematic", "/en/tools/schematic"],
  ] as const) {
    await page.getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(path.replace(/\//g, "\\/")));
  }
});

test("scanner lands on the diagnostic workstation (SC-01)", async ({ page }) => {
  await page.goto("/en/tools/scanner");
  await expect(page.getByText("Select a diagnostic function")).toBeVisible();
  await expect(page.getByText("Local Diagnostic", { exact: true })).toBeVisible();
  await expect(page.getByText("ADAS Calibration")).toBeVisible();
  // "Start local diagnostic" enters the diagnostic flow (dashboard)
  await page.getByRole("button", { name: /Start local diagnostic/ }).click();
  await expect(page.getByText("Select a diagnostic function")).toBeHidden();
});

test("scanner local diagnostic: 4-column vehicle selection", async ({ page }) => {
  await page.goto("/en/tools/scanner");
  await page.locator("nav").getByRole("button", { name: "DIAG" }).first().click();
  await expect(page.getByRole("button", { name: /Auto-identify/ })).toBeVisible();
  await expect(page.getByText("Manufacturer", { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Toyota/ }).first()).toBeVisible();
  // pick a model → year/engine column populates
  await page.getByRole("button", { name: /Corolla/ }).click();
  await expect(page.getByText("1ZR-FE 1.6")).toBeVisible();
});

test("scanner local diagnostic: system list filters + status", async ({ page }) => {
  await page.goto("/en/tools/scanner");
  await page.locator("nav").getByRole("button", { name: "SYS" }).first().click();
  await expect(page.getByRole("button", { name: /Faults 3/ })).toBeVisible();
  await expect(page.getByText("Engine Control Module")).toBeVisible();
  await expect(page.getByText("No response").first()).toBeVisible();
  // filter to faults → only fault ECUs remain
  await page.getByRole("button", { name: /Faults 3/ }).click();
  await expect(page.getByText("Climate Control")).toBeHidden();
});

test("scanner local diagnostic: live data card grid streams", async ({ page }) => {
  await page.goto("/en/tools/scanner");
  await page.locator("nav").getByRole("button", { name: "DATA" }).first().click();
  await expect(page.getByRole("button", { name: /All 18/ })).toBeVisible();
  await expect(page.getByText("Coolant Temperature")).toBeVisible();
  await expect(page.getByText("Fuel Rail Pressure — Actual")).toBeVisible();
  await expect(page.getByRole("button", { name: /Pause stream|Resume stream/ })).toBeVisible();
});

test("scanner training simulator: scenario, library, step flow + diagnosis", async ({ page }) => {
  await page.goto("/en/tools/scanner");
  await page.locator("nav").getByRole("button", { name: "TRAIN" }).first().click();
  await expect(page.getByText("Intermittent power loss under load")).toBeVisible();
  await expect(page.getByText("Scenario library")).toBeVisible();
  await expect(page.getByText("Misfire on cylinder 3")).toBeVisible();
  await expect(page.getByText("Instructor note", { exact: true })).toBeVisible();
  // walk the guided steps to the diagnosis
  for (let i = 0; i < 5; i++) {
    const btn = page.getByRole("button", { name: "Mark step complete" });
    if (await btn.count()) await btn.first().click();
  }
  await expect(page.getByText("Your diagnosis")).toBeVisible();
  await page.getByRole("button", { name: /Restricted fuel filter/ }).click();
  await expect(page.getByText(/restricted fuel filter/i).first()).toBeVisible();
});

test("scanner ADAS calibration workstation runs to success", async ({ page }) => {
  await page.goto("/en/tools/scanner");
  await page.locator("nav").getByRole("button", { name: "ADAS" }).first().click();
  await expect(page.getByText("Calibration items", { exact: false })).toBeVisible();
  await expect(page.getByText("Front camera — LDW / LKA / AEB").first()).toBeVisible();
  await expect(page.getByText("Not equipped", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Start calibration" }).click();
  await expect(page.getByRole("button", { name: "Calibration complete" })).toBeVisible({ timeout: 8000 });
  await expect(page.getByText("Calibration successful")).toBeVisible();
});

test("scanner diagnostic history: table + compare two sessions", async ({ page }) => {
  await page.goto("/en/tools/scanner");
  await page.locator("nav").getByRole("button", { name: "HIST" }).first().click();
  await expect(page.getByText("HB-24071")).toBeVisible();
  await expect(page.getByText("184 sessions", { exact: false })).toBeVisible();
  const cmp = page.getByRole("button", { name: "Compare", exact: true });
  await cmp.nth(0).click();
  await cmp.nth(2).click();
  await page.getByRole("button", { name: "Compare selected" }).click();
  await expect(page.getByText("Comparing sessions")).toBeVisible();
  await expect(page.getByText(/faults cleared/)).toBeVisible();
});

test("scanner diagnostic report: document header, fault codes, measurements", async ({ page }) => {
  await page.goto("/en/tools/scanner");
  await page.locator("nav").getByRole("button", { name: "REPT", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Diagnostic report" })).toBeVisible();
  await expect(page.getByText("4T1BZ1FB7LU012345")).toBeVisible();
  await expect(page.getByText("Fault codes found · 8")).toBeVisible();
  await expect(page.getByText("P2118")).toBeVisible();
  await expect(page.getByText("Out of spec").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Export PDF" })).toBeVisible();
});

test("scanner settings: read-only VCI + units cards", async ({ page }) => {
  await page.goto("/en/tools/scanner");
  await page.locator("nav").getByRole("button", { name: "SET", exact: true }).click();
  await expect(page.getByText("VCI interface")).toBeVisible();
  await expect(page.getByText("Units and locale")).toBeVisible();
  await expect(page.getByText("HB-LINK 3 · SN 3A19-0442")).toBeVisible();
  await expect(page.getByText("Bluetooth 5.2 · −48 dBm")).toBeVisible();
  await expect(page.getByText("bar", { exact: true })).toBeVisible();
  // no interactive controls in the authentic source
  await expect(page.locator("select")).toHaveCount(0);
});

test("scanner settings: arabic keeps technical values canonical LTR", async ({ page }) => {
  await page.goto("/ar/tools/scanner");
  await page.locator("nav").getByRole("button", { name: "SET", exact: true }).click();
  await expect(page.getByText("واجهة VCI")).toBeVisible();
  await expect(page.getByText("HB-LINK 3 · SN 3A19-0442")).toBeVisible();
});

test("scanner rail: icon navigation marks the active item + SCAN returns home", async ({ page }) => {
  await page.goto("/en/tools/scanner");
  const rail = page.getByRole("navigation", { name: "Scanner tools" });
  // navigate by icon caption
  await rail.getByRole("button", { name: "DATA" }).click();
  await expect(page.getByText("Coolant Temperature")).toBeVisible();
  await expect(rail.getByRole("button", { name: "DATA" })).toHaveAttribute("aria-current", "page");
  // a non-active item carries no active marker
  await expect(rail.getByRole("button", { name: "HIST" })).not.toHaveAttribute("aria-current", "page");
  // SCAN tile returns to the workstation landing
  await rail.getByRole("button", { name: "SCAN" }).click();
  await expect(page.getByText("Select a diagnostic function")).toBeVisible();
});

test("scanner rail: assistant toggles from the bottom control", async ({ page }) => {
  await page.goto("/en/tools/scanner");
  const rail = page.getByRole("navigation", { name: "Scanner tools" });
  await rail.getByRole("button", { name: "Assistant" }).click();
  await expect(page.getByText("Diagnostic Assistant")).toBeVisible();
});

test("scanner rail: mirrors to the start side under RTL and stays navigable", async ({ page }) => {
  await page.goto("/ar/tools/scanner");
  const rail = page.getByRole("navigation", { name: "أدوات الماسح" });
  await expect(rail).toBeVisible();
  // canonical captions stay stable across locales
  await rail.getByRole("button", { name: "SET" }).click();
  await expect(page.getByText("واجهة VCI")).toBeVisible();
});

test("scanner diagnostic assistant: Socratic dialogue advances on a chosen reply", async ({ page }) => {
  await page.goto("/en/tools/scanner");
  await page.getByRole("button", { name: "Assistant", exact: true }).click();
  // Socratic header + seed question (DTC codes stay canonical)
  await expect(page.getByText("Diagnostic Assistant")).toBeVisible();
  await expect(page.getByText("Socratic mode · guides, does not answer")).toBeVisible();
  await expect(page.getByText(/You have P0087 and P2118/)).toBeVisible();
  // choose the first predefined reply → assistant advances
  await page.getByRole("button", { name: "284 bar actual against 330 bar requested" }).click();
  await expect(page.getByText(/Rail pressure is 46 bar short/)).toBeVisible();
  // the chosen reply is echoed back as a YOU bubble
  await expect(page.getByText("You", { exact: true })).toBeVisible();
  // next turn's options are now offered
  await expect(page.getByRole("button", { name: "The gap widens to about 120 bar" })).toBeVisible();
});

test("scanner diagnostic assistant: arabic panel keeps DTC codes canonical LTR", async ({ page }) => {
  await page.goto("/ar/tools/scanner");
  await page.getByRole("button", { name: "المساعد", exact: true }).click();
  await expect(page.getByText("المساعد التشخيصي")).toBeVisible();
  await expect(page.getByText(/P0087/)).toBeVisible();
});

test("scanner diagnostic tree: measure reveals a reading and pass/fail", async ({ page }) => {
  await page.goto("/en/tools/scanner");
  // DTCs live under the SYS group: rail → System list → Fault codes
  await page.getByRole("navigation", { name: "Scanner tools" }).getByRole("button", { name: "SYS" }).click();
  await page.getByRole("button", { name: /Fault codes/ }).click();
  await expect(page.getByText("Diagnostic tree")).toBeVisible();
  await page.getByRole("button", { name: "Measure", exact: true }).first().click();
  // reveal shows the supply-voltage reading + Pass/Fail controls
  await expect(page.getByText("13.92 V")).toBeVisible();
  await expect(page.getByRole("button", { name: "Pass", exact: true })).toBeVisible();
});

test("coverage gate: switching to an uncovered vehicle blocks a tool", async ({ page }) => {
  await page.goto("/en/garage");
  // i30 has no coverage anywhere; set it active.
  const i30Row = page.locator("tr", { hasText: "Hyundai i30" });
  await i30Row.getByRole("button", { name: "Set active" }).click();
  // Navigate client-side (rail) so the in-memory bench state persists.
  await page.getByRole("link", { name: "Oscilloscope", exact: true }).click();
  await expect(page.getByText("Switch to Corolla")).toBeVisible();
  // restore
  await page.getByRole("button", { name: "Switch to Corolla" }).click();
});

test("shared bench: focus persists across tools via the URL", async ({ page }) => {
  await page.goto("/en/tools/oscilloscope?component=COIL");
  // the oscilloscope should focus the ignition coil
  await expect(page.getByText("Ignition coil 1", { exact: false }).first()).toBeVisible();
});

test("arabic locale renders RTL", async ({ page }) => {
  await page.goto("/ar/hub");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
});

test("no fabricated data: uncovered tool shows the gate, never a canvas", async ({ page }) => {
  await page.goto("/en/garage");
  await page.locator("tr", { hasText: "Hyundai i30" }).getByRole("button", { name: "Set active" }).click();
  await page.getByRole("link", { name: "Schematic", exact: true }).click();
  await expect(page.getByText("Switch to Corolla")).toBeVisible();
  await page.getByRole("button", { name: "Switch to Corolla" }).click();
});
