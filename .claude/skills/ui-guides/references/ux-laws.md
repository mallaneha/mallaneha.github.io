# Laws of UX

Source: userinterface.wiki/laws-of-ux (see also lawsofux.com).

- `ux-fitts-target-size` (Fitts): bigger and closer targets are faster to hit. Interactive targets
  ≥ 32px; 44px on touch. Every pixel of padding is a usability decision.
- `ux-fitts-hit-area`: grow a small visible control with an invisible `::before` hit area
  (`inset: -8px -12px`) instead of making it look bigger. See `css-native.md`.
- `ux-forgiveness` ("coyote time"): forgive input slightly late or slightly outside a target, e.g.
  keep a hover menu open briefly after the pointer leaves.
- `ux-hick-progressive-disclosure` (Hick): decision time grows with the number of choices
  (logarithmically; 2 → 4 is noticeable, 8 → 16 is painful). Show what matters now; put the rest
  behind a drawer or "more". This site's Row → drawer pattern is exactly this.
- `ux-miller-chunking` (Miller, ~7±2): group long strings and lists. Digits in groups of 4
  (`4532 0151 1283 0366`), format currency and dates, group long lists under headings.
- `ux-doherty-threshold` (Doherty): respond within 400 ms. < 100 ms feels like part of the hand,
  ~400 ms is barely noticed, ~2 s feels broken even with the same result. If it can't be fast, make it
  feel fast: optimistic UI, skeletons, progress.
- `ux-postel-liberal-input` (Postel): accept messy input, output clean. "jan 15 2024" and "2024-01-15"
  mean the same date. Validate generously, format strictly. Trim whitespace, accept pasted formatting.
- `ux-proximity`: related things sit closer together than unrelated things.
- `ux-similarity`: things that work alike look alike (one row style for all lists).
- `ux-common-region`: a shared background or border groups items.
- `ux-von-restorff`: the one thing that must stand out is the only thing styled differently.
- `ux-serial-position`: put the most important items first and last.
- `ux-peak-end`: polish the best moment and the last moment (success state, closing a drawer).
- `ux-zeigarnik`: show progress on unfinished multi-step tasks.
- `ux-pareto`: spend polish on the 20% of UI used 80% of the time.
