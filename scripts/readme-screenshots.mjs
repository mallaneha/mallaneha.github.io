import { chromium } from "@playwright/test";
// Usage: npm run build && npx astro preview --port 4391, then: node scripts/readme-screenshots.mjs
const base = process.env.BASE_URL ?? "http://localhost:4391";
const out = process.argv[2] ?? "docs/screenshots";
const b = await chromium.launch();
async function shot(
  name,
  path,
  { w = 1280, h = 900, dark = false, full = false, act } = {},
) {
  const ctx = await b.newContext({
    viewport: { width: w, height: h },
    colorScheme: dark ? "dark" : "light",
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  const p = await ctx.newPage();
  await p.goto(base + path, { waitUntil: "networkidle" });
  if (act) await act(p);
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${out}/${name}.png`, fullPage: full });
  await ctx.close();
}
await shot("home-light", "/");
await shot("home-dark", "/", { dark: true });
await shot("home-mobile", "/", { w: 375, h: 812 });
await shot("drawer", "/", {
  act: async (p) => {
    await p.locator("[data-drawer-open=work-vector-guard]").click();
  },
});
await shot("writing", "/writing/");
await shot("post-explainer", "/writing/build-attention/", {
  act: async (p) => {
    await p.mouse.wheel(0, 1400);
  },
});
await b.close();
