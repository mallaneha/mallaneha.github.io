import { test, expect } from "@playwright/test";

// The "LLMs by hand" widgets (src/scripts/explainers.ts). Each check pins a number the post's text quotes,
// so the prose and the widget can't drift apart.

test("attention lab: default query for 'sat'", async ({ page }) => {
  await page.goto("/writing/build-attention/");
  const lab = page.locator("attention-lab .xp");
  await expect(lab).toBeVisible();
  await expect(lab.locator(".xp-summary")).toContainText(
    `"sat" puts 68% of its attention on "cat"`,
  );
  await expect(lab.locator(".xp-summary")).toContainText("(0.32, 0.90)");

  // Turning off the causal mask lets "sat" see "down".
  await lab.getByLabel(/Causal mask/).uncheck();
  const downRow = lab.locator("table").first().locator("tbody tr").nth(3);
  await expect(downRow).toContainText("4.3%");

  // Turning off scaling sharpens it.
  await lab.getByLabel(/Causal mask/).check();
  await lab.getByLabel(/Divide scores/).uncheck();
  await expect(lab.locator(".xp-summary")).toContainText("79%");

  // "The" can only see itself.
  await lab.getByLabel(/Divide scores/).check();
  await lab.getByRole("radio", { name: "The" }).check();
  await expect(lab.locator(".xp-summary")).toContainText(
    `"The" puts 100% of its attention on "The"`,
  );
});

test("scale lab renders and reacts", async ({ page }) => {
  await page.goto("/writing/build-attention/");
  const summary = page.locator("scale-lab .xp-summary");
  await expect(summary).toContainText("d_k = 128");
  await page.locator("scale-lab input[type=range]").fill("0");
  await expect(summary).toContainText("d_k = 2");
});

test("parameter counter: GPT-2 sizes", async ({ page }) => {
  await page.goto("/writing/build-gpt2-parameter-count/");
  const total = page.locator("gpt-shape .xp-big");
  await expect(total).toContainText("124,439,808");
  const preset = page.locator("gpt-shape select");
  await preset.selectOption({ label: "GPT-2 medium" });
  await expect(total).toContainText("354,823,168");
  await preset.selectOption({ label: "GPT-2 XL" });
  await expect(total).toContainText("1,557,611,200");

  // Heads don't change the count.
  await preset.selectOption({ label: "GPT-2 small" });
  await page.locator("gpt-shape input[type=range]").nth(2).fill("6");
  await expect(total).toContainText("124,439,808");
});

test("serving budget: LLaMA 2-13B on 8× TPU v5e", async ({ page }) => {
  await page.goto("/writing/build-a-serving-budget/");
  const w = page.locator("serving-budget .xp");
  const facts = w.locator(".xp-facts");
  await expect(facts).toContainText("819 kB");
  await expect(facts).toContainText("6.7 GB");
  await expect(facts).toContainText("Largest batch that fits16");
  await expect(facts).toContainText("Critical batch240");
  await expect(facts).toContainText("4.99 ms");
  await expect(facts).toContainText("201 tokens/s");

  // Batch 16: slider value 40 → 2^4 = 16.
  await w.locator("input[type=range]").fill("40");
  await expect(facts).toContainText("20.33 ms");
  await expect(facts).toContainText("787 tokens/s");

  // GQA: 83 sequences fit.
  await w.locator("select").first().selectOption({ index: 1 });
  await expect(facts).toContainText("Largest batch that fits83");
  await w.locator("input[type=range]").fill("60"); // 2^6 = 64
  await expect(facts).toContainText("3,752 tokens/s");

  // int8 weights and KV cache: 185 fit, critical batch halves to 120.
  await w.locator("select").nth(1).selectOption({ index: 1 });
  await w.locator("select").nth(2).selectOption({ index: 1 });
  await expect(facts).toContainText("Largest batch that fits185");
  await expect(facts).toContainText("Critical batch120");
  await expect(facts).toContainText("671.09 MB");

  // kipply: 52B on 4× A100.
  await w.locator("select").first().selectOption({ index: 2 });
  await expect(facts).toContainText("Largest batch that fits13");
  await expect(facts).toContainText("Critical batch208");
});

test("writing list keeps the LLMs by hand parts together and in order", async ({
  page,
}) => {
  for (const path of ["/writing/", "/"]) {
    await page.goto(path);
    const names = await page
      .locator("a[href^='/writing/build-']")
      .allTextContents();
    const parts = names
      .map((n) => n.match(/LLMs by hand, part (\d)/)?.[1])
      .filter(Boolean)
      .map(Number);
    // The home page shows only 3 posts (featured first), so the series may not be on it.
    if (path === "/" && parts.length === 0) continue;
    expect(parts.length, `${path} lists series parts`).toBeGreaterThan(0);
    expect(parts, `${path} order`).toEqual([...parts].sort());
    expect(parts[0], `${path} starts at part 1`).toBe(1);
  }
  // On the writing page all three parts are adjacent.
  await page.goto("/writing/");
  const hrefs = await page
    .locator("main a[href^='/writing/']")
    .evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  const idx = [
    "build-attention",
    "build-gpt2-parameter-count",
    "build-a-serving-budget",
  ].map((s) => hrefs.indexOf(`/writing/${s}/`));
  expect(idx[1]).toBe(idx[0] + 1);
  expect(idx[2]).toBe(idx[1] + 1);
});
