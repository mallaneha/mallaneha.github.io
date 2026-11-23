# Before you change anything: use your own worktree

Other agents work in this repo at the same time. Never edit files in the main checkout
(`/Users/…/neha_website` on `main`); it is shared and serves the dev site on http://localhost:4321.

For every request that changes files (code, content, docs, config):

1. `git worktree add .claude/worktrees/<name> -b <type>/<name> main` (type: `site`, `content`, `writing`, `docs`, `fix`),
   then work only inside that folder. Install deps with `npm ci` (or symlink `node_modules` from the main checkout).
2. Commit there. `npm run check` must pass (and `npm run test:visual` for UI changes, with a unique `TEST_PORT`
   if other agents may be testing, e.g. `TEST_PORT=4331`).
3. Merge into local `main` from the main checkout: `git -C <main checkout> merge --no-ff <branch>`.
   Don't touch, stage, stash or commit other agents' uncommitted files there. If the merge is blocked by them, stop and ask.
4. Remove the worktree and delete the merged branch. Check http://localhost:4321 shows the change.

Never kill or restart the server on 4321 except with `npx astro dev stop` / `npx astro dev --background` in the
main checkout. Never push `main` (it deploys). Read-only questions don't need a worktree.

@AGENTS.md
