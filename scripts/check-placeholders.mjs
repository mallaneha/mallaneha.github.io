// Fail if published content still contains an editing placeholder: [PERSONAL EXAMPLE: …], [GAP: …]
// or TODO(Neha). Drafts may keep them; they're only shown by `npm run dev`.
// Writing is a draft unless it says `draft: false` (the schema defaults to true). Projects, experience
// and src/data/ are always published.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const markers = [/\[PERSONAL EXAMPLE\b/, /\[GAP\b/, /TODO\(Neha\)/];
const roots = ["src/content", "src/data"];

const files = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : [p];
  });

function isDraft(file, text) {
  const fm = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const draft = fm.match(/^draft:\s*(true|false)\s*$/m)?.[1];
  if (draft) return draft === "true";
  return file.split(/[\\/]/).includes("writing"); // writing defaults to draft
}

let failed = 0;
let drafts = 0;
for (const file of roots.flatMap(files)) {
  if (!/\.(md|mdx|ts|json)$/.test(file)) continue;
  const text = readFileSync(file, "utf8");
  if (!markers.some((m) => m.test(text))) continue;
  if (file.endsWith(".md") && isDraft(file, text)) {
    drafts++;
    continue;
  }
  text.split("\n").forEach((line, i) => {
    if (markers.some((m) => m.test(line))) {
      console.error(
        `${relative(".", file)}:${i + 1}: placeholder in published content: ${line.trim()}`,
      );
      failed++;
    }
  });
}

if (failed) {
  console.error(
    `\n✗ ${failed} placeholder(s) in published content. Fill them in or set draft: true.`,
  );
  process.exit(1);
}
console.log(
  `✓ placeholders: none in published content (${drafts} draft(s) still have some)`,
);
