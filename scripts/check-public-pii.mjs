// Fail if any file in public/ contains something that looks like a phone number.
// PDFs are read with `pdftotext` (poppler); if it isn't installed, PDFs are skipped with a warning.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.argv[2] ?? "public";
const phone = [
  /\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]\d{4}\b/, // (412) 555-0100, 412.555.0100, 412 555 0100
  /\+\d{1,3}[\s-]?\d{2,5}[\s-]?\d{3,5}[\s-]?\d{3,6}/, // +91 98765 43210, +1 412 555 0100
];
const textExt = new Set([
  ".txt",
  ".html",
  ".md",
  ".json",
  ".svg",
  ".xml",
  ".csv",
  ".vcf",
]);

const files = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : [p];
  });

let pdftotext = true;
let failed = 0;
for (const file of files(root)) {
  const ext = extname(file).toLowerCase();
  let text = null;
  if (ext === ".pdf") {
    if (!pdftotext) continue;
    try {
      text = execFileSync("pdftotext", [file, "-"], { encoding: "utf8" });
    } catch (e) {
      if (e.code === "ENOENT") {
        pdftotext = false;
        console.warn("pii: pdftotext not installed, skipping PDFs in", root);
        continue;
      }
      throw e;
    }
  } else if (textExt.has(ext)) {
    text = readFileSync(file, "utf8");
  }
  if (text && phone.some((re) => re.test(text))) {
    console.error(
      `pii: ${file} looks like it contains a phone number. Remove it before publishing.`,
    );
    failed++;
  }
}
if (failed) process.exit(1);
console.log(`pii: no phone numbers found in ${root}/`);
