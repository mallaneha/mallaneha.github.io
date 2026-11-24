import { readdirSync, readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";

// Drafts only exist on the dev server, so skip them when testing a deployed site.
const live = Boolean(process.env.BASE_URL);
const writingDir = "src/content/writing";
const posts = readdirSync(writingDir)
  .filter((f) => f.endsWith(".md"))
  .filter(
    (f) =>
      !live ||
      !/^draft:\s*true\s*$/m.test(readFileSync(`${writingDir}/${f}`, "utf8")),
  )
  .map((f) => `/writing/${f.replace(/\.md$/, "")}/`);

// The widget gallery is a dev-only page (src/pages/dev/[page].astro), so it's tested locally but not live.
const pages = [
  "/",
  ...posts,
  ...(live ? [] : ["/dev/widgets/"]),
  "/this-page-does-not-exist/",
];

for (const path of pages) {
  for (const scheme of ["light", "dark"] as const) {
    test(`renders ${path} (${scheme})`, async ({ page }, info) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      // Dark is the default whatever the system says; a saved choice picks light.
      await page.emulateMedia({ colorScheme: scheme });
      await page.addInitScript((t) => localStorage.setItem("theme", t), scheme);
      await page.goto(path);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflow, "page scrolls sideways").toBe(false);
      // querySelectorAll skips shadow DOM, so the Astro dev toolbar's headings don't count.
      const h1s = await page.evaluate(
        () => document.querySelectorAll("h1").length,
      );
      expect(h1s, "exactly one <h1>").toBe(1);

      const name =
        path === "/"
          ? "home"
          : path.replace(/^\/|\/$/g, "").replaceAll("/", "_");
      await page.screenshot({
        path: `test-results/shots/${info.project.name}/${name}-${scheme}.png`,
        fullPage: true,
      });
      // The 404 path logs a failed request in the console; that's expected.
      const real = errors.filter((e) => !/404|Not Found/i.test(e));
      expect(real).toEqual([]);
    });
  }
}
