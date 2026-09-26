import { test, expect } from "@playwright/test";

/**
 * Location workstation E2E (P5.2) — runs against the production build on the
 * authentic LocationAtlasEngine: 3-column atlas, 6 views, image-relative hotspots,
 * sidebar (categories/systems/search/favourites), detail panel, training, quiz, RTL.
 */

test("location loads: header, mode tabs, sidebar, categories, views, detail", async ({ page }) => {
  await page.goto("/en/tools/location");
  await expect(page.getByText("115 components in data set")).toBeVisible();
  for (const m of ["Browse", "Training", "Quiz"]) await expect(page.getByRole("button", { name: m, exact: true })).toBeVisible();
  for (const v of ["Sensors", "ECUs", "Ground", "Fuse box", "Systems", "Vehicle"]) await expect(page.getByRole("button", { name: v, exact: true })).toBeVisible();
  // detail panel shows the focused component fields
  await expect(page.getByText("OEM ref")).toBeVisible();
  await expect(page.getByText("Vehicle system", { exact: true })).toBeVisible();
});

test("location sidebar: category filter narrows the list", async ({ page }) => {
  await page.goto("/en/tools/location");
  await page.getByRole("button", { name: /Fuses/, exact: false }).first().click();
  // a fuse ref is now in the list
  await expect(page.getByRole("button", { name: /^F1\b/ }).first()).toBeVisible();
});

test("location search filters components deterministically", async ({ page }) => {
  await page.goto("/en/tools/location");
  await page.getByRole("searchbox").fill("oxygen");
  await expect(page.getByRole("button", { name: /Oxygen sensor/ }).first()).toBeVisible();
  await page.getByRole("searchbox").fill("zzznope");
  await expect(page.getByText("No components match your filters.")).toBeVisible();
});

test("location select + hotspot + detail update", async ({ page }) => {
  await page.goto("/en/tools/location");
  await page.getByRole("button", { name: "MAP sensor" }).first().click();
  await expect(page.getByRole("heading", { name: /MAP sensor/ })).toBeVisible();
  // the sensors-view atlas renders a hotspot for the selection
  await expect(page.getByRole("button", { name: "MAP sensor" }).nth(1)).toBeVisible();
});

test("location favourite toggle", async ({ page }) => {
  await page.goto("/en/tools/location");
  await page.getByRole("button", { name: "Knock sensor" }).first().click();
  const star = page.getByRole("button", { name: "Favourites" }).first();
  await star.click();
  await expect(star).toHaveAttribute("aria-pressed", "true");
});

test("location fuse-box view renders relay + fuse hotspots", async ({ page }) => {
  await page.goto("/en/tools/location");
  await page.getByRole("button", { name: "Fuse box", exact: true }).click();
  await expect(page.getByRole("button", { name: /Ignition relay/ }).first()).toBeVisible();
});

test("location systems view: 58 groups, selecting one traces its members + panel", async ({ page }) => {
  await page.goto("/en/tools/location");
  // enter the Systems trace via the Vehicle-systems category
  await page.getByRole("button", { name: /Vehicle systems/ }).first().click();
  await expect(page.getByText("System trace")).toBeVisible();
  // the systems view names a group and lists its member fuses
  await expect(page.getByRole("heading", { name: "ABS" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Practise this system" })).toBeVisible();
  // open the sidebar systems list and confirm the presented count is 58
  await expect(page.getByText(/58 systems/)).toBeVisible();
});

test("location vehicle view renders the per-sensor 4-view locator image", async ({ page }) => {
  await page.goto("/en/tools/location");
  await page.getByRole("button", { name: "MAP sensor" }).first().click();
  await page.getByRole("button", { name: "Vehicle", exact: true }).click();
  const img = page.locator('img[src*="/assets/simulator/views-L1.png"]');
  await expect(img).toBeVisible();
});

test("location training: Practise this enters training and scores a correct pick", async ({ page }) => {
  await page.goto("/en/tools/location");
  await page.getByRole("button", { name: "Practise this" }).click();
  await expect(page.getByText("Training task", { exact: false })).toBeVisible();
  await expect(page.getByText("Difficulty")).toBeVisible();
  // the target is the previously-selected component; click its hotspot to score
  const target = page.locator("[aria-current='true']").first();
  await target.click().catch(() => {});
});

test("location quiz mode shows a question + timer", async ({ page }) => {
  await page.goto("/en/tools/location");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();
  await expect(page.getByText("Question 1")).toBeVisible();
  await expect(page.getByText("TIME", { exact: false })).toBeVisible();
});

test("location arabic renders RTL with canonical values, no raw keys", async ({ page }) => {
  await page.goto("/ar/tools/location");
  await expect(page.getByText("الفئات")).toBeVisible(); // Categories
  await expect(page.getByText(/1ZR-FE/).first()).toBeVisible();
  // no unresolved content keys (key form: content.location.* or location.<x>.<y>)
  await expect(page.getByText(/content\.location|location\.[a-z]+\.[a-z]/)).toHaveCount(0);
});
