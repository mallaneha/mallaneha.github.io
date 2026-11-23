// /llms.txt: a plain-text summary of the site for AI tools (https://llmstxt.org).
import type { APIRoute } from "astro";
import { site } from "../data/site";
import {
  getWriting,
  getProjects,
  getExperience,
  projectHref,
  years,
  resumeHref,
} from "../lib/content";

export const GET: APIRoute = async () => {
  const [projects, experience, writing] = await Promise.all([
    getProjects(),
    getExperience(),
    getWriting(),
  ]);
  const abs = (path: string) => new URL(path, site.url).toString();
  const published = new Set(writing.map((w) => w.id));
  const projectLine = (p: (typeof projects)[number]) => {
    const link = projectHref(p.data.links, published);
    const href = link && abs(link.href);
    const title = href ? `[${p.data.title}](${href})` : p.data.title;
    return `- ${title}${p.data.status === "building" ? " (in progress)" : ""}: ${p.data.summary}${p.data.tech.length ? ` (${p.data.tech.join(", ")})` : ""}`;
  };

  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.tagline}`,
    "",
    site.summary,
    ...(site.availability ? ["", `Availability: ${site.availability}.`] : []),
    "",
    "## Projects",
    ...projects.map(projectLine),
    "",
    "## Experience",
    ...experience.map(
      (e) =>
        `- ${e.data.company}, ${e.data.role} (${years(e.data.start, e.data.end)})${e.data.location ? `, ${e.data.location}` : ""}`,
    ),
    "",
    "## Writing",
    ...(writing.length
      ? writing.map(
          (w) =>
            `- [${w.data.title}](${abs(`/writing/${w.id}/`)}): ${w.data.description}`,
        )
      : ["- No posts yet."]),
    "",
    "## Contact",
    `- Email: ${site.email}`,
    `- LinkedIn: ${site.links.linkedin}`,
    `- GitHub: ${site.links.github}`,
    ...(resumeHref ? [`- Resume: ${abs(resumeHref)}`] : []),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
