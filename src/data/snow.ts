// Settings for the falling-snow background (src/scripts/snow.ts). Change these to tune it.
// For quick experiments without editing, the same names work as URL parameters on any page, e.g.
// http://localhost:4321/?wind=60&direction=180 (wind blowing left).
export const snow = {
  enabled: true,
  /** Flakes per 100,000 px² of screen (a 1280×800 window is ~10 units), capped at maxFlakes. */
  density: 6,
  maxFlakes: 160,
  /** How fast flakes fall, in px per second (the biggest ones; small ones fall slower, for depth). */
  speed: 20,
  /** Wind speed in px per second. 0 is still air. */
  wind: 10,
  /** Where the wind blows TO, in degrees: 0 right, 90 down, 180 left, 270 up. */
  direction: 0,
  /** How much each flake drifts side to side on its own, in px. */
  sway: 12,
  /** Dot radius in px. */
  minSize: 0.6,
  maxSize: 1.8,
  minOpacity: 0.25,
  maxOpacity: 0.8,
};

export type SnowSettings = typeof snow;
