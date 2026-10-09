/**
 * Carries Next's optimized-image cache from the live build folder into the new
 * one, so a deploy does not start with every image cold. Used by
 * scripts/safe-build.js; exported for testing.
 *
 * WHY: next/image stores every resized photo in <build folder>/cache/images
 * (node_modules/next/dist/server/image-optimizer.js). build:safe alternates
 * between .next-a and .next-b, so each deploy's folder has its own cache —
 * measured 2026-09-29: .next held 2,134 prepared images, .next-a 16. Until it
 * refills, the first visitor to ask for each photo waits while the server
 * downloads the original from Sanity and re-encodes it (0.4-1.4 s per photo on
 * the owner's PC, slower on a small VPS).
 *
 * BOUNDED, so it cannot grow over many deploys:
 *   - the new folder's own image cache (left from two deploys ago) is REPLACED,
 *     not added to — it is regenerable cache, not content;
 *   - only entries used in the last MAX_AGE_DAYS are copied (Next rewrites an
 *     entry when it refreshes it, so an image still being served stays new);
 *   - newest first, up to MAX_BYTES in total;
 *   - entries written in the last few seconds are skipped: the live server may
 *     still be writing them, and a half-copied file would be served as a
 *     broken image.
 * So the new folder holds at most MAX_BYTES of carried images plus whatever it
 * adds before the next deploy. (Next also caps the cache itself while the site
 * runs: images.maximumDiskCacheSize, by default half the free disk.)
 *
 * WHY THE CAP IS SMALL (256 MB, measured 2026-09-29): at every start Next
 * reads EVERY cached image in full to build its cache index
 * (initCacheEntries in image-optimizer.js), and the first image request waits
 * for it — 2.3-3 s for 2,172 images / 159 MB on the owner's PC. A bigger
 * carried cache means a longer wait after each restart. 256 MB is still more
 * than this site's whole working set (159 MB after heavy test browsing), and
 * the warm-up that follows a restart (warm-images.js) absorbs the wait so the
 * first real visitor does not.
 */

const fs = require("fs");
const path = require("path");

const DEFAULTS = {
    maxBytes: Number(process.env.IMAGE_CACHE_MAX_MB || 256) * 1024 * 1024,
    maxAgeDays: Number(process.env.IMAGE_CACHE_MAX_AGE_DAYS || 30),
    skipNewerThanMs: 10 * 1000,
};

/** Each cache entry is one sub-folder; returns [{ name, dir, bytes, mtimeMs }]. */
function listEntries(imagesDir) {
    if (!fs.existsSync(imagesDir)) return [];
    const entries = [];
    for (const name of fs.readdirSync(imagesDir)) {
        const dir = path.join(imagesDir, name);
        let stat;
        try {
            stat = fs.statSync(dir);
        } catch {
            continue; // removed while we looked
        }
        if (!stat.isDirectory()) continue;
        let bytes = 0;
        let mtimeMs = 0;
        for (const file of fs.readdirSync(dir)) {
            try {
                const s = fs.statSync(path.join(dir, file));
                bytes += s.size;
                mtimeMs = Math.max(mtimeMs, s.mtimeMs);
            } catch {
                /* gone */
            }
        }
        if (bytes > 0) entries.push({ name, dir, bytes, mtimeMs });
    }
    return entries;
}

/**
 * Copies the live folder's image cache into the new folder's, within the
 * limits above. `fromBuildDir` / `toBuildDir` are build folders (".next-a").
 * Never throws: a failure here must not fail a deploy — the site then just
 * starts with a cold image cache, as it always did.
 */
function carryImageCache(fromBuildDir, toBuildDir, options = {}) {
    const opt = { ...DEFAULTS, ...options };
    const log = opt.log || console.log;
    const from = path.join(fromBuildDir, "cache", "images");
    const to = path.join(toBuildDir, "cache", "images");
    try {
        const now = opt.now ?? Date.now();
        const all = listEntries(from);
        const oldest = now - opt.maxAgeDays * 24 * 60 * 60 * 1000;
        const candidates = all
            .filter((e) => e.mtimeMs >= oldest && now - e.mtimeMs >= opt.skipNewerThanMs)
            .sort((a, b) => b.mtimeMs - a.mtimeMs);

        const chosen = [];
        let total = 0;
        for (const e of candidates) {
            if (total + e.bytes > opt.maxBytes) continue;
            chosen.push(e);
            total += e.bytes;
        }

        // Replace, never accumulate: this folder's cache is from two deploys ago.
        // Its CONTENTS are emptied rather than the folder removed: on Windows a
        // folder a watcher holds open cannot be removed or renamed (EPERM).
        fs.mkdirSync(to, { recursive: true });
        for (const name of fs.readdirSync(to)) {
            fs.rmSync(path.join(to, name), { recursive: true, force: true });
        }
        for (const e of chosen) {
            fs.cpSync(e.dir, path.join(to, e.name), { recursive: true, preserveTimestamps: true });
        }

        const mb = (n) => (n / 1024 / 1024).toFixed(1);
        log(
            `image cache: carried ${chosen.length} of ${all.length} prepared images (${mb(total)} MB) ` +
                `from ${path.basename(fromBuildDir)}/ to ${path.basename(toBuildDir)}/` +
                (all.length - chosen.length
                    ? ` — left out ${all.length - chosen.length} (older than ${opt.maxAgeDays} days, over ${mb(opt.maxBytes)} MB, or still being written)`
                    : "")
        );
        return { copied: chosen.length, of: all.length, bytes: total };
    } catch (err) {
        log(`image cache: NOT carried over (${err.message}). The new build starts with a cold image cache.`);
        return { copied: 0, of: 0, bytes: 0, error: err.message };
    }
}

module.exports = { carryImageCache, listEntries, DEFAULTS };
