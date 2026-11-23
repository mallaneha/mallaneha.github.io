import { test, expect } from "@playwright/test";

// The RAG post widgets (src/scripts/rag-explainers.ts). Each check pins a number the post's text quotes,
// so the prose and the widget can't drift apart. These posts are drafts, so skip them on the live site.
test.skip(
  Boolean(process.env.BASE_URL),
  "draft posts only exist on the dev server",
);

test("abstain lab: floor 0 and 0.60", async ({ page }) => {
  await page.goto("/writing/rag-evals-unanswerable-questions/");
  const w = page.locator("abstain-lab .xp");
  const summary = w.locator(".xp-summary");
  await expect(summary).toContainText("answers 20 of 20");
  await expect(summary).toContainText("9 of 20 (45%)");

  await w.locator("input[type=range]").fill("0.6");
  await expect(summary).toContainText("answers 12 of 20 and refuses 8");
  await expect(summary).toContainText("3 of 20 (15%)");
  await expect(summary).toContainText("Wrong refusals: 4");

  // Without the unanswerable questions, 11 right drops to 9.
  await w.getByLabel(/can't answer/).uncheck();
  await expect(summary).toContainText("9 of 14 right");
  await w.locator("input[type=range]").fill("0");
  await expect(summary).toContainText("11 of 14 right");
});

test("code search: keyword, vector, hybrid ranks", async ({ page }) => {
  await page.goto("/writing/vector-search-medical-codes/");
  const w = page.locator("code-search .xp");
  const summary = w.locator(".xp-summary");
  await expect(summary).toContainText(
    "Keyword search ranks it #1, vector search #2, hybrid #1.",
  );
  await w.getByRole("radio", { name: "99213 copay" }).check();
  await expect(summary).toContainText(
    "Keyword search ranks it #1, vector search #2, hybrid #1.",
  );
  await w.getByRole("radio", { name: "high blood sugar" }).check();
  await expect(summary).toContainText(
    "Keyword search ranks it not found, vector search #1, hybrid #2.",
  );
  await w.getByLabel(/synonyms/).check();
  await expect(summary).toContainText(
    "Keyword search ranks it #2, vector search #1, hybrid #1.",
  );
});

test("rule of two: default is two properties, a [C] feature makes three", async ({
  page,
}) => {
  await page.goto("/writing/rule-of-two-healthcare-rag/");
  const w = page.locator("rule-of-two .xp");
  const verdict = w.locator(".xp-verdict");
  await expect(verdict).toContainText("Lower risk");
  await w.getByLabel(/Shows links and images/).check();
  await expect(verdict).toContainText("Danger: all three");
  await w.getByLabel(/approves every outbound action/).check();
  await expect(verdict).toContainText("waits for a person");
});

test("poison layers and attack gap", async ({ page }) => {
  await page.goto("/writing/measuring-rag-poisoning-defense/");
  const layers = page.locator("poison-layers .xp");
  await expect(layers.locator(".xp-summary").last()).toContainText(
    "Stopped at check 1, Structure.",
  );
  await layers.getByRole("radio", { name: "Fills a gap" }).check();
  await expect(layers.locator(".xp-summary").last()).toContainText(
    "Only the LLM score might flag it",
  );

  const gap = page.locator("attack-gap .xp");
  await expect(gap.locator(".xp-summary")).toContainText(
    "7 of 12 defenses hold attack success under 10%",
  );
  await gap.getByRole("radio", { name: /Adaptive/ }).check();
  await expect(gap.locator(".xp-summary")).toContainText(
    "9 of 12 defenses at 90% attack success or higher. The best one still let through 71%.",
  );
});
