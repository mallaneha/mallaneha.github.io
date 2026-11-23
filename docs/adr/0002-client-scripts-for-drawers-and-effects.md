# 0002: Client scripts for drawers and click effects

Date: 2026-11-22. Status: accepted. Amends 0001 ("zero client JS").

**Decision.** Copy ch.sh's interaction model: rows that open bottom-sheet drawers, and a spark +
sound + vibration on every click. Build it with a native `<dialog>` and two small vanilla
TypeScript modules (`src/scripts/drawer.ts`, `src/scripts/effects.ts`), not React or vaul.

**Why.** ch.sh uses Next.js, React and the vaul drawer library. Pulling in a UI framework for two
behaviors would add weight and a build dependency agents could break. `<dialog>` gives focus
trapping, Esc and a backdrop for free; the remaining behavior (slide, drag, arrows, hash) is
about 150 lines.

**Consequences.** Drawer content is server-rendered into the page, so it's still in the HTML for
search engines and `llms.txt`. Behavior is covered by `tests/visual/interactions.spec.ts`. Sound
and sparks can be muted by visitors and respect `prefers-reduced-motion`.
