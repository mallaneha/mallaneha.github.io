import { test, expect, type Page } from "@playwright/test";

// Falling snow (src/scripts/snow.ts), settings in src/data/snow.ts.

const snow = (page: Page) => page.locator("canvas.snow");
const frames = (page: Page) =>
  snow(page).evaluate((c) => Number((c as HTMLCanvasElement).dataset.frames));

test("snow falls behind the page and never takes clicks", async ({ page }) => {
  await page.goto("/");
  await expect(snow(page)).toHaveCount(1);
  await expect(snow(page)).toHaveCSS("pointer-events", "none");
  await expect(snow(page)).toHaveCSS("z-index", "-1");
  const before = await frames(page);
  await expect.poll(() => frames(page)).toBeGreaterThan(before + 5);
  expect(Number(await snow(page).getAttribute("data-flakes"))).toBeGreaterThan(
    0,
  );
});

test("wind strength and direction come from settings or the URL", async ({
  page,
}) => {
  await page.goto("/?wind=80&direction=180");
  await expect(snow(page)).toHaveAttribute("data-wind-x", "-80.00");
  await page.goto("/?wind=0");
  await expect(snow(page)).toHaveAttribute("data-wind-x", "0.00");
});

test("snow holds still with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect.poll(() => frames(page)).toBeGreaterThan(0);
  const n = await frames(page);
  await page.waitForTimeout(400);
  expect(await frames(page)).toBe(n);
});
