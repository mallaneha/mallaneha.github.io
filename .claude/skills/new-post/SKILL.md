---
name: new-post
description: Scaffold a new blog post or short note as a draft
disable-model-invocation: true
---

Create a new writing draft about: $ARGUMENTS

1. Decide `type`: `note` if the topic is a single finding (3–5 sentences), otherwise `post`. Say which you picked.
2. Pick a short kebab-case slug and confirm `src/content/writing/<slug>.md` doesn't exist.
3. Copy the frontmatter shape from `docs/CONTENT.md`. Set `date` to today and `draft: true`. Reuse existing tags.
4. For a post: write an outline only (H2 headings with a one-line note under each). For a note: write a
   3–5 sentence draft, using only facts from `docs/SPEC.md`, the resume, or the request. Mark gaps with `TODO`.
5. Run `npm run check` and report the result plus the dev URL: http://localhost:4321/writing/<slug>/
