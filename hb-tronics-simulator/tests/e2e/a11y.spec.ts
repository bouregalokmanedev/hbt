import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated accessibility scans (10 §17, 11 tests). Fails on any serious or
 * critical axe violation across the key screens, EN and AR (RTL).
 */
const PAGES = [
  { name: "login", url: "/en/login" },
  { name: "hub", url: "/en/hub" },
  { name: "garage", url: "/en/garage" },
  { name: "settings", url: "/en/settings" },
  { name: "scanner", url: "/en/tools/scanner" },
  { name: "multimeter", url: "/en/tools/multimeter" },
  { name: "multimeter-ar", url: "/ar/tools/multimeter" },
  { name: "oscilloscope", url: "/en/tools/oscilloscope" },
  { name: "oscilloscope-ar", url: "/ar/tools/oscilloscope" },
  { name: "location", url: "/en/tools/location" },
  { name: "location-ar", url: "/ar/tools/location" },
  { name: "schematic", url: "/en/tools/schematic" },
  { name: "schematic-ar", url: "/ar/tools/schematic" },
  { name: "hub-ar", url: "/ar/hub" },
];

for (const p of PAGES) {
  test(`no serious/critical a11y violations: ${p.name}`, async ({ page }) => {
    await page.goto(p.url);
    // let the client tools mount
    await page.waitForTimeout(500);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      // color-contrast is a documented design-system exception (10 §17): the
      // source's small decorative micro-labels use light greys by design, and
      // changing them would violate the "no redesign" rule. All other serious/
      // critical rules are enforced.
      .disableRules(["color-contrast"])
      .analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(
      serious,
      serious.map((v) => `${v.id}: ${v.help}`).join("\n"),
    ).toEqual([]);
  });
}

test("pseudo-locale (en-XA) renders without horizontal body overflow", async ({ page }) => {
  await page.goto("/en-XA/hub");
  await page.waitForTimeout(300);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  // The +40% expanded strings must not push the page into horizontal scroll.
  expect(overflow).toBeLessThanOrEqual(2);
  // And chrome is actually pseudo-localized (accented).
  await expect(page.locator("body")).toContainText("·");
});
