// Stage 2 content fix-up for the 34 project pages, in Sanity.
//
//   npm run sanity:pages                dry run — reads Sanity, writes nothing
//   npm run sanity:pages -- --apply     one transaction, published documents
//
// Two jobs, both approved by the owner (2026-09-25):
//
//  1. PAGE TITLE. Fills the new `pageTitle` field of each page's project with
//     the title the page shows today (data/projects.js). Only where it is
//     EMPTY — a title typed in the Studio is never replaced.
//
//  2. THE FIVE CORRECTED LINKS. scripts/import-projects.js MANUAL now links five
//     pages to the list row they really are (e.g. "geetanjali-studio-ajmer" is
//     #166 Ajmer, not #182 Alwar). The seed had put each page's copy and photo
//     on the old row's document. This moves them — slug, the four written
//     sections, main photo, grading, status — to the right document, and
//     returns the old one to what an empty content-pack folder gives (its own
//     list slug, no copy, status draft). Home "Selected projects" is pointed
//     at the new document, so the home page keeps the same six cards.
//
// SAFE TO RE-RUN: a finished move is not planned again, and a filled
// pageTitle is left alone. Every patch carries the document's revision, so if
// anyone edits one of these documents in the Studio between the dry run and
// the write, the whole transaction is refused instead of overwriting them.
// A project with an unpublished Studio draft is skipped and reported.
//
// Reads NEXT_PUBLIC_SANITY_PROJECT_ID / _DATASET and SANITY_WRITE_TOKEN from
// .env.local. Prints variable NAMES, never values.

import fs from "node:fs";
import path from "node:path";
import { createRequire, registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const require = createRequire(path.join(ROOT, "package.json"));
const DATA_DIR = path.join(ROOT, "src", "app", "lib", "data");
const APPLY = process.argv.includes("--apply");

// Never process.exit(): on Windows it can abort Node while sockets close.
class PagesError extends Error {}
const fail = (m) => {
    throw new PagesError(m);
};

require("@next/env").loadEnvConfig(ROOT, false, { info() {}, error() {} });
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const TOKEN = process.env.SANITY_WRITE_TOKEN || "";

// data/projects.js imports its photos; in plain Node those become stubs.
registerHooks({
    load(url, context, nextLoad) {
        if (url.startsWith("file:") && /\.(jpe?g|png|webp)$/i.test(url))
            return { format: "module", source: "export default {};", shortCircuit: true };
        if (url.startsWith(pathToFileURL(DATA_DIR).href))
            return { ...nextLoad(url, { ...context, format: "module" }), format: "module" };
        return nextLoad(url, context);
    },
});

// The page fields that travel with a page when it moves document.
const PAGE_FIELDS = [
    "overview", "challenge", "solution", "features", "heroImage",
    "photoQuality", "storyStrength", "status", "clientDisplayConsent",
];

async function main() {
    const { projects } = await import(pathToFileURL(path.join(DATA_DIR, "projects.js")).href);
    const src = fs.readFileSync(path.join(DATA_DIR, "projectsData.js"), "utf8");
    const rows = JSON.parse(src.slice(src.indexOf("["), src.lastIndexOf("]") + 1));
    const rowByNo = new Map(rows.map((r) => [r.listNo, r]));

    if (!PROJECT_ID) fail("NEXT_PUBLIC_SANITY_PROJECT_ID is not set.");
    if (!TOKEN) fail("SANITY_WRITE_TOKEN is not set (needed to see drafts, and to write).");
    const client = require("@sanity/client").createClient({
        projectId: PROJECT_ID, dataset: DATASET, apiVersion: "2024-01-01",
        useCdn: false, token: TOKEN, perspective: "raw",
    });

    const all = await client.fetch(`*[_type == "project"]`);
    const byId = new Map(all.map((d) => [d._id, d]));
    const selected = await client.fetch(`*[_id == "homeSelectedProjects"][0]{_rev, projects}`);
    if (await client.fetch(`defined(*[_id == "drafts.homeSelectedProjects"][0])`))
        fail("Home \"Selected projects\" has an unpublished draft — publish or discard it in the Studio first.");

    const patches = new Map(); // _id -> { rev, set, unset }
    const patchOf = (doc) => {
        if (!patches.has(doc._id)) patches.set(doc._id, { rev: doc._rev, set: {}, unset: [] });
        return patches.get(doc._id);
    };
    const skipped = [];
    const moves = [];
    const titles = [];

    for (const page of projects) {
        const row = rows.find((r) => r.detailSlug === page.id);
        if (!row) fail(`page "${page.id}" has no list row (projectsData.js detailSlug).`);
        const target = byId.get(`project-${row.listNo}`);
        if (!target) fail(`project-${row.listNo} is not in Sanity.`);
        if (byId.has(`drafts.${target._id}`)) {
            skipped.push(`${target._id} (${page.id}): has an unpublished Studio draft`);
            continue;
        }

        // A published document OTHER than the right one holding this page's slug.
        const holder = all.find(
            (d) => !d._id.startsWith("drafts.") && d._id !== target._id && d.slug?.current === page.id
        );
        if (holder) {
            if (byId.has(`drafts.${holder._id}`)) {
                skipped.push(`${holder._id} -> ${target._id} (${page.id}): the old document has a Studio draft`);
                continue;
            }
            if ((holder.gallery || []).length || (holder.beforeImages || []).length)
                fail(`${holder._id} has gallery/before photos — someone added them in the Studio; move by hand.`);
            if (target.overview || target.heroImage)
                fail(`${target._id} already has copy or a photo — refusing to overwrite it.`);
            const holderRow = rowByNo.get(holder.listNo);
            if (!holderRow || holderRow.detailSlug) fail(`${holder._id}: its list row is missing or still has a page.`);

            const t = patchOf(target);
            t.set.slug = { _type: "slug", current: page.id };
            for (const f of PAGE_FIELDS) if (holder[f] !== undefined) t.set[f] = holder[f];

            const h = patchOf(holder);
            h.set.slug = { _type: "slug", current: holderRow.slug };
            h.set.photoQuality = "none";
            h.set.storyStrength = "thin";
            h.set.status = "draft";
            h.set.clientDisplayConsent = false;
            h.unset.push("overview", "challenge", "solution", "features", "heroImage");
            moves.push({ page: page.id, from: holder._id, to: target._id });
        } else if (target.slug?.current !== page.id) {
            fail(`${target._id} has slug "${target.slug?.current}" and nothing holds "${page.id}".`);
        }

        const title = page.title.trim();
        if (!target.pageTitle) {
            patchOf(target).set.pageTitle = title;
            titles.push({ id: target._id, title, name: target.name });
        }
    }

    // Home "Selected projects": same six pages, now on the right documents.
    let selectedChange = null;
    if (selected && moves.length) {
        const to = new Map(moves.map((m) => [m.from, m.to]));
        const next = (selected.projects || []).map((r) =>
            to.has(r._ref) ? { ...r, _key: to.get(r._ref), _ref: to.get(r._ref) } : r
        );
        if (JSON.stringify(next) !== JSON.stringify(selected.projects)) {
            selectedChange = { rev: selected._rev, projects: next };
        }
    }

    // ── report ────────────────────────────────────────────────────────────────
    console.log(`\nProject pages — ${APPLY ? "APPLY" : "dry run (nothing is written)"}`);
    console.log(`\npage moves (${moves.length}):`);
    for (const m of moves) console.log(`  ${m.page.padEnd(28)} ${m.from} -> ${m.to}`);
    console.log(`\npage titles to fill (${titles.length}):`);
    for (const t of titles) console.log(`  ${t.id.padEnd(12)} "${t.title}"${t.title === t.name ? "  (same as the name)" : ""}`);
    if (selectedChange)
        console.log(`\nHome "Selected projects": ${selectedChange.projects.map((r) => r._ref).join(", ")}`);
    if (skipped.length) {
        console.log(`\nskipped (${skipped.length}):`);
        skipped.forEach((s) => console.log(`  ! ${s}`));
    }
    console.log(`\ndocuments to change: ${patches.size + (selectedChange ? 1 : 0)}`);

    if (!APPLY) {
        console.log("\nDry run only. Re-run with --apply to write.\n");
        return;
    }
    if (!patches.size && !selectedChange) {
        console.log("\nNothing to do.\n");
        return;
    }

    const tx = client.transaction();
    for (const [id, p] of patches) {
        tx.patch(id, (patch) => {
            let q = patch.ifRevisionId(p.rev).set(p.set);
            if (p.unset.length) q = q.unset(p.unset);
            return q;
        });
    }
    if (selectedChange)
        tx.patch("homeSelectedProjects", (p) => p.ifRevisionId(selectedChange.rev).set({ projects: selectedChange.projects }));
    const res = await tx.commit({ visibility: "sync" });
    console.log(`\nDone: transaction ${res.transactionId}, ${res.results.length} documents changed.\n`);
}

try {
    await main();
} catch (e) {
    if (!(e instanceof PagesError)) throw e;
    console.error(`\nsanity:pages: ${e.message}\n`);
    process.exitCode = 1;
}
