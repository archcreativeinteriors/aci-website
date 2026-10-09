/**
 * npm start [-- -p 3100]
 *
 * `next start`, serving the build that `npm run build:safe` last finished
 * (the folder named in .next-live — see scripts/safe-build.js). With no
 * .next-live it serves .next, exactly like a bare `next start`.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const POINTER = path.join(ROOT, ".next-live");

if (fs.existsSync(POINTER)) {
    const dir = fs.readFileSync(POINTER, "utf8").trim();
    if (!/^\.next(-[ab])?$/.test(dir) ||!fs.existsSync(path.join(ROOT, dir, "BUILD_ID"))) {
        console.error(`start: .next-live names "${dir}", which is not a finished build. Run npm run build:safe.`);
        process.exitCode = 1;
        return;
    }
    process.env.NEXT_DIST_DIR = dir;
    console.log(`start: serving ${dir}/ (from .next-live)`);
}

// Run Next's own CLI in this process, so the process manager's signals reach it.
const nextBin = require.resolve("next/dist/bin/next", { paths: [ROOT] });
process.argv = [process.argv[0], nextBin, "start", ...process.argv.slice(2)];
require(nextBin);
