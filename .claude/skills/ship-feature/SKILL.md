---
name: ship-feature
description: Plan a feature, split it into parallel worktree units, implement, verify at all screen sizes, review, and open a PR.
disable-model-invocation: true
---

Feature: $ARGUMENTS

1. Explore the code and write `PLAN.md`: goal, acceptance criteria, and units.
   Each unit lists the exact files it owns; no file appears in two units.
   Mark dependencies; units without dependencies run first.
2. Show me the plan and wait for approval.
3. For each ready unit, spawn the `implementer` agent in parallel (one per unit).
4. When a wave finishes, merge the unit branches into `feature/<slug>` and resolve conflicts.
   Start dependent units from that branch.
5. Run the `ui-verifier` agent on the merged branch. Fix and re-verify until PASS.
6. Run the `reviewer` agent. Fix correctness gaps only.
7. Delete `PLAN.md`, commit, push `feature/<slug>` with `git push -u origin feature/<slug>`, and open a PR
   with `gh pr create` that includes the screenshots table. Never push to `main` and never merge the PR:
   merging deploys the site, and a human does that.
