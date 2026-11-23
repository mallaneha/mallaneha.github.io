# Redacted intro: design

Status: approved 2026-11-23, not built yet.

## Goal

One memorable thing on the site that shows Neha's expertise in the first few seconds. On the home page the
header loads looking like the output of a PII redaction tool, then clears. It points at her work on HIPAA-grade
PII redaction without a word of explanation.

Rejected alternatives: a scan the visitor triggers by touching the tagline (too few people would find it), and a
RAG poisoning demo under the intro (heavier, and it adds a control to a minimal header). The poisoning demo is
still a good idea for somewhere else.

## What the visitor sees

- On first load, these spans are covered by black bars with a tiny mono tag inside:
  - `Neha Malla` (the h1): `PERSON`
  - `Carnegie Mellon`, `Autonomize AI`, `Numeric Mind`: `ORG`
  - `January 2027`: `DATE`
- After a hold of about 300ms, a thin vertical scan line sweeps the header from left to right in about 900ms.
  Each bar clears as the line passes it. Total: about 1.2s.
- Afterwards the words look like normal text. Hovering one fades in its tag above it for a moment; on touch
  screens a tap does the same.
- Plays once per browser session, on the home page only.
- Skipped with `prefers-reduced-motion` (hover tags still work), and never blocks the text if JS fails.
- The real words are always in the HTML, so screen readers and search engines read plain text. No layout shift.

## How it's built

- **Markup.** `src/data/site.ts` intro strings get a new inline syntax next to `==…==`: `[[Carnegie Mellon|ORG]]`.
  `src/pages/index.astro` parses it into `<span class="pii" data-pii="ORG">Carnegie Mellon</span>`. The name gets
  the same span inside the `<h1>`, before `<HeaderCat />`, so the cat is never covered.
- **Bars.** CSS only, scoped in `index.astro`. While `<html>` has the `pii-redacted` class, each `.pii` gets an
  `::after` bar in `--color-text` with its tag in `--color-bg` mono text. The tag uses
  `content: attr(data-pii) / ""` so screen readers don't announce it.
- **Before first paint.** The inline theme script in `src/layouts/Base.astro`'s `<head>` also adds `pii-redacted`
  when the page is the home page, the session flag isn't set and reduced motion is off, and then sets the flag
  (`sessionStorage`, wrapped in try/catch).
- **Scan.** `src/scripts/effects.ts` sets `--pii-delay` on each span from its position (left to right, top to
  bottom) and runs the scan line: one `aria-hidden` element animated with `transform` only.
- **Fallback.** Clearing is a CSS animation with a default delay, so every bar clears within about 1.5s even if
  `effects.ts` never loads.
- **Hover tags.** `.pii:hover` shows the tag; a small tap handler in `effects.ts` does it on touch screens. The
  spans are not focusable (decoration shouldn't add tab stops).
- **Helper.** A `plainIntro()` helper strips `==` and `[[…|…]]` for any future reader of `site.intro` (today only
  `index.astro` reads it; `llms.txt` and meta tags use `site.summary`).
- No new dependency. Probably no new token.

## Edge cases

- Entity spans use `white-space: nowrap` so a bar never spans a line break. All entities are short enough for 375px.
- Dark mode inverts on its own (bar `--color-text`, tag `--color-bg`).
- Copying the intro mid-scan copies the real words.
- One `<h1>`, accessible name still "Neha Malla".

## Testing

In `tests/visual/interactions.spec.ts`:

1. Existing tests set the session flag with `addInitScript`, so they see the plain header.
2. Fresh context: `pii-redacted` is on `<html>` at load and gone within 2s; no `.pii` box moves between states.
3. Reload in the same context: no replay.
4. `reducedMotion: "reduce"`: the class is never added.
5. A post page never gets the class.
6. Phone viewport: tapping a `.pii` shows its tag.

Then `npm run check`, `npm run test:visual`, and a look at 375, 768 and 1280px in light and dark mode
(`/check-responsive`).

## Files

`src/data/site.ts`, `src/pages/index.astro`, `src/layouts/Base.astro`, `src/scripts/effects.ts`,
`tests/visual/interactions.spec.ts`, and `docs/DESIGN.md` (a short "Redacted intro" section once built).
