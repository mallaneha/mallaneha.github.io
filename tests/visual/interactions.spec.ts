import { test, expect, type Page } from "@playwright/test";

// Drawers (src/scripts/drawer.ts) and click effects (src/scripts/effects.ts) on the home page.

const openDrawer = (page: Page) =>
  page.locator("dialog[data-drawer][open]").first();

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("every drawer row opens its drawer, and Esc closes it", async ({
  page,
}, info) => {
  const triggers = page.locator("[data-drawer-open]");
  const count = await triggers.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const trigger = triggers.nth(i);
    const id = await trigger.getAttribute("data-drawer-open");
    await trigger.click();
    const dialog = page.locator(`dialog#${id}`);
    await expect(dialog).toHaveClass(/is-visible/);
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    // Sheet is on screen and within the viewport width.
    const box = await dialog.boundingBox();
    const vw = page.viewportSize()!.width;
    expect(box && box.width <= vw && box.y >= 0).toBeTruthy();
    const overflow = await dialog
      .locator(".body")
      .evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(overflow, `${id} body scrolls sideways`).toBe(false);
    await page.waitForTimeout(550);
    await page.screenshot({
      path: `test-results/shots/${info.project.name}/drawer-${id}.png`,
    });
    await page.keyboard.press("Escape");
    await expect(dialog).not.toHaveAttribute("open");
  }
});

test("close button, backdrop click and arrow keys", async ({ page }) => {
  const first = page.locator("[data-drawer-open]").first();
  await first.click();
  await expect(openDrawer(page)).toHaveClass(/is-visible/);
  const firstId = await openDrawer(page).getAttribute("id");

  await page.keyboard.press("ArrowRight");
  await expect(openDrawer(page)).not.toHaveAttribute("id", firstId!);
  await page.keyboard.press("ArrowLeft");
  await expect(openDrawer(page)).toHaveAttribute("id", firstId!);

  await openDrawer(page).locator("[data-drawer-close]").click();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  // Focus returns to the row that opened the drawer.
  const firstTarget = await first.getAttribute("data-drawer-open");
  await expect
    .poll(() =>
      page.evaluate(() =>
        document.activeElement?.getAttribute("data-drawer-open"),
      ),
    )
    .toBe(firstTarget);

  await first.click();
  await expect(openDrawer(page)).toHaveClass(/is-visible/);
  await page.mouse.click(5, 5); // backdrop, above the sheet
  await expect(page.locator("dialog[open]")).toHaveCount(0);
});

test("dragging the header down closes the drawer", async ({ page }) => {
  test.skip(
    !!test.info().project.use.hasTouch,
    "mouse drag only on pointer devices",
  );
  await page.locator("[data-drawer-open]").first().click();
  const dialog = openDrawer(page);
  await expect(dialog).toHaveClass(/is-visible/);
  await page.waitForTimeout(550);
  const head = await dialog.locator("[data-drawer-handle]").boundingBox();
  const x = head!.x + 40;
  const y = head!.y + head!.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 400, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
});

test("deep link opens a drawer on load", async ({ page }) => {
  const id = await page
    .locator("[data-drawer-open]")
    .first()
    .getAttribute("data-drawer-open");
  await page.goto(`/#${id}`);
  await expect(page.locator(`dialog#${id}`)).toHaveAttribute("open");
});

test("drawer 'How it works' cards open and fit", async ({ page }) => {
  const id = await page
    .locator("[data-drawer-open]")
    .first()
    .getAttribute("data-drawer-open");
  await page.locator(`[data-drawer-open="${id}"]`).click();
  const dialog = page.locator(`dialog#${id}`);
  const cards = dialog.locator("details.mk");
  await expect(cards.first()).toBeVisible(); // mockups.ts loads lazily
  // No "···" dividers once the cards are in.
  const dots = await dialog
    .locator(".case > h2")
    .nth(1)
    .evaluate((h) => getComputedStyle(h, "::before").content);
  expect(dots === "none" || dots === "normal").toBeTruthy();
  for (let i = 0; i < (await cards.count()); i++) {
    const card = cards.nth(i);
    await card.locator("summary").click();
    await expect(card).toHaveAttribute("open", "");
    await expect(card.locator(".mk-context")).not.toBeEmpty();
    await expect(card.locator(".mk-note")).not.toBeEmpty();
  }
  const overflow = await dialog.evaluate((d) => {
    const body = d.querySelector(".body")!;
    return body.scrollWidth - body.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
});

test("click effects: spark canvas, mute toggle, copy email", async ({
  page,
  context,
  browserName,
}) => {
  await expect(page.locator("canvas.spark-canvas")).toHaveCount(1);

  const toggle = page.locator("[data-effects-toggle]");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await page.reload();
  await expect(page.locator("[data-effects-toggle]")).toHaveAttribute(
    "aria-pressed",
    "false",
  );

  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page
      .locator('section[aria-labelledby="connect"] [data-copy]')
      .click();
    await expect(page.locator("#toast")).toHaveText("Email copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "nehamalla99@gmail.com",
    );
  }
  // The address is spelled out in the HTML so scrapers miss it.
  expect(await page.content()).not.toMatch(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
});

test("click effects and the sound toggle are on every page; footer shows local time", async ({
  page,
}) => {
  await expect(page.locator("[data-local-time] time")).toHaveText(
    /^\d{1,2}:\d{2}:\d{2}\s?(AM|PM)$/,
  );
  for (const path of ["/writing/", "/writing/build-attention/", "/404"]) {
    await page.goto(path);
    await expect(page.locator("canvas.spark-canvas")).toHaveCount(1);
    await expect(page.locator("[data-effects-toggle]")).toHaveCount(1);
    await expect(page.locator("[data-local-time]")).toBeVisible();
  }
});

test("theme toggle flips the theme and remembers it", async ({ page }) => {
  const bg = () =>
    page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const toggle = page.locator("[data-theme-toggle]");
  const before = await bg();
  const wasDark = (await toggle.getAttribute("aria-pressed")) === "true";

  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme",
    wasDark ? "light" : "dark",
  );
  await expect(toggle).toHaveAttribute("aria-pressed", String(!wasDark));
  expect(await bg()).not.toBe(before);

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme",
    wasDark ? "light" : "dark",
  );
  await expect(page.locator("[data-theme-toggle]")).toHaveAttribute(
    "aria-pressed",
    String(!wasDark),
  );
});

test("clicking or double-clicking the header cat selects no text", async ({
  page,
}) => {
  const cat = page.locator("header-cat");
  await cat.click();
  await cat.dblclick();
  await cat.click({ clickCount: 3 });
  expect(await page.evaluate(() => getSelection()?.toString() ?? "")).toBe("");
});

test("header cat: first click opens its eyes, a second click sits it up", async ({
  page,
}) => {
  const cat = page.locator("header-cat");
  await cat.click();
  await expect(cat).toHaveClass(/peek/);
  await cat.click();
  await expect(cat).toHaveClass(/awake/);
  await expect(cat).not.toHaveClass(/awake/, { timeout: 6000 });
});
