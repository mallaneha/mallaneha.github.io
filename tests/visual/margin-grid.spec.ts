import { test, expect, type Page } from "@playwright/test";

// The margin grid (src/scripts/margin-grid.ts): noise texture in the side margins from 1024px up.

const grid = (page: Page) => page.locator("canvas.margin-grid");
const frames = (page: Page) =>
  grid(page).evaluate((c) => Number((c as HTMLCanvasElement).dataset.frames));

// Share of non-transparent pixels in a rectangle of the canvas, in CSS px.
const inked = (page: Page, x: number, y: number, w: number, h: number) =>
  grid(page).evaluate(
    (c, r) => {
      const canvas = c as HTMLCanvasElement;
      const dpr = canvas.width / canvas.clientWidth;
      const ctx = canvas.getContext("2d")!;
      const d = ctx.getImageData(
        Math.round(r.x * dpr),
        Math.round(r.y * dpr),
        Math.max(1, Math.round(r.w * dpr)),
        Math.max(1, Math.round(r.h * dpr)),
      ).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i]) n++;
      return n / (d.length / 4);
    },
    { x, y, w, h },
  );

const snapshot = (page: Page) =>
  grid(page).evaluate((c) => (c as HTMLCanvasElement).toDataURL());

test("wide screens: a decorative grid fills the margins, never the text column", async ({
  page,
}) => {
  const vw = page.viewportSize()!.width;
  test.skip(vw < 1024, "only from 1024px up");
  await page.goto("/");
  await expect.poll(() => frames(page)).toBeGreaterThan(1);

  const canvas = grid(page);
  await expect(canvas).toHaveAttribute("aria-hidden", "true");
  expect(await canvas.evaluate((c) => getComputedStyle(c).pointerEvents)).toBe(
    "none",
  );

  const main = (await page.locator("main").boundingBox())!;
  const vh = page.viewportSize()!.height;
  expect(await inked(page, main.x, 0, main.width, vh)).toBe(0);
  expect(await inked(page, 0, 0, main.x, vh)).toBeGreaterThan(0.02);
  expect(
    await inked(page, main.x + main.width, 0, vw - main.x - main.width, vh),
  ).toBeGreaterThan(0.02);
});

test("phones and tablets: no grid", async ({ page }) => {
  test.skip(page.viewportSize()!.width >= 1024, "below 1024px only");
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.waitForTimeout(300);
  await expect(grid(page)).toHaveCount(0);
});

test("drifts, but stays still with reduced motion", async ({ page }) => {
  test.skip(page.viewportSize()!.width < 1024, "only from 1024px up");
  await page.goto("/?seed=3");
  await expect.poll(() => frames(page)).toBeGreaterThan(1);
  const a = await snapshot(page);
  await page.waitForTimeout(1500);
  expect(await snapshot(page)).not.toBe(a);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect.poll(() => frames(page)).toBeGreaterThan(0);
  const b = await snapshot(page);
  const n = await frames(page);
  await page.waitForTimeout(600);
  expect(await frames(page)).toBe(n);
  expect(await snapshot(page)).toBe(b);
});

test("stops while the tab is hidden", async ({ page }) => {
  test.skip(page.viewportSize()!.width < 1024, "only from 1024px up");
  await page.goto("/");
  await expect.poll(() => frames(page)).toBeGreaterThan(1);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const n = await frames(page);
  await page.waitForTimeout(500);
  // At most the one frame drawn while pausing.
  expect(await frames(page)).toBeLessThanOrEqual(n + 1);
});
