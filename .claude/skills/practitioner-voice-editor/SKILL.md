---
name: practitioner-voice-editor
description: Rewrite any piece of writing (articles, experience entries, bios, READMEs, abstracts) in a consistent experienced-practitioner voice without changing the facts. Use when asked to edit, rewrite or polish prose for voice.
---

# Practitioner Voice Editor

Use this skill to rewrite any piece of writing in a consistent practitioner voice. Common content types:

- **Article**: blog posts, guides, essays, newsletters, docs
- **Experience**: experience or work-history entries, project lists, About/bio sections
- **Other**: any other prose (READMEs, talk abstracts, announcements). Apply the voice rules plus whichever structure rules fit best.

Pick the content type from what the user pasted. Ask one short question only if it's truly unclear.

## Core rule: change the voice, never the facts

- Keep every claim, number, date, name, organization, role, technology, code snippet and link exactly as given.
- Never invent experiences, anecdotes, responsibilities, metrics or outcomes. Don't round or inflate numbers.
- Where a personal example or missing detail would help, leave a placeholder instead of inventing one:
  - `[PERSONAL EXAMPLE: ...]` for a missing anecdote
  - `[GAP: ...]` for a missing step in an explanation
  - `[ADD: ...]` for a missing fact, scale or outcome

## The voice: experienced practitioner, professional but conversational

- **First person, grounded in real experience.** Use "I" freely, unless the original is deliberately written in third person or the plural "we", in which case keep that point of view. Base advice on what the author actually did, built or got wrong. Be candid about failures and limits.
- **Talk to the reader.** Use "you" where it fits. Picture one specific reader, such as someone a year or two behind the author or a hiring manager skimming the page, and write for them. Answer their likely questions in the flow of the text.
- **Direct and opinionated.** State opinions plainly. Cut filler hedges ("perhaps", "it could be argued", "in some sense"). Keep honest uncertainty when it's real, stated once. Say early what's in scope and what isn't.
- **Plain, lightly casual language.** Contractions are fine. Use everyday words, and define jargon on first use. Keep precise technical terms but don't stack them. Mid-level formality: no slang, no academic stiffness. Mostly short, varied sentences, one idea per paragraph.
- **Minimal, dry humor.** Earnest and practical by default. An occasional wry aside is fine. No emoji.
- **No hype or buzzwords.** Remove words like: revolutionary, game-changing, dive deep, unlock, passionate, rockstar, spearheaded, drove impact, leveraged, cutting-edge, "in today's fast-paced world". No generic opening hooks and no motivational closing summaries.

## Structure: Article

- Keep existing headings unless they're vague. Rename vague ones to say what the section contains.
- Use lists only for real lists (steps, options, checklists). Everything else is prose.
- Tighten padded sections. Flag explanations that skip a step a reader would need with `[GAP: ...]`.
- End when the useful content ends, or with one concrete next step.

## Structure: Experience

- Write in first person ("I built..."), not resume fragments ("Led X"). Be specific about the author's part versus the team's.
- Lead each entry with what the work was and why it mattered. For each one, name the problem, what was done and what happened.
- Format for each entry:
  - Header: Role, Organization (Team if relevant), Location or Remote, Dates. Keep the existing format if there is one.
  - 2–4 sentences of prose, or up to 3 short bullets if the original uses bullets.
  - Optional `Tools:` line, listing only tools that were given.
- Keep the entries in the given order. Make recent and relevant entries the most detailed, and keep older or minor ones to 1–2 lines.
- Keep the voice consistent across entries.

## Output

- The revised content in Markdown, or in the original's format if it isn't Markdown.
- A short **Changes** list: the main edits (per entry for Experience), plus every placeholder added.
- For Experience: flag any inconsistencies, such as overlapping dates, a title that doesn't match the described work, or the same achievement repeated across entries.

## Optional reference sample

If the user provides a sample of writing that already has the voice they want, match that sample more closely than the description above.
