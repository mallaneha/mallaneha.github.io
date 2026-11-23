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
  await page.goto("/?seed=7");
  await expect.poll(() => frames(page)).toBeGreaterThan(1);

  const canvas = grid(page);
  await expect(canvas).toHaveAttribute("aria-hidden", "true");
  expect(await canvas.evaluate((c) => getComputedStyle(c).pointerEvents)).toBe(
    "none",
  );

  const main = (await page.locator("main").boundingBox())!;
  const vh = page.viewportSize()!.height;
  expect(await inked(page, main.x, 0, main.width, vh)).toBe(0);
  // Sparse by design, so check both margins together.
  const left = await inked(page, 0, 0, main.x, vh);
  const right = await inked(
    page,
    main.x + main.width,
    0,
    vw - main.x - main.width,
    vh,
  );
  expect(left + right).toBeGreaterThan(0);
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

test("hovering a cluster reveals the color of a few of its cells, and keeps the shape", async ({
  page,
}) => {
  const vw = page.viewportSize()!.width;
  test.skip(vw < 1024, "only from 1024px up");
  const colored = () =>
    grid(page).evaluate((c) =>
      Number((c as HTMLCanvasElement).dataset.colored),
    );
  // A still frame (reduced motion) so the clusters stay put while we hover them.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?seed=7");
  await expect.poll(() => frames(page)).toBeGreaterThan(0);
  await page.mouse.move(vw / 2, 300); // text column: nothing revealed
  await expect.poll(colored).toBe(0);
  const points = await grid(page).evaluate((c) => {
    const canvas = c as HTMLCanvasElement;
    const dpr = canvas.width / canvas.clientWidth;
    const d = canvas
      .getContext("2d")!
      .getImageData(0, 0, canvas.width, canvas.height).data;
    const out: number[][] = [];
    for (let y = 0; y < canvas.height; y += Math.round(10 * dpr))
      for (let x = 0; x < canvas.width; x += Math.round(10 * dpr))
        if (d[(y * canvas.width + x) * 4 + 3])
          out.push([x / dpr + 5, y / dpr + 5]);
    return out;
  });
  test.skip(points.length === 0, "no lit cells for this seed and size");
  const [x, y] = points[Math.floor(points.length / 2)];
  await page.mouse.move(x, y);
  await expect.poll(colored).toBeGreaterThan(0);
  expect(await colored()).toBeLessThanOrEqual(9);
  // Empty space reveals nothing.
  await page.mouse.move(vw / 2, 300);
  await expect.poll(colored).toBe(0);
});
