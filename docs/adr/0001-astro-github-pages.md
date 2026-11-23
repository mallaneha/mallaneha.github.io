# 0001: Astro on GitHub Pages

Date: 2026-11-22. Status: accepted.

**Decision.** Build with Astro (static output, Markdown content collections, zero client JS)
and host on GitHub Pages as the user site `mallaneha.github.io`, deployed by GitHub Actions.

**Why.** The site is mostly text with a small blog. Astro's content collections validate
frontmatter with a schema, so agents can't invent fields. Pages are plain HTML, so the site
is fast and accessible by default. GitHub Pages is free and matches the planned address.
No CMS, no web fonts, no CSS framework: fewer moving parts for agents to break.

**Consequences.** Node ≥ 22.23.4 is required (pinned in `.nvmrc`). A custom domain can be
added later with a `public/CNAME` file and a change to `site` in `astro.config.mjs`.
