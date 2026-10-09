/**
 * Runs automatically before every `npm run build` (the `prebuild` npm hook).
 *
 * Empties Next's DATA cache (.next/cache/fetch-cache) — and nothing else in
 * .next/cache, so the image and compile caches keep builds fast.
 *
 * Why: every page is static, and Next stores each Sanity answer fetched during
 * `next build` in that folder with a one-year lifetime — then the NEXT build
 * reuses it instead of asking Sanity again. Without this, a Studio edit would
 * never reach the site, rebuild or not (found 2026-09-25: after the first seed,
 * a rebuild still rendered the empty answers cached before it). The owner's
 * model is "a rebuild publishes what is in Sanity", so each build starts with
 * no cached Sanity data. `cache: "no-store"` in lib/cms/client.js would do the
 * same per request but turns every page dynamic, which the site is not.
 *
 * Always build with `npm run build` — a bare `next build` skips this hook.
 */

const fs = require("fs");
const path = require("path");

// A plain `npm run build` builds into .next, so `npm start` must serve .next
// again rather than the folder an earlier `npm run build:safe` pointed it at
// (scripts/safe-build.js, scripts/start.js).
const pointer = path.join(__dirname, "..", ".next-live");
if (fs.existsSync(pointer)) {
    fs.rmSync(pointer);
    console.log("prebuild: removed .next-live — npm start will serve this build (.next)");
}

const dir = path.join(__dirname, "..", ".next", "cache", "fetch-cache");
if (fs.existsSync(dir)) {
    const n = fs.readdirSync(dir).length;
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`prebuild: cleared ${n} cached Sanity/fetch response(s) from .next/cache/fetch-cache`);
}
