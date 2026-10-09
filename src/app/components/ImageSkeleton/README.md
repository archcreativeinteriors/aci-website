# Image skeletons

A grey shimmer shown **behind a photo while it loads**, in exactly two places:

| Where | Component | What you see |
|---|---|---|
| Full-size photo viewer (click a photo on a project page) | `components/PhotoLightbox.jsx` | a dark shimmering box the size of the photo, until the photo arrives and fades in |
| Hover preview on `/projects` (desktop, mouse) | `components/ProjectIndex.jsx` | the 320×240 preview panel shimmers until the hovered row's photo arrives, then cross-fades to it |

Nowhere else, on purpose:
- Every other photo (hero, project cards, project pages, team, blog) already shows a
  **blurred mini version of itself** while loading (Sanity's LQIP through next/image
  `placeholder="blur"`). That is better than grey, so it is left alone.
- Client logos are transparent PNGs; a shimmer behind them would show through.
- There is **no full-page overlay** and nothing ever hides text (the Phase 10 rule: a
  splash loader twice left this site blank on slow phones).

## How it works

- `image-skeleton.css` holds every rule. It is imported once, in `src/app/layout.js`.
- Each component puts `data-skeleton="loading"` on the element while **its own** image
  loads and removes it on that image's `load` (or `error`) event. The CSS shows the
  shimmer only while the attribute is there.
- The shimmer is a background on a box whose size is already fixed, so removing it moves
  nothing (no layout shift). In the viewer that box is the photo fitted to the screen,
  worked out from the photo's shape (`--lb-ratio`, set by `PhotoLightbox.jsx`) before a
  byte arrives. One visible side effect: a photo whose original is smaller than the
  screen is now scaled up to fit the viewer, like the larger ones already were.
- Hover preview: the shimmer only appears if the photo takes longer than 120 ms
  (`SKELETON_DELAY_MS` in `ProjectIndex.jsx`), so a cached photo swaps in with no grey flash.
  A photo that fails to load closes the panel.
- Visitors who prefer reduced motion get a still grey box instead of the sweep.
- Both places only exist when JavaScript runs, so a visitor without JS never sees a skeleton.
- Light theme only (the site has none other); the viewer's shimmer is dark because the
  viewer is a dark full-screen panel.

## How to test

1. `npm run build:safe` then `npm start`, or `npm run dev`.
2. Chrome DevTools → **Network** → tick **Disable cache** → throttling **Slow 4G** (or
   **3G** for a longer look).
3. **Viewer:** open any project page (e.g. `/projects/headline-salon-makenews-sector-69-gurgaon`),
   click a photo → the dark shimmer shows until the photo fades in. Use → to see the next
   photo load the same way.
4. **Hover preview:** open `/projects` on a desktop-sized window, hover a row that is a
   link → the panel shimmers, then shows the photo. Hover the next row → shimmer, not the
   previous project's photo.
5. **Reduced motion:** DevTools → ⋮ → More tools → **Rendering** → *Emulate CSS media
   feature prefers-reduced-motion: reduce* → the box is grey and still.
6. Untick throttling: photos appear with no visible shimmer.

## How to turn it off

- **Quick:** delete the `import "./components/ImageSkeleton/image-skeleton.css"` line in
  `src/app/layout.js`. With no CSS the `data-skeleton` attribute does nothing and the
  viewer looks exactly as before. One difference remains on `/projects`: a slow photo's
  preview panel appears after 120 ms as an empty shadowed box instead of staying hidden.
  For exactly the old behaviour, remove it completely (below).
- **Remove completely:** also delete this folder, and in the two components remove what the
  comments mark as the skeleton:
  - `PhotoLightbox.jsx`: the `loadedSrc` state and the `data-skeleton` / `onLoad` /
    `onError` / `ref` props on the `<img>`.
  - `ProjectIndex.jsx`: `SKELETON_DELAY_MS`, the `loading` state, `loadingTimer`, the
    `fail` handler and timer lines in `show()` / `hide()` / the cleanup, and the
    `data-skeleton` prop on the panel.
  Or simply revert the branch's commit: `git revert <commit>`.
