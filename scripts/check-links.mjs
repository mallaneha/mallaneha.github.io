#!/usr/bin/env node
// Checks every internal link and asset reference in the built site.
// Usage: node scripts/check-links.mjs [dist] [--external]
// --external also sends a HEAD request to each external http(s) URL (slow, needs network).
import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";

const args = process.argv.slice(2);
const root = resolve(args.find((a) => !a.startsWith("--")) ?? "dist");
const checkExternal = args.includes("--external");

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else if (entry.name.endsWith(".html")) out.push(p);
  }
  return out;
}

async function exists(p) {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
}

async function resolveInternal(fromFile, url) {
  const path = decodeURI(url.split(/[?#]/)[0]);
  if (path === "") return true; // same-page fragment
  const base = path.startsWith("/")
    ? join(root, path)
    : join(dirname(fromFile), path);
  return (
    (await exists(base)) ||
    (await exists(join(base, "index.html"))) ||
    (await exists(`${base}.html`))
  );
}

const attr = /\s(?:href|src)=["']([^"']+)["']/g;
const files = await walk(root);
const broken = [];
const external = new Set();

for (const file of files) {
  const html = await readFile(file, "utf8");
  for (const [, url] of html.matchAll(attr)) {
    if (/^(mailto:|tel:|data:|javascript:)/.test(url)) continue;
    if (/^https?:\/\//.test(url) || url.startsWith("//")) {
      external.add(url);
      continue;
    }
    if (!(await resolveInternal(file, url))) {
      broken.push(`${file.replace(root, "dist")} -> ${url}`);
    }
  }
}

if (checkExternal) {
  for (const url of external) {
    try {
      const res = await fetch(url, { method: "HEAD", redirect: "follow" });
      // Many sites (LinkedIn) block bots; only treat 404/410 as broken.
      if (res.status === 404 || res.status === 410)
        broken.push(`external -> ${url} (${res.status})`);
    } catch (err) {
      broken.push(`external -> ${url} (${err.message})`);
    }
  }
}

if (broken.length) {
  console.error(`✗ ${broken.length} broken link(s):\n  ${broken.join("\n  ")}`);
  process.exit(1);
}
console.log(
  `✓ links ok: ${files.length} pages, ${external.size} external link(s) ${checkExternal ? "checked" : "skipped (use --external)"}`,
);
