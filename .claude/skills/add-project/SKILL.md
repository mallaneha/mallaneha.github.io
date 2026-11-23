---
name: add-project
description: Add a project to the Building or Projects section
disable-model-invocation: true
---

Add a project: $ARGUMENTS

1. Ask for anything missing: one-line summary with a number, year, tech, repo link, and whether it's
   `building` or `shipped`. Check `docs/SPEC.md` and the resume (`docs/reference/`) first.
2. Create `src/content/projects/<slug>.md` following `docs/CONTENT.md`; set `order` relative to existing projects.
3. If there's a repo link, read its README and write a 2–3 sentence body in Neha's voice (first person,
   concrete: what problem, what she built, one result). Don't invent numbers.
4. Run `npm run check`. Open the home page in the dev server at 375px and 1280px and describe the result.
