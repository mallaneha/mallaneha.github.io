# Content schema

Enforced by `src/content.config.ts`: a wrong or missing field fails `npm run check`.
Copy an existing file rather than starting from scratch.

## Writing: `src/content/writing/<slug>.md` → `/writing/<slug>/`

```yaml
---
title: "Required, ≤ 70 chars"
description: "Required, one sentence, ≤ 160 chars. Used in lists, meta tags and llms.txt."
date: 2026-11-22 # required, YYYY-MM-DD
type: post # post (full article) or note (3–5 sentence finding)
tags: [evals, rag] # optional, lowercase-kebab, reuse existing tags first
draft: true # new writing starts as a draft; drafts only show in `npm run dev`
---
```

Existing tags: `evals`, `rag`, `agents`, `healthcare`, `governance`, `security`, `llm-systems`.

## Project: `src/content/projects/<slug>.md`

```yaml
---
title: "Vector Guard"
summary: "Defending RAG against poisoning" # ≤ 60 chars, shown under the name and in the drawer header
year: 2026
status: shipped # building → "Building" section (static row)
featured: true # true → "Featured" row that opens a drawer with the body below
icon: shield # one of the names in src/data/icons.ts
tech: [Python] # optional
links: # all optional; the drawer pill links to: published post ("Read"), else repo ("Code"), else demo ("Visit")
  repo: https://github.com/mallaneha/...
  demo: https://...
  post: writing-slug
order: 10 # lower shows first
---
```

## Experience: `src/content/experience/<slug>.md`

```yaml
---
company: "Autonomize AI"
role: "AI/ML Intern"
start: 2026
end: 2026 # omit if current
location: "Austin, TX" # optional, city only
summary: "AI/ML Intern · 2026" # ≤ 60 chars, shown under the name
icon: pulse
url: https://... # optional, becomes the drawer's "Visit" pill
order: 10
---
```

## Drawer case study (body of featured projects and experience)

Modeled on ch.sh. Sections run top to bottom, separated automatically by `···`.

```md
## Overview

Two or three sentences: what it is and why it matters.

<div class="stats">
  <div><strong>59% → 3%</strong><span>attack success</span></div>
  <div><strong>1,063</strong><span>documents</span></div>
</div>

## Approach

### Context

The problem.

### Principles

- One line each

### Audience

Who it's for.

## <Feature or phase>

What I built, with one number.

<ol class="flow">
  <li>Step one</li>
  <li>Step two</li>
</ol>

> A one-line footnote, shown under a dotted rule.

## Takeaways

What changed, and what I learned.
```

- `##` starts a section, `###` is a small label, `>` is the section's footnote.
- `stats` (2–3 tiles) and `flow` (2–5 steps) are optional. Only use numbers from the resume or SPEC.

## Short copy

Name, tagline, intro, availability badge, contact links, resume path and footer motto are in
`src/data/site.ts`.

### Resume

`site.resume` is `/neha-malla-resume.pdf`. The header link, Connect row and llms.txt line appear only once
`public/neha-malla-resume.pdf` exists. That PDF must have no phone number or street address (email,
city and LinkedIn are fine). `npm run check` runs `scripts/check-public-pii.mjs`, which fails on anything in
`public/` that looks like a phone number. Never copy `docs/reference/Neha_Malla_Resume.pdf` there: it has one.

## Slugs

lowercase-kebab-case, no dates, never renamed after publishing.
