import { defineConfig } from "@playwright/test";

// Local runs start their own Astro dev server (drafts visible) on TEST_PORT (default 4329), so tests always
// exercise this checkout and never reuse or kill the dev server you browse on 4321.
// Parallel worktrees: give each its own TEST_PORT. Set BASE_URL to test a deployed site instead.
const port = Number(process.env.TEST_PORT ?? 4329);
const base = process.env.BASE_URL ?? `http://localhost:${port}`;
const chromium = { browserName: "chromium" as const };

export default defineConfig({
  testDir: "tests/visual",
  outputDir: "test-results/artifacts",
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "test-results/report" }],
  ],
  use: { baseURL: base, trace: "retain-on-failure" },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `npm run dev -- --port ${port} --strictPort --ignore-lock`,
        url: base,
        reuseExistingServer: false,
        timeout: 60_000,
      },
  projects: [
    {
      name: "phone",
      use: {
        ...chromium,
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "tablet",
      use: {
        ...chromium,
        viewport: { width: 768, height: 1024 },
        hasTouch: true,
      },
    },
    {
      name: "laptop",
      use: { ...chromium, viewport: { width: 1280, height: 800 } },
    },
    {
      name: "desktop",
      use: { ...chromium, viewport: { width: 1920, height: 1080 } },
    },
  ],
});
