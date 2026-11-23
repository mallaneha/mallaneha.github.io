// Content schema. Human-readable version: docs/CONTENT.md. Keep the two in sync.
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { iconNames } from "./data/icons";

const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const md = (dir: string) =>
  glob({ pattern: "**/*.md", base: `./src/content/${dir}` });

const writing = defineCollection({
  loader: md("writing"),
  schema: z.object({
    title: z.string().max(70),
    description: z.string().max(160),
    date: z.coerce.date(),
    type: z.enum(["post", "note"]).default("post"),
    tags: z.array(z.string().regex(slug)).default([]),
    draft: z.boolean().default(true),
  }),
});

const projects = defineCollection({
  loader: md("projects"),
  schema: z.object({
    title: z.string(),
    summary: z.string().max(60),
    year: z.number().int(),
    status: z.enum(["building", "shipped"]),
    featured: z.boolean().default(false),
    icon: z.enum(iconNames),
    tech: z.array(z.string()).default([]),
    links: z
      .object({
        repo: z.url().optional(),
        demo: z.url().optional(),
        post: z.string().regex(slug).optional(),
      })
      .default({}),
    order: z.number().int().default(100),
  }),
});

const experience = defineCollection({
  loader: md("experience"),
  schema: z.object({
    company: z.string(),
    role: z.string(),
    start: z.number().int(),
    end: z.number().int().optional(),
    location: z.string().optional(),
    summary: z.string().max(60),
    icon: z.enum(iconNames),
    url: z.url().optional(),
    order: z.number().int().default(100),
  }),
});

export const collections = { writing, projects, experience };
