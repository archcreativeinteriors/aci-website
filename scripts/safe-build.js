/**
 * npm run build:safe [-- --restart "<command>"]
 *
 * The deploy build for the VPS. A failed build never takes the live site down.
 *
 * WHY: `next build` begins by EMPTYING its output folder — for a plain
 * `npm run build` that is .next, the folder the running `next start` serves
 * from. If the build then fails (Sanity unreachable, a code error), the live
 * site is left with half its files, and a restart would not come back up.
 * Project photos live only in Sanity and a build that cannot reach Sanity
 * fails on purpose (lib/cms/client.js), so a failed build must be harmless.
 *
 * HOW: two build folders, .next-a and .next-b, used in turn. The file
 * .next-live names the one being served; `npm start` (scripts/start.js)
 * serves that one.
 *   1. builds into the folder that is NOT live — the site keeps running on
 *      the live one the whole time
 *   2. FAILED    -> stops. Nothing the live site uses was touched. Fix the
 *                   cause, run it again.
 *   3. SUCCEEDED -> .next-live is switched to the new folder; then the site
 *                   is restarted (`--restart "pm2 restart arch"` runs it for
 *                   you) and serves the new build.
 * The folders are never renamed: Next writes the output folder's name into
 * the build itself, so a build only works from the folder it was built in.
 *
 * IMAGE CACHE (perf, 2026-09-29): each folder keeps its own cache of resized
 * photos, so a new folder starts cold. With --restart, two things happen:
 *   - before the switch, the live folder's image cache is copied into the new
 *     one, with limits so it cannot grow over many deploys
 *     (scripts/image-cache.js);
 *   - after the restart, scripts/warm-images.js asks the new server for every
 *     page's top-of-page photos (--warm-url sets the address, default
 *     http://localhost:$PORT or :3000).
 * ONLY TOGETHER, measured (phone, first visit after a restart, medians of 3):
 * empty cache 3.2 s; carried cache with no warm-up 5.7 s — WORSE, because at
 * start Next reads the whole cache to index it and the first visitor waits;
 * carried + warm-up 2.4 s with a 4.5 s warm-up; empty + warm-up 2.4 s but a
 * 63 s warm-up, during which visitors still meet unprepared photos. So the
 * cache is carried only when the warm-up will follow: with --restart and
 * without --no-warm. After a manual restart, run  npm run images:warm .
 *
 * ROLL BACK: put the other folder's name in .next-live and restart.
 *
 * A plain `npm run build` still builds into .next, and its prebuild step
 * removes .next-live so `npm start` serves that build — the old procedure
 * keeps working exactly as before.
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { carryImageCache } = require("./image-cache");

const ROOT = path.join(__dirname, "..");
const POINTER = path.join(ROOT, ".next-live");
const SLOTS = [".next-a", ".next-b"];
const argv = process.argv.slice(2);
const i = argv.indexOf("--restart");
const RESTART = i !== -1 ? argv[i + 1] : undefined;
const WARM = !argv.includes("--no-warm");
const w = argv.indexOf("--warm-url");
const WARM_URL = w !== -1 ? argv[w + 1] : undefined;

function warmImages() {
    if (!WARM) return;
    const args = [path.join(__dirname, "warm-images.js"), ...(WARM_URL ? ["--url", WARM_URL] : [])];
    spawnSync(process.execPath, args, { cwd: ROOT, stdio: "inherit" });
}

function banner(lines) {
    const bar = "=".repeat(72);
    console.log(`\n${bar}\n${lines.map((l) => `  ${l}`).join("\n")}\n${bar}\n`);
}

const live = fs.existsSync(POINTER) ? fs.readFileSync(POINTER, "utf8").trim() : ".next";
const target = live === SLOTS[0] ? SLOTS[1] : SLOTS[0];
console.log(`build:safe — live: ${live}/   building into: ${target}/`);

// Each build fetches Sanity fresh: drop the data cache this folder kept from
// its previous build (the compile cache is kept, for speed; the image cache is
// replaced by the live folder's after a successful build — see above).
fs.rmSync(path.join(ROOT, target, "cache", "fetch-cache"), { recursive: true, force: true });

const nextBin = require.resolve("next/dist/bin/next", { paths: [ROOT] });
const result = spawnSync(process.execPath, [nextBin, "build"], {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, NEXT_DIST_DIR: target },
});

if (result.status !== 0) {
    banner([
        "BUILD FAILED — nothing was changed on the live site.",
        `It keeps serving the previous build (${live}/).`,
        "Read the error above, fix it, and run  npm run build:safe  again.",
    ]);
    process.exitCode = 1;
} else {
    // Before the switch: give the new folder the live folder's prepared
    // images (bounded; never fails the deploy — see scripts/image-cache.js).
    // Only when the warm-up will follow the restart: without it a carried
    // cache makes the first visit slower (see the header).
    if (RESTART && WARM) carryImageCache(path.join(ROOT, live), path.join(ROOT, target));

    // Write-then-rename, so .next-live is never half-written.
    fs.writeFileSync(`${POINTER}.tmp`, `${target}\n`);
    fs.renameSync(`${POINTER}.tmp`, POINTER);

    if (!RESTART) {
        banner([
            `Build succeeded. .next-live now points at ${target}/.`,
            "RESTART THE SITE NOW (it must be started with  npm start ) to serve it.",
            `Until the restart it keeps serving ${live}/. To undo: write ${live} into .next-live.`,
            "Then, optionally:  npm run images:warm  (prepares every page's top photos).",
        ]);
    } else {
        console.log(`\nRestarting: ${RESTART}`);
        const r = spawnSync(RESTART, { cwd: ROOT, stdio: "inherit", shell: true });
        if (r.status === 0) {
            banner([`Build succeeded; the site was restarted on ${target}/.`]);
            warmImages();
        } else {
            banner([
                `Build succeeded (.next-live -> ${target}/) but the restart command FAILED.`,
                "Restart the site by hand.",
            ]);
            process.exitCode = 1;
        }
    }
}
