# Writing topic icons: design

Status: approved 2026-11-23, not built yet.

## Goal

Writing rows (home page Writing section and `/writing/`) show a Nepali letter in their tile, in list order
(क, ख, ग …). The letter says nothing about the post. Replace it with a line icon that shows the post's topic,
so a reader can tell security, evals and RAG posts apart at a glance.

## Rule

1. A post in a series uses the series' icon.
2. Otherwise the post's first tag picks the icon. To change a post's icon, reorder its tags.
3. No mapping for that tag, or no tags: `file`.

| Applies to            | Icon                             | Posts today                                                    |
| --------------------- | -------------------------------- | -------------------------------------------------------------- |
| series `llms-by-hand` | `pen`                            | parts 1–3                                                      |
| tag `security`        | `shield`                         | Rule of Two, RAG poisoning defense                             |
| tag `evals`           | `flask`                          | clinical data validation, cutting hallucinations, unanswerable |
| tag `rag`             | `search` (new, magnifying glass) | vector search medical codes                                    |
| anything else         | `file`                           | none                                                           |

Only tags that lead a post today get an entry. Add more when a post needs one.

Known effect: today's home page features Rule of Two (security) and two evals posts, so two of the three rows
share the flask. That is expected when icons follow topic.

## Changes

- `src/data/icons.ts`: add `search`, a magnifying glass in the same 24px line style as the others.
- `src/lib/content.ts`: replace the consonant list and `nepaliLetter()` with a `writingIcons` table
  (`Record<string, IconName>`) and `writingIcon(entry)`: series entry, then first-tag entry, then `"file"`.
- `src/pages/index.astro`, `src/pages/writing/index.astro`: `glyph={nepaliLetter(i)}` → `icon={writingIcon(w)}`.
- `docs/CONTENT.md`: one line on how a post's row icon is picked and where the table lives.

## Cleanup

Only writing rows used letter tiles, so remove:

- `src/components/Row.astro`: the `glyph` prop, its markup and `.glyph` styles.
- `src/styles/tokens.css`: the "Nepali Letters" `@font-face`, its comment and `--font-devanagari`.
- `public/fonts/noto-sans-devanagari-letters.woff` (5 KB, one less font request per page).

## Testing

- `npm run check`. The type check rejects an unknown icon name in the table.
- Playwright: the home Writing rows render an icon tile (`svg`) and no `.glyph`.
- `npm run test:visual`, and a look at the home page and `/writing/` at 375 and 1280 px, light and dark.

One branch, `site/writing-topic-icons`.
