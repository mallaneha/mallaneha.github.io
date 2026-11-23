import { existsSync } from "node:fs";
import { join } from "node:path";
import { getCollection } from "astro:content";
import { site } from "../data/site";
import type { IconName } from "../data/icons";

/** The resume path, or null until the PDF is actually in public/ (so we never link a missing file). */
export const resumeHref =
  site.resume && existsSync(join(process.cwd(), "public", site.resume))
    ? site.resume
    : null;

/**
 * The icon on a writing row: the post's series, else its first tag, else `file`.
 * To change a post's icon, reorder its tags. Add a tag here when it starts leading a post.
 */
const writingIcons: Record<string, IconName> = {
  "llms-by-hand": "pen",
  security: "shield",
  evals: "flask",
  rag: "search",
};
export const writingIcon = (w: {
  data: { series?: string; tags: string[] };
}): IconName =>
  (w.data.series && writingIcons[w.data.series]) ||
  (w.data.tags[0] && writingIcons[w.data.tags[0]]) ||
  "file";

/**
 * Published writing, newest first. Drafts show in `npm run dev` only.
 * Posts in a series stay together in `part` order, placed where the series' newest part would be.
 * Ties on date fall back to the earliest id in each group, so the order never depends on load order.
 */
export async function getWriting() {
  const all = await getCollection(
    "writing",
    ({ data }) => import.meta.env.DEV || !data.draft,
  );
  const group = (e: (typeof all)[number]) => e.data.series ?? e.id;
  const newest = new Map<string, number>();
  const firstId = new Map<string, string>();
  for (const e of all) {
    const g = group(e);
    newest.set(g, Math.max(newest.get(g) ?? 0, e.data.date.valueOf()));
    if (!firstId.has(g) || e.id < firstId.get(g)!) firstId.set(g, e.id);
  }
  return all.sort(
    (a, b) =>
      newest.get(group(b))! - newest.get(group(a))! ||
      firstId.get(group(a))!.localeCompare(firstId.get(group(b))!) ||
      (a.data.part ?? 0) - (b.data.part ?? 0),
  );
}

export async function getProjects() {
  const all = await getCollection("projects");
  return all.sort((a, b) => a.data.order - b.data.order);
}

export async function getExperience() {
  const all = await getCollection("experience");
  return all.sort((a, b) => a.data.order - b.data.order);
}

export async function getEducation() {
  const all = await getCollection("education");
  return all.sort((a, b) => a.data.order - b.data.order);
}

/** Where a project's "Visit" link points: a published write-up, else the repo, else the demo. */
export function projectHref(
  links: { repo?: string; demo?: string; post?: string },
  published: Set<string>,
) {
  if (links.post && published.has(links.post))
    return { href: `/writing/${links.post}/`, label: "Read" };
  if (links.repo) return { href: links.repo, label: "Code" };
  if (links.demo) return { href: links.demo, label: "Visit" };
  return undefined;
}

export const years = (start: number, end?: number) =>
  end && end !== start ? `${start}–${end}` : String(start);

export function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
