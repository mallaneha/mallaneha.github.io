# Sound feedback

Sources: userinterface.wiki/sounds-on-the-web, /generating-sounds-with-ai, plus the site's agent skill.
This repo already has click sounds and a mute toggle in `src/scripts/effects.ts`; extend that file
rather than adding a second audio system.

## When

| Moment                                   | Sound?                                      |
| ---------------------------------------- | ------------------------------------------- |
| Payment/submit success, confirmations    | Yes                                         |
| Errors and warnings that can't be missed | Yes                                         |
| Notifications                            | Yes                                         |
| Button click                             | Maybe (subtle, optional; this site does it) |
| Typing, hover, scroll, navigation        | No                                          |

- `appropriate-no-high-frequency`: never on typing or anything fired many times in a row.
- `appropriate-no-decorative`: never on hover or purely decorative moments.
- `appropriate-no-punishing`: inform, don't punish; a gentle alert, not a buzzer.
- `weight-match-action`: sound weight matches action weight (soft tick for a toggle, a chime for a
  purchase). Duration too: a click is ~50 ms or less.
- Sound makes a button feel faster even with identical visuals; that's the reason to use it, sparingly.

## Accessibility

- `a11y-visual-equivalent`: every sound has a visible equivalent. No information is sound-only.
- `a11y-toggle-setting`: an in-page way to turn sound off, remembered (`effects.ts` stores
  `effects-muted` in `localStorage`, wrapped in try/catch).
- `a11y-reduced-motion-check`: there's no `prefers-reduced-audio`; treat `prefers-reduced-motion: reduce`
  as a signal to stay quiet by default.
- `a11y-volume-control`: never `volume = 1`; keep a master gain the app controls.
- No autoplay. Audio starts only after a user gesture.

## Implementation (Web Audio)

- `impl-single-context`: one shared `AudioContext`, created lazily on first gesture. Never one per sound.
- `impl-resume-suspended`: `if (ctx.state === "suspended") ctx.resume()` before playing.
- `impl-cleanup-nodes`: on `source.onended`, disconnect source, filter and gain nodes.
- `impl-default-subtle`: default gain ~0.3; never ≥ 1.0.
- For `<audio>` files: create once, `.load()` to preload, set `currentTime = 0` before each `play()`
  so rapid repeats retrigger.

## Synthesis parameters

- `synth-noise-for-percussive`: clicks/ticks = filtered noise. Tones = oscillator.
- `synth-click-duration`: 5–15 ms of noise (8 ms typical): buffer of `sampleRate * 0.008` samples,
  `(Math.random() * 2 - 1) * Math.exp(-i / 50)`.
- `synth-filter`: `bandpass`, frequency 3000–6000 Hz (4000 typical), Q 2–5 (3 typical).
  Lowpass sounds muffled, highpass thin and harsh. Chain: source → filter → gain → destination.
- `synth-exponential-decay`: real sounds decay exponentially. `gain.setValueAtTime(0.3, t)` first,
  then `exponentialRampToValueAtTime(0.001, t + 0.05)`. Never ramp to 0 (exponential ramps can't reach 0).
- `synth-tonal-sweep`: tones sweep pitch, e.g. 400 → 600 Hz over 40 ms.
- Tuning by ear:
  - too harsh → lower the frequency, lower Q
  - too muffled → raise the frequency
  - too long → shorter buffer, faster decay
  - cuts off abruptly → exponential decay
  - more mechanical → higher Q, faster decay
  - softer → lower gain, triangle wave
