# Skills section and regulated-data positioning

Date: 2026-11-23. Status: built. Revised the same day: the tabbed version below was replaced by three static columns (see the end).

## Problem

The bio didn't say that Neha wants to do AI engineering in fields that need data compliance and governance. The
industries and the word "compliance" were only in the hidden meta summary. The page also had no list of skills;
readers had to piece them together from the drawers.

## Decisions

- **Role:** AI engineer for regulated industries. Compliance and governance are the setting she knows, not a
  separate governance role.
- **Tagline:** "AI engineering for regulated data." (was "Safe AI for high-stakes data.")
- **Intro:** credentials first, then the goal and proof:
  "I'm most interested in AI work where safety and compliance come first: healthcare, banking and insurance. I build
  AI systems that hold up to compliance and governance requirements, like HIPAA-grade PII redaction and RAG pipelines
  that resist poisoned documents." The meta `summary` and `llms.txt` say the same.
- **Skills:** three topics, read left to right as build, protect, comply: AI systems, AI security & privacy,
  Regulated data. Every chip comes from the resume. Python is left out because it runs through all three.
- **Layout:** inspired by Framer's "Toolstack Gallery" (the focused item grows and the others blur back). It sits
  right after the header. The card goes below the row instead of springing up over it, so it never covers the intro
  or overlaps on phones. The first topic shows by default, so the skills show without hovering and without JS.

## Motion

Seen occasionally, so standard motion is fine. Purpose: state indication, and no jarring swap between topics.

- Tool: CSS transitions only, so fast hovering retargets from where things are. The script only flips
  `aria-selected` and `data-active`.
- Properties: opacity, transform and filter (the blur). Panels share one grid cell, so nothing reflows.
- Old chips: out in 90ms. New chips: 4px rise and 0.97 scale to none, 240ms, `--ease-out`, 25ms apart (capped at
  8), starting halfway through the exit. Name grows to 1.04 over `--duration-state`.
- Blur only with a fine pointer while the mouse is over the row. Reduced motion: opacity only, no stagger.
- Feel-check: the overlap between old chips going and new ones coming, at 2-5x speed in DevTools.

## Not done (YAGNI)

- Real tool logos (would need licensed SVGs; the topics use existing generic icons).
- Linking chips to the projects or roles that used them.
- A governance topic: there's only coursework so far. Add one when Neha has hands-on work to point to.

## Revision: three static columns

The tabbed version looked heavy next to the rest of the page, the hover and blur were fussy, and it sat too high,
pushing Experience down. Replaced with the Projects layout: `RowList columns={3}` after Projects, each a static Row
with the topic name and its tools as the muted line. Everything is visible at once; no component, script or motion
tokens of its own. Same topics and tools.
