import { test, expect, type Page } from "@playwright/test";
import { icons } from "../../src/data/icons";

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

test("a short flick closes the drawer; a short drag that stops springs back", async ({
  page,
}) => {
  test.skip(
    !!test.info().project.use.hasTouch,
    "mouse drag only on pointer devices",
  );
  // The gestures are dispatched inside the page in one task, with exact gaps between events, so the
  // speeds below don't depend on how busy the test machine is.
  const gesture = (
    moves: number[],
    gap: number,
    holdBefore: number,
    holdAfter: number,
  ) =>
    openDrawer(page)
      .locator("[data-drawer-handle]")
      .evaluate(
        (el, { moves, gap, holdBefore, holdAfter }) => {
          const wait = (ms: number) => {
            const end = performance.now() + ms;
            while (performance.now() < end);
          };
          const r = el.getBoundingClientRect();
          const x = r.left + 40;
          const y = r.top + r.height / 2;
          const fire = (type: string, dy: number) =>
            el.dispatchEvent(
              new PointerEvent(type, {
                bubbles: true,
                pointerId: 1,
                pointerType: "mouse",
                isPrimary: true,
                clientX: x,
                clientY: y + dy,
              }),
            );
          fire("pointerdown", 0);
          wait(holdBefore);
          for (const dy of moves) {
            fire("pointermove", dy);
            wait(gap);
          }
          wait(holdAfter);
          fire("pointerup", moves[moves.length - 1]!);
        },
        { moves, gap, holdBefore, holdAfter },
      );
  const trigger = page.locator("[data-drawer-open]").first();
  const openIt = async () => {
    await trigger.click();
    await expect(openDrawer(page)).toHaveClass(/is-visible/);
    await page.waitForTimeout(550);
  };

  // Hold still 400ms, then flick 60px in 80ms (under a quarter of the sheet). The speed at release
  // (~0.75 px/ms) counts, not the average since pointerdown (60px / 480ms = 0.125 px/ms, which the old
  // 0.4 px/ms cut-off let spring back).
  await openIt();
  await gesture([12, 24, 36, 48, 60], 16, 400, 0);
  await expect(page.locator("dialog[open]")).toHaveCount(0);

  // Drag 30px, stop for 300ms, let go: stays open and returns to its resting place.
  await openIt();
  const dialog = openDrawer(page);
  await gesture([6, 12, 18, 24, 30], 16, 0, 300);
  await page.waitForTimeout(600);
  await expect(dialog).toHaveClass(/is-visible/);
  await expect
    .poll(() => dialog.evaluate((el) => getComputedStyle(el).transform))
    .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
});

test("reduced motion: the drawer fades instead of sliding, and still closes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("[data-drawer-open]").first().click();
  const dialog = openDrawer(page);
  await expect(dialog).toHaveClass(/is-visible/);
  await expect
    .poll(() =>
      dialog.evaluate((el) => {
        const s = getComputedStyle(el);
        return `${s.transform} ${s.opacity}`;
      }),
    )
    .toBe("none 1");
  await page.keyboard.press("Escape");
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
    /^\d{1,2}:\d{2}\s?(AM|PM)$/,
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
  test.skip(
    test.info().project.name === "phone",
    "the header cat is hidden on phones",
  );
  const cat = page.locator("header-cat");
  await cat.click();
  await cat.dblclick();
  await cat.click({ clickCount: 3 });
  expect(await page.evaluate(() => getSelection()?.toString() ?? "")).toBe("");
});

test("phones hide the header cat; the icons sit on the name's line", async ({
  page,
}) => {
  test.skip(test.info().project.name !== "phone", "phones only");
  await expect(page.locator("header-cat")).toBeHidden();
  const h1 = (await page.locator(".top h1").boundingBox())!;
  const icon = (await page.locator(".social svg").first().boundingBox())!;
  expect(
    Math.abs(icon.y + icon.height / 2 - (h1.y + h1.height / 2)),
  ).toBeLessThan(2);
});

// Fakes only Date (page.clock also fakes performance, which breaks Astro's dev toolbar),
// then reloads. Pittsburgh is UTC-5 in November.
async function atUtc(page: Page, utc: string) {
  await page.addInitScript(
    (t) => {
      const Real = Date;
      class Fixed extends Real {
        constructor(...a: []) {
          if (a.length) super(...a);
          else super(t);
        }
        static now() {
          return t;
        }
      }
      window.Date = Fixed as DateConstructor;
    },
    Date.parse(`2026-11-24T${utc}:00Z`),
  );
  await page.reload();
}

for (const [utc, local] of [
  ["08:00", "3am"],
  ["17:00", "noon"],
] as const) {
  test(`header cat starts asleep at ${local} Pittsburgh time`, async ({
    page,
  }) => {
    await atUtc(page, utc);
    const cat = page.locator("header-cat");
    await expect(cat).toHaveAttribute("aria-label", "Sleeping cat");
    await expect(cat).not.toHaveClass(/awake/);
  });
}

test("sleeping header cat stirs on each click and wakes after 12 in a row", async ({
  page,
}) => {
  test.skip(
    test.info().project.name === "phone",
    "the header cat is hidden on phones",
  );
  await atUtc(page, "08:00");
  const cat = page.locator("header-cat");
  for (let i = 0; i < 11; i++) await cat.click();
  await expect(cat).toHaveClass(/peek/);
  await expect(cat).not.toHaveClass(/awake/);
  await cat.click();
  await expect(cat).toHaveClass(/awake/);
  await expect(cat).toHaveAttribute("aria-label", "Cat, awake");
});

test("home Writing section shows the featured posts", async ({ page }) => {
  await page.goto("/");
  const hrefs = await page
    .locator("section:has(#writing) a[href^='/writing/']:not(.all-writing)")
    .evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  // Featured posts come first, newest first (see `featured` in docs/CONTENT.md).
  expect(hrefs).toEqual([
    "/writing/rule-of-two-healthcare-rag/",
    "/writing/rag-evals-unanswerable-questions/",
    "/writing/clinical-data-validation-ai-evals/",
  ]);
  // Each row's tile shows its topic icon (series, else first tag; see writingIcons in src/lib/content.ts).
  const paths = await page
    .locator(
      "section:has(#writing) a[href^='/writing/']:not(.all-writing) .tile path",
    )
    .evaluateAll((ps) => ps.map((p) => p.getAttribute("d")));
  expect(paths).toEqual([icons.shield, icons.flask, icons.flask]);
});
