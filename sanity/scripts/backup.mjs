// Backup of the whole Sanity dataset — every document, draft and image.
//
//   npm run sanity:backup                     -> C:\Backups\arch-sanity\
//   npm run sanity:backup -- --dir "<folder>" another folder
//
// Runs `sanity dataset export`, which is READ-ONLY on Sanity's side, into
//   <folder>\production-YYYY-MM-DD_HHMM.tar.gz
// and keeps the newest KEEP of those files (only files with exactly that name
// pattern are ever removed). Each run appends one line to <folder>\backup.log.
// Scheduled weekly on the owner's PC by Windows Task Scheduler, task
// "Arch Creative - Sanity backup" (set up 2026-09-25; sanity/README.md).
//
// RESTORE (writes to Sanity — only on the owner's say-so):
//   into a NEW dataset, to inspect it first:
//     npx sanity dataset create restore-test
//     npx sanity dataset import "<file>.tar.gz" restore-test
//   over production, replacing documents that have the same id:
//     npx sanity dataset import "<file>.tar.gz" production --replace
//
// Reads NEXT_PUBLIC_SANITY_PROJECT_ID / _DATASET and SANITY_WRITE_TOKEN from
// .env.local and hands the token to the CLI in its environment only. Prints
// variable NAMES, never values.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const require = createRequire(path.join(ROOT, "package.json"));
const argv = process.argv.slice(2);
const i = argv.indexOf("--dir");
const DIR = path.resolve(i !== -1 && argv[i + 1] ? argv[i + 1] : "C:/Backups/arch-sanity");
const KEEP = 8; // two months of weekly backups
const NAME = /^production-\d{4}-\d{2}-\d{2}_\d{4}\.tar\.gz$/;

require("@next/env").loadEnvConfig(ROOT, false, { info() {}, error() {} });
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const TOKEN = process.env.SANITY_WRITE_TOKEN || "";

fs.mkdirSync(DIR, { recursive: true });
const log = (line) => {
    console.log(line);
    fs.appendFileSync(path.join(DIR, "backup.log"), `${new Date().toISOString()}  ${line}\n`);
};

function main() {
    if (!PROJECT_ID) return log("FAILED: NEXT_PUBLIC_SANITY_PROJECT_ID is not set in .env.local");
    if (!TOKEN) return log("FAILED: SANITY_WRITE_TOKEN is not set in .env.local (drafts need a token)");

    const d = new Date();
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
    const file = path.join(DIR, `${DATASET}-${stamp}.tar.gz`);
    const partial = `${file}.partial`;
    // A run that was interrupted leaves its unfinished file; it is not a backup.
    for (const f of fs.readdirSync(DIR)) if (/^production-.*\.tar\.gz\.partial$/.test(f)) fs.rmSync(path.join(DIR, f));

    // The CLI entry is not in the package's "exports", so it is addressed by path.
    const cli = path.join(ROOT, "node_modules", "sanity", "bin", "sanity");
    const r = spawnSync(process.execPath, [cli, "dataset", "export", DATASET, partial, "-p", PROJECT_ID, "--overwrite"], {
        cwd: ROOT,
        stdio: "inherit",
        env: { ...process.env, SANITY_AUTH_TOKEN: TOKEN },
    });
    if (r.status !== 0 || !fs.existsSync(partial) || fs.statSync(partial).size === 0) {
        fs.rmSync(partial, { force: true });
        process.exitCode = 1;
        return log(`FAILED: sanity dataset export exited with ${r.status}; no backup written`);
    }
    // Only a finished export gets the real name, so a half-written file is
    // never mistaken for a backup (or counted when old ones are pruned).
    fs.renameSync(partial, file);
    const mb = (fs.statSync(file).size / 1024 / 1024).toFixed(1);

    const all = fs.readdirSync(DIR).filter((f) => NAME.test(f)).sort().reverse();
    const pruned = all.slice(KEEP);
    for (const f of pruned) fs.rmSync(path.join(DIR, f));
    log(`OK: ${path.basename(file)} (${mb} MB); kept ${Math.min(all.length, KEEP)}${pruned.length ? `, removed ${pruned.join(", ")}` : ""}`);
}

main();
