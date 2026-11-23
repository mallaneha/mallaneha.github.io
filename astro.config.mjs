// @ts-check
import { defineConfig } from "astro/config";

// GitHub Pages user site: served from the domain root, so no `base`.
export default defineConfig({
  site: "https://mallaneha.github.io",
  trailingSlash: "ignore",
  build: { format: "directory" },
  // Prefetch same-origin pages when a link is hovered or focused, so the next page is
  // usually cached by the time it's clicked. External links are never prefetched.
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  // The desktop app's autoPort sets PORT so parallel worktree dev servers don't collide.
  server: { port: Number(process.env.PORT) || 4321 },
  integrations: [
    {
      // Dev toolbar only (not in builds): switch the header cat between its shelf and the name.
      name: "debug-cat-position",
      hooks: {
        "astro:config:setup": ({ addDevToolbarApp }) => {
          addDevToolbarApp({
            id: "debug-cat-position",
            name: "Cat position",
            // a cat's head: two ears and a face
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M4 20V5l5 4h6l5-4v15z"/><circle cx="9" cy="14" r="1" fill="currentColor"/><circle cx="15" cy="14" r="1" fill="currentColor"/></svg>',
            entrypoint: "./src/dev/cat-position.ts",
          });
        },
      },
    },
  ],
});
