# Personal website: Neha Malla

One-page personal site (intro, featured work, experience, writing, connect) plus a small blog.
Full product spec: `docs/SPEC.md`. Design reference: ch.sh (layout, rows, drawers, click effects); see `docs/DESIGN.md`.
Stack: Astro 7, TypeScript, Markdown content collections, plain CSS with design tokens, small vanilla TS scripts (no framework).
Hosted on GitHub Pages at https://mallaneha.github.io; `.github/workflows/deploy.yml` deploys on push to `main`.

**Every change happens in its own git worktree, then merges into local `main`.** Never edit the main checkout:
parallel agents share it. Steps are under "Parallel work" below.

## Commands

Node version is pinned in `.nvmrc` (Astro needs ≥ 22.23.4). Run `nvm use` first if `node -v` is older.

- `npm run dev`: dev server at http://localhost:4321 (drafts are visible here)
- `npm run build`: production build into `dist/` (drafts excluded)
- `npm run check`: type-check + Prettier check + build + internal link check + phone-number scan of `public/` +
  placeholder check (published content can't contain `[PERSONAL EXAMPLE: …]`, `[GAP: …]` or `TODO(Neha)`). **Run before saying a task is done.**
- `npm run format`: Prettier
- `node scripts/check-links.mjs dist --external`: also check external URLs (slow, needs network)
- `npm run test:visual`: Playwright smoke, interaction and explainer-widget tests (own server on port 4329) of every page
  at 375/768/1280/1920 px, light and dark. Fails on sideways scroll, JS errors or ≠ 1 `<h1>`. Screenshots: `test-results/shots/`
- `npm run test:visual:live`: the same against https://mallaneha.github.io (published pages only)

## Where things live

- Short site copy (name, tagline, header paragraphs, contact links, location, resume, motto): `src/data/site.ts`
- Writing (posts and short notes): `src/content/writing/<slug>.md` → `/writing/<slug>/`.
  Example: `src/content/writing/cutting-hallucinations-research-agent.md`
- Projects: `src/content/projects/<slug>.md`. `featured: true` → Featured row + drawer; `status: building` → Building row.
  The Markdown body is the drawer's case study. Example: `vector-guard.md`
- Experience: `src/content/experience/<slug>.md`, body is the drawer's case study. Example: `autonomize-ai.md`
- Frontmatter schema: `docs/CONTENT.md`, enforced in `src/content.config.ts`. Keep both in sync.
- Colors, fonts, spacing: `src/styles/tokens.css` only. Global element styles: `src/styles/global.css`.
- Home page: `src/pages/index.astro`. Components: `Row`, `RowList`, `Drawer`, `Section`, `Icon`, `Footer`,
  `Explainers` (styles for the interactive widgets in posts).
- Client scripts: `src/scripts/drawer.ts` (bottom-sheet drawers) and `src/scripts/effects.ts` (click spark, sound,
  vibration, mute toggle, theme toggle, copy-email toast). `effects.ts` also lazy-loads `src/scripts/explainers.ts`,
  the interactive widgets for the "Build it" posts, only on pages that use one. Icons: `src/data/icons.ts` (generic glyphs, no brand logos).
- `/llms.txt` is generated from the same content by `src/pages/llms.txt.ts`.
- Background research and the source resume: `docs/research/`, `docs/reference/` (not published).

## Rules

- Every list entry is a `Row`: icon tile, name, one short muted line. Details go in a drawer, not on the page.
- Don't add npm dependencies without asking.
- Don't change slugs or URLs of published pages. If one must change, add a redirect in `astro.config.mjs`.
- Voice: first person, plain, specific, numbers over adjectives. See `docs/DESIGN.md`.
- Only state facts that appear in `docs/SPEC.md`, the resume, or what Neha tells you. Never invent metrics, dates or links.
- Accessibility: semantic HTML, one `<h1>` per page, visible focus, contrast ≥ 4.5:1, works at 375px wide.
- Never edit `dist/`, `.astro/`, `node_modules/`, or `docs/reference/`.

## Verification (required before saying done)

- `npm run check` passes. A Stop hook (`scripts/stop-gate.sh`) runs it whenever there are uncommitted changes.
- For UI changes, `npm run test:visual` passes too, and you look at the changed pages at 375, 768 and 1280 px
  in light and dark mode. Desktop app: Browser pane. CLI: Chrome. Cloud: Playwright MCP.
  The `ui-verifier` agent and `/check-responsive` skill do this.
- Report evidence: commands run, pass/fail output, screenshot paths.

## Parallel work

- Split work so no two agents edit the same file.
- Do all changes in a worktree on a feature branch, never directly in the main checkout:
  `git worktree add .claude/worktrees/<name> -b <type>/<name> main`, then `npm ci` there. Commit in the worktree.
- When the work passes `npm run check` and `npm run test:visual`, merge it into the local `main` from the main checkout
  (`git merge --no-ff <branch>`), then remove the worktree. The main checkout stays on `main` and runs the dev server
  on http://localhost:4321, so that's where the merged site is visible.
- Tests start their own server on `TEST_PORT` (default 4329). Never kill or reuse the server on 4321.
- Never push `main`: pushing it deploys the site. Push feature branches only (`git push -u origin <branch>`) if asked.

## Never do

- Push to `main`, merge PRs, deploy, or change GitHub Pages / DNS settings. A human does that.
- Put a phone number or street address on the site. The resume in `docs/reference/` has a phone number,
  so never copy it into `public/`. A resume without contact details has to be supplied first.
- Commit `.env` files or API keys.

## Done means

1. `npm run check` passes.
2. For visual changes: run the dev server, look at the page at 375px and 1280px, in light and dark mode,
   and describe what changed.
3. A short summary of the files you changed and anything still open.
