---
name: check-responsive
description: Check the site at phone, tablet, laptop and desktop widths in light and dark mode. Use after changing pages, components, layouts or styles, or before saying a UI task is done.
---

Check responsive layout: $ARGUMENTS

1. Run `npm run check`. Stop and fix if it fails.
2. Delegate to the `ui-verifier` agent, naming the pages that changed (or all pages if unsure).
3. Fix every problem it reports, then run it again. Repeat until it says PASS.
4. Report: commands run with pass/fail, the final table from `ui-verifier`, and the screenshot folder
   `test-results/shots/`.
