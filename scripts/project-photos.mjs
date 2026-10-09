// Project photographs: the owner's folders -> each project's photos in Sanity.
//
//   npm run photos:upload                    dry run — reads the folders and
//                                            Sanity, prints the plan, writes nothing
//   npm run photos:upload -- --apply         optimizes, uploads, publishes
//   npm run photos:upload -- --report <f>    also write the plan as Markdown
//   npm run photos:upload -- --leave 1,2     leave these list numbers alone
//   npm run photos:upload -- --only 116,104  only these list numbers
//   npm run photos:upload -- --from "<dir>"  a different source folder
//
// SANITY IS THE ONLY HOME of the project photos (owner, 2026-09-25). Nothing
// is copied into the repo: the optimized files are staged OUTSIDE it, in
// C:/dev/project-photos-optimized (--work), and uploaded from there.
//
// ── the source ───────────────────────────────────────────────────────────────
// One folder per project, named "<list number>. <name and place>", e.g.
// "116. Geetanjali Salon Malviya Nagar Jaipur Rajasthan". The NUMBER is the
// join — the project in Sanity with that List number — exactly like the
// content pack. The name is only checked, never trusted: a folder whose name
// shares too little with its row is reported, and FOLDER_NUMBER below records
// the owner-approved fixes for folders whose number is wrong. The owner's
// folders are only ever READ.
//
// ── the naming rule (owner, 2026-09-25) ──────────────────────────────────────
//   hero.jpg / hero.jpeg  -> the main photo (Hero image)
//   before-*.jpg          -> Before images
//   everything else       -> Gallery, in natural file-name order (1, 2 … 10)
//   no hero.*             -> the first gallery file is the main photo
//   skipped               -> desktop.ini, and Picasa's hidden .picasaoriginals
//
// ── each photo ───────────────────────────────────────────────────────────────
// Turned upright, resized to at most 2000px on its long side, converted to
// sRGB and saved as WebP q80 with ALL metadata dropped (EXIF, GPS, camera) —
// checked on every file before it is uploaded. Alt text: "<name>, <location>".
//
// ── what it changes in Sanity, and what it never does ────────────────────────
//   * NEVER removes or reorders an image already on a project. New ones are
//     added AFTER the existing ones.
//   * NO DUPLICATES. A photo is skipped when the project already has the same
//     file (Sanity's sha1) or the same picture (a visual difference-hash, so a
//     copy the owner uploaded in the Studio as a JPEG still counts).
//   * Main photo: set when the project has none. The photo a page showed until
//     now (the seed put public/images/ files there) is REPLACED by the
//     folder's hero, and moved to the end of the gallery unless the folder
//     already has it. A main photo chosen in the Studio is never replaced.
//   * Writes the PUBLISHED document directly — nothing is left in drafts. A
//     project with an unpublished Studio draft is skipped and reported. Every
//     write carries the document's revision: if it changed since it was read,
//     that project is refused, not overwritten.
//   * Safe to re-run: what is already there is skipped. The ledger
//     (<work>/ledger.json) remembers which file became which asset.
//
// Reads NEXT_PUBLIC_SANITY_PROJECT_ID / _DATASET and SANITY_WRITE_TOKEN from
// .env.local. Prints variable NAMES, never values.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "package.json"));
const sharp = require("sharp");

const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const opt = (name, fallback) => {
    const i = argv.indexOf(name);
    return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};
const numbers = (s) => new Set((s || "").split(",").map((x) => Number(x.trim())).filter(Boolean));
const SOURCE = path.resolve(opt("--from", "C:/edited for website (projects )/IMPORTANT DONOT DLETE"));
const WORK = path.resolve(opt("--work", "C:/dev/project-photos-optimized"));
const REPORT = opt("--report", null);
const LEAVE = numbers(opt("--leave", ""));
const ONLY = numbers(opt("--only", ""));

const FILES = path.join(WORK, "files");
const LEDGER = path.join(WORK, "ledger.json");
// The photos the site showed until 2026-09-25, which the seed uploaded as the
// 34 pages' main photos. Only a main photo that is one of THESE is replaced.
// (Archived with the other local content in Phase 6, 2026-09-28.)
const SITE_PHOTO_DIRS = ["archive/public/images/watermark-images", "public/images/watermark-images"].map((d) => path.join(ROOT, d));

const MAX_EDGE = 2000;
const WEBP = { quality: 80 };
// Difference-hash distance, of 256 bits. Measured 2026-09-25 on the owner's
// Studio uploads vs the same folder files: the SAME photo scores 6-40 (JPEG vs
// WebP, thumbnail vs full size); DIFFERENT photos never scored below 93.
const SAME_PICTURE = 60;

// Owner-approved fixes (2026-09-25, docs/project-photos-plan.md).
// Folder name -> the list number it really belongs to.
const FOLDER_NUMBER = {
    "185. Fab U Salon Piru Vihar Delhi Cantt Delhi": 187, // #185 is Bellance, Raipur
};
// A subfolder that is a whole other project's folder, not photos of its parent.
const NESTED_PROJECT = /^\d+\s*[.)]/; // e.g. "19. Nails @ Dalip Salon Vasant Vihar Delhi"
const SKIP_DIRS = new Set([".picasaoriginals"]);
const IMAGE = /\.jpe?g$/i;
const HERO = /^hero\.jpe?g$/i;
const BEFORE = /^before[-_ ]/i;

// Never process.exit(): on Windows it can abort Node while sockets close.
class PhotoError extends Error {}
const fail = (m) => {
    throw new PhotoError(m);
};
const natural = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
const pad = (n) => String(n).padStart(2, "0");
const sha1 = (file) => crypto.createHash("sha1").update(fs.readFileSync(file)).digest("hex");
const key = () => crypto.randomBytes(6).toString("hex");

/** Every project in Sanity (published documents), as { listNo, slug, name, loc, detailSlug }. */
async function loadRows(client) {
    const docs = await client.fetch(
        `*[_type == "project" && defined(listNo) && !(_id in path("drafts.**"))]{listNo, "slug": slug.current, name, "loc": location, status}`
    );
    if (!docs.length) fail("no projects found in Sanity");
    return docs.map((d) => ({ ...d, loc: d.loc || "", detailSlug: d.status === "published" ? d.slug : null }));
}

// Loose name check: share of the folder's distinctive words found in the row.
const words = (s) =>
    new Set(
        s.toLowerCase()
            .replace(/gurugram|gurugam/g, "gurgaon")
            .replace(/&/g, " and ")
            .replace(/[^a-z0-9]+/g, " ")
            .split(" ")
            .filter((w) => w.length > 1 && !["salon", "the", "and", "new", "u", "p", "uk", "sector"].includes(w))
    );
function nameAgreement(label, row) {
    const a = words(label), b = words(`${row.name} ${row.loc}`);
    let hit = 0;
    for (const w of a) if (b.has(w)) hit++;
    return hit / Math.max(1, Math.min(a.size, b.size));
}

/** Every project folder, including one nested inside another project's folder. */
function findFolders() {
    if (!fs.existsSync(SOURCE)) fail(`source folder not found: ${SOURCE}`);
    const found = [];
    const visit = (dir, name, parent) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const images = entries.filter((e) => e.isFile() && IMAGE.test(e.name) && fs.statSync(path.join(dir, e.name)).size > 0);
        const extra = []; // photos in a plain subfolder (e.g. ACADEMY) belong to this project
        for (const e of entries.filter((e) => e.isDirectory())) {
            if (SKIP_DIRS.has(e.name)) continue;
            if (NESTED_PROJECT.test(e.name)) visit(path.join(dir, e.name), e.name, name);
            else
                for (const f of fs.readdirSync(path.join(dir, e.name)))
                    if (IMAGE.test(f)) extra.push(path.join(e.name, f));
        }
        found.push({ name, dir, parent, files: images.map((e) => e.name), extra });
    };
    for (const e of fs.readdirSync(SOURCE, { withFileTypes: true }))
        if (e.isDirectory()) visit(path.join(SOURCE, e.name), e.name, null);
    return found;
}

/** Folder -> project row + the ordered list of photos with their roles. */
async function scan(client) {
    const rows = await loadRows(client);
    const byNo = new Map(rows.map((r) => [r.listNo, r]));
    const problems = [];
    const projects = [];
    for (const f of findFolders()) {
        const m = f.name.match(/^\s*(\d+)\s*[.)\-]?\s*(.*)$/);
        const no = FOLDER_NUMBER[f.name] ?? (m ? Number(m[1]) : null);
        const row = no != null ? byNo.get(no) : null;
        if (!row) {
            problems.push(`"${f.name}": no list row #${no}`);
            continue;
        }
        const agree = nameAgreement(m ? m[2] : f.name, row);
        if (agree < 0.5 && !(f.name in FOLDER_NUMBER))
            problems.push(`"${f.name}": name does not match #${no} "${row.name} (${row.loc})"`);

        const own = [...f.files].sort(natural);
        const hero = own.find((x) => HERO.test(x));
        const before = own.filter((x) => BEFORE.test(x));
        const gallery = [...own.filter((x) => x !== hero && !before.includes(x)), ...[...f.extra].sort(natural)];
        const main = hero || gallery.shift();
        const photos = [
            ...(main ? [{ role: "hero", source: main, out: "hero.webp" }] : []),
            ...gallery.map((s, i) => ({ role: "gallery", source: s, out: `${pad(i + 1)}.webp` })),
            ...before.map((s, i) => ({ role: "before", source: s, out: `before-${pad(i + 1)}.webp` })),
        ];
        projects.push({
            listNo: row.listNo,
            slug: row.detailSlug || row.slug,
            hasPage: Boolean(row.detailSlug),
            name: row.name,
            location: row.loc,
            folder: f.parent ? `${f.parent}/${f.name}` : f.name,
            dir: f.dir,
            heroFromFirstFile: !hero,
            photos,
        });
    }
    const seen = new Map();
    for (const p of projects) {
        if (seen.has(p.listNo)) problems.push(`#${p.listNo} has two folders: "${seen.get(p.listNo)}" and "${p.folder}"`);
        seen.set(p.listNo, p.folder);
    }
    return { rows, projects: projects.sort((a, b) => b.listNo - a.listNo), problems };
}

// ── images ───────────────────────────────────────────────────────────────────

async function encode(src, dest) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    await sharp(src, { failOn: "none" })
        .rotate() // apply the camera's orientation before the EXIF that carries it is dropped
        .resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true })
        .toColorspace("srgb")
        .webp(WEBP) // sharp writes NO metadata unless asked: EXIF / GPS / ICC all gone
        .toFile(dest);
}

async function checkClean(file) {
    const meta = await sharp(file).metadata();
    if (meta.exif || meta.xmp || meta.iptc) fail(`metadata survived in ${file} — not uploaded`);
    if (Math.max(meta.width, meta.height) > MAX_EDGE) fail(`${file} is larger than ${MAX_EDGE}px — not uploaded`);
}

/** 256-bit difference hash: the same picture re-encoded or resized stays within a few bits. */
async function dhash(input) {
    const px = await sharp(input, { failOn: "none" }).rotate().resize(17, 16, { fit: "fill" }).grayscale().raw().toBuffer();
    let bits = "";
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) bits += px[y * 17 + x] > px[y * 17 + x + 1] ? "1" : "0";
    return bits;
}
const distance = (a, b) => {
    let d = 0;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
    return d;
};
const nearest = (hash, list) => Math.min(Infinity, ...list.map((h) => distance(hash, h)));

async function remoteHash(url) {
    const res = await fetch(`${url}?w=96&h=96&fit=max`);
    if (!res.ok) fail(`could not read ${url} from Sanity (${res.status})`);
    return dhash(Buffer.from(await res.arrayBuffer()));
}

// ── Sanity ───────────────────────────────────────────────────────────────────

function sanityClient() {
    require("@next/env").loadEnvConfig(ROOT, false, { info() {}, error() {} });
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
    const token = process.env.SANITY_WRITE_TOKEN || "";
    if (!projectId) fail("NEXT_PUBLIC_SANITY_PROJECT_ID is not set.");
    if (!token) fail("SANITY_WRITE_TOKEN is not set (needed to see drafts, and to write).");
    return require("@sanity/client").createClient({
        projectId,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
        apiVersion: "2024-01-01",
        useCdn: false,
        token,
        perspective: "raw",
    });
}

const IMG = `{_key, alt, "ref": asset._ref, "url": asset->url, "sha1": asset->sha1hash}`;

async function readSanity(client, projects) {
    const ids = projects.map((p) => `project-${p.listNo}`);
    const docs = await client.fetch(
        `*[_id in $ids]{_id, _rev, name, "hero": heroImage${IMG}, "gallery": gallery[]${IMG}, "before": beforeImages[]${IMG}}`,
        { ids }
    );
    const drafts = new Set(await client.fetch(`*[_id in $ids]._id`, { ids: ids.map((id) => `drafts.${id}`) }));
    return { docs: new Map(docs.map((d) => [d._id, d])), drafts };
}

// ── the plan ─────────────────────────────────────────────────────────────────

const ledgerOf = () => (fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, "utf8")) : { projects: [] });

/** The staged, optimized file for a photo — made now if missing or stale (apply only). */
async function staged(p, ph, ledger) {
    const dest = path.join(FILES, p.slug, ph.out);
    const old = ledger.projects.find((x) => x.slug === p.slug)?.photos.find((x) => x.out === ph.out);
    const fresh = fs.existsSync(dest) && old && old.source === ph.source;
    if (!fresh) {
        if (!APPLY) return { dest, file: path.join(p.dir, ph.source), old: null }; // plan from the original
        await encode(path.join(p.dir, ph.source), dest);
    }
    return { dest, file: dest, old: fresh ? old : null };
}

async function planProject(p, doc, sitePhotoSha1, ledger) {
    const existing = [doc.hero, ...(doc.gallery || []), ...(doc.before || [])].filter((i) => i && i.url);
    const hashes = [];
    for (const img of existing) hashes.push((img.hash = await remoteHash(img.url)));
    const shas = new Set(existing.map((i) => i.sha1));

    const photos = [];
    for (const ph of p.photos) {
        const s = await staged(p, ph, ledger);
        const hash = s.old?.hash || (await dhash(s.file));
        const fileSha = APPLY || s.old ? sha1(s.dest) : null;
        const dup = (fileSha && shas.has(fileSha)) || nearest(hash, hashes) <= SAME_PICTURE;
        photos.push({ ...ph, dest: s.dest, hash, sha1: fileSha, dup });
    }

    const hero = photos.find((x) => x.role === "hero");
    const seededHero = doc.hero?.url && sitePhotoSha1.has(doc.hero.sha1);
    const isCurrentHero =
        hero && doc.hero?.url && (hero.sha1 === doc.hero.sha1 || distance(hero.hash, doc.hero.hash) <= SAME_PICTURE);
    let heroAction = "none";
    if (hero && !doc.hero?.url) heroAction = "set";
    else if (isCurrentHero) heroAction = "keep"; // the main photo is already this picture
    else if (hero && seededHero) heroAction = "replace";
    else if (hero) heroAction = "keep-studio"; // chosen in the Studio: never replaced

    // The old main photo, when replaced, goes to the end of the gallery — unless
    // the folder already has that picture.
    const oldHeroToGallery =
        heroAction === "replace" && nearest(doc.hero.hash, photos.map((x) => x.hash)) > SAME_PICTURE;

    const addGallery = photos.filter((x) => x.role === "gallery" && !x.dup);
    // A folder hero that cannot be the main photo (the Studio chose another)
    // still belongs in the gallery.
    if (heroAction === "keep-studio" && !hero.dup) addGallery.unshift(hero);
    const addBefore = photos.filter((x) => x.role === "before" && !x.dup);
    return {
        heroAction,
        hero,
        oldHeroToGallery,
        addGallery,
        addBefore,
        existingGallery: (doc.gallery || []).length,
        dupes: photos.filter((x) => x.dup && !(x.role === "hero" && heroAction === "keep")).length,
        photos,
    };
}

async function main() {
    const client = sanityClient();
    const { projects: all, problems, rows } = await scan(client);
    if (problems.length) {
        console.log(`\n${problems.length} problem(s) with the folders:`);
        problems.forEach((p) => console.log(`  ! ${p}`));
        fail("fix the problems above first (nothing was written).");
    }
    const projects = all.filter((p) => (!ONLY.size || ONLY.has(p.listNo)));
    const { docs, drafts } = await readSanity(client, projects);
    const ledger = ledgerOf();

    const sitePhotoSha1 = new Set(
        SITE_PHOTO_DIRS.filter((d) => fs.existsSync(d)).flatMap((d) => fs.readdirSync(d).map((f) => sha1(path.join(d, f))))
    );

    console.log(`\nProject photos -> Sanity — ${APPLY ? "APPLY" : "dry run (nothing is written)"}`);
    console.log(`  source : ${SOURCE}`);
    console.log(`  staging: ${WORK}  (outside the repo)`);
    console.log(`  folders: ${all.length}${ONLY.size ? `, of which ${projects.length} selected (--only)` : ""}`);

    const results = [];
    let n = 0;
    for (const p of projects) {
        const id = `project-${p.listNo}`;
        const doc = docs.get(id);
        const r = { p, id };
        if (!doc) r.skip = "no such project in Sanity";
        else if (drafts.has(id)) r.skip = "has unpublished Studio changes — publish or discard them, then re-run";
        else if (LEAVE.has(p.listNo)) r.skip = "left alone (--leave)";
        else Object.assign(r, await planProject(p, doc, sitePhotoSha1, ledger), { doc });
        results.push(r);
        if (++n % 20 === 0) console.log(`  planned ${n}/${projects.length}`);
    }

    // ── report ────────────────────────────────────────────────────────────────
    const todo = results.filter((r) => !r.skip && (r.heroAction === "set" || r.heroAction === "replace" || r.addGallery.length || r.addBefore.length));
    const heroWord = { set: "set", replace: "replace", keep: "keep (same photo)", "keep-studio": "keep (chosen in Studio)", none: "—" };
    const lines = [
        "| # | Project slug | Folder | Photos in folder | Already in Sanity | Main photo | Gallery: now → after | Before: +N | Note |",
        "|---|---|---|---|---|---|---|---|---|",
    ];
    for (const r of results) {
        const cells = r.skip
            ? [r.p.photos.length, "", "", "", "", r.skip]
            : [
                  r.p.photos.length,
                  r.dupes || "",
                  heroWord[r.heroAction] + (r.p.heroFromFirstFile && r.heroAction !== "none" ? " (first file, no hero.jpg)" : ""),
                  `${r.existingGallery} → ${r.existingGallery + r.addGallery.length + (r.oldHeroToGallery ? 1 : 0)}`,
                  r.addBefore.length || "",
                  r.oldHeroToGallery ? "old main photo moved to the end of the gallery" : "",
              ];
        lines.push(`| ${r.p.listNo} | ${r.p.slug}${r.p.hasPage ? " (page)" : ""} | ${r.p.folder.replace(/\|/g, "/")} | ${cells.join(" | ")} |`);
    }
    const uploads = todo.reduce((k, r) => k + r.addGallery.length + r.addBefore.length + (["set", "replace"].includes(r.heroAction) ? 1 : 0), 0);
    const listed = new Set(all.map((p) => p.listNo));
    const noFolder = rows.filter((r) => !listed.has(r.listNo));
    const summary = [
        `projects to change : ${todo.length}`,
        `photos to upload   : ${uploads}`,
        `already in Sanity  : ${results.reduce((k, r) => k + (r.dupes || 0), 0)} (skipped)`,
        `skipped projects   : ${results.filter((r) => r.skip).length}`,
        ...results.filter((r) => r.skip).map((r) => `  #${r.p.listNo} ${r.p.slug}: ${r.skip}`),
        `list rows without a folder (${noFolder.length}): ${noFolder.map((r) => `#${r.listNo}`).join(", ") || "none"}`,
    ];
    console.log("\n" + summary.join("\n"));
    if (REPORT) {
        fs.writeFileSync(REPORT, `# Photo upload plan (${new Date().toISOString().slice(0, 16)}Z)\n\n${summary.map((s) => `    ${s}`).join("\n")}\n\n${lines.join("\n")}\n`);
        console.log(`\nplan written: ${REPORT}`);
    }

    if (!APPLY) {
        console.log("\nDry run only. Re-run with --apply to upload.\n");
        return;
    }

    // ── apply ─────────────────────────────────────────────────────────────────
    const alt = (p) => `${p.name}, ${p.location}`;
    const asset = async (p, ph) => {
        await checkClean(ph.dest);
        const a = await client.assets.upload("image", fs.createReadStream(ph.dest), { filename: `${p.slug}-${ph.out}` });
        return a._id;
    };
    const image = (ref, p) => ({ _type: "image", _key: key(), asset: { _type: "reference", _ref: ref }, alt: alt(p) });
    const saveLedger = () => {
        fs.mkdirSync(WORK, { recursive: true });
        fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 1) + "\n");
    };

    let done = 0, uploaded = 0;
    const refused = [];
    for (const r of todo) {
        const { p, doc } = r;
        const set = {};
        const gallery = [];
        const before = [];
        if (r.heroAction === "set" || r.heroAction === "replace") {
            const { _key, ...img } = image(await asset(p, r.hero), p);
            set.heroImage = img;
            uploaded++;
        }
        if (r.oldHeroToGallery) gallery.push({ _type: "image", _key: key(), asset: { _type: "reference", _ref: doc.hero.ref }, alt: alt(p) });
        for (const ph of r.addGallery) (gallery.push(image(await asset(p, ph), p)), uploaded++);
        for (const ph of r.addBefore) (before.push(image(await asset(p, ph), p)), uploaded++);

        let patch = client.patch(r.id).ifRevisionId(doc._rev);
        if (Object.keys(set).length) patch = patch.set(set);
        if (gallery.length) patch = patch.setIfMissing({ gallery: [] }).append("gallery", gallery);
        if (before.length) patch = patch.setIfMissing({ beforeImages: [] }).append("beforeImages", before);
        try {
            await patch.commit({ visibility: "async" });
        } catch (e) {
            refused.push(`#${p.listNo}: ${e.message.split("\n")[0]}`);
            continue;
        }

        // Ledger: the staged files and their dHashes, so a re-run skips work.
        const entry = { listNo: p.listNo, slug: p.slug, name: p.name, location: p.location, folder: p.folder,
            photos: r.photos.map(({ role, source, out, hash, sha1: s }) => ({ role, source, out, hash, sha1: s })) };
        ledger.projects = [...ledger.projects.filter((x) => x.slug !== p.slug), entry];
        saveLedger();
        console.log(`  #${p.listNo} ${p.slug}: done (${++done}/${todo.length})`);
    }

    const left = await client.fetch(`*[_id in path("drafts.**") && _type == "project"]._id`);
    console.log(`\nDone: ${done} projects, ${uploaded} photos uploaded and published.`);
    if (refused.length) {
        console.log(`\nRefused (changed in the Studio meanwhile — re-run to retry):`);
        refused.forEach((x) => console.log(`  ! ${x}`));
        process.exitCode = 1;
    }
    console.log(`Project drafts in Sanity now: ${left.length ? left.join(", ") : "none"}\n`);
}

try {
    await main();
} catch (e) {
    if (!(e instanceof PhotoError)) throw e;
    console.error(`\nphotos: ${e.message}\n`);
    process.exitCode = 1;
}
