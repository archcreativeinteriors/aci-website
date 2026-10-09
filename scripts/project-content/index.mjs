// npm run projects:content [-- --dataset staging] [--apply] [--replace-shared] [--audit]
//
// Fills each project page's four text fields in Sanity — Overview, Challenge,
// Solution and Features — with content written for THAT project from its own
// data (owner, 2026-10-08). See compose.mjs for how the text is written, and
// validate.mjs for the rules it must pass.
//
// SAFE BY DEFAULT
//   · Dry run unless --apply: nothing is written, the plan and the full text
//     are saved for review in C:\dev\project-content\ (outside the repo).
//   · Only EMPTY fields are filled. Text that is already in Sanity — written
//     by hand or by an earlier run and edited since — is never overwritten.
//     The one exception is --replace-shared (owner's call): text that is
//     pasted VERBATIM on several projects is replaced, on each of them.
//   · --apply refuses to run if any generated record fails validation, needs
//     an explicit --dataset, skips a project that has an unpublished draft open
//     in the Studio (writing under someone's edit would be lost on Publish), and
//     checks each document's revision so a concurrent edit is never clobbered.
//   · --audit: no generation, just the report for what is in Sanity now.
//
// Reads NEXT_PUBLIC_SANITY_PROJECT_ID / _DATASET and SANITY_WRITE_TOKEN from
// .env.local (names only are ever printed). The token is needed to see drafts
// and to write; the site itself never uses it.

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { context, composeProject, newRun } from "./compose.mjs";
import { FIELDS, checkRecord, duplicates, filled, mostSimilar, placeMismatch } from "./validate.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const require = createRequire(path.join(ROOT, "package.json"));
require("@next/env").loadEnvConfig(ROOT, false, { info() {}, error() {} });

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
const APPLY = flag("--apply");
const AUDIT = flag("--audit");
const REPLACE_SHARED = flag("--replace-shared");
const datasetArg = opt("--dataset");
const dataset = datasetArg || process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const OUT_DIR = opt("--out") || "C:\\dev\\project-content";

const fail = (msg) => {
    console.error(`\n${msg}\n`);
    process.exit(1);
};

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_WRITE_TOKEN || "";
if (!projectId) fail("NEXT_PUBLIC_SANITY_PROJECT_ID is not set (.env.local).");
if (APPLY && !datasetArg) fail("--apply needs an explicit --dataset (e.g. --dataset staging).");
if (APPLY && !token) fail("SANITY_WRITE_TOKEN is not set (.env.local) — needed to write.");

const client = require("@sanity/client").createClient({
    projectId,
    dataset,
    apiVersion: "2024-01-01",
    useCdn: false,
    token: token || undefined,
    perspective: "raw",
});

// ── read ──────────────────────────────────────────────────────────────────

const docs = await client.fetch(`*[_type == "project" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))] | order(listNo desc) {
  _id, _rev, listNo, status, name, pageTitle, "slug": slug.current,
  "brand": brand->name, "brandOk": defined(brand->_id), sector, subCategory, location, city, state,
  overview, challenge, solution, features,
  "hero": defined(heroImage.asset), "gallery": count(gallery[defined(asset)])
}`);
const draftIds = new Set(
    token ? await client.fetch(`*[_type == "project" && _id in path("drafts.**")]._id`) : []
);

const brandCount = new Map();
for (const d of docs) brandCount.set(d.brand, (brandCount.get(d.brand) || 0) + 1);

const asRecord = (d) => ({
    _id: d._id,
    slug: d.slug,
    listNo: d.listNo,
    status: d.status,
    title: d.pageTitle || d.name,
    city: d.city,
    location: d.location,
    overview: d.overview || "",
    challenge: d.challenge || "",
    solution: d.solution || "",
    keyFeatures: Array.isArray(d.features) ? d.features : [],
});
const existing = docs.map(asRecord);

// Fields shared verbatim with another project (pasted copy).
const shared = new Map(); // slug -> Set(field)
for (const [field, groups] of Object.entries(duplicates(existing))) {
    for (const slugs of groups) for (const s of slugs) shared.set(s, new Set([...(shared.get(s) || []), field]));
}

// ── plan + generate ───────────────────────────────────────────────────────

const used = newRun();
const plan = []; // { doc, fields: [...] }
const records = [];
for (const d of docs) {
    const rec = asRecord(d);
    const missing = FIELDS.filter((f) => !filled(rec, f));
    const replace = REPLACE_SHARED && shared.has(d.slug) ? FIELDS : [];
    const todo = [...new Set([...missing, ...replace])];
    rec.source = Object.fromEntries(FIELDS.map((f) => [f, filled(rec, f) && !todo.includes(f) ? "existing" : "generated"]));
    if (!AUDIT && todo.length) {
        const gen = composeProject(context(d, brandCount.get(d.brand) || 1), used);
        for (const f of todo) rec[f] = gen[f];
        plan.push({ doc: d, fields: todo });
    } else if (AUDIT) {
        for (const f of todo) rec.source[f] = "missing";
    }
    records.push(rec);
}

// ── validate ──────────────────────────────────────────────────────────────

const cities = [...new Set([...docs.map((d) => d.city), "Delhi", "Mumbai", "Bangalore", "Bengaluru", "Chennai", "Kolkata", "Hyderabad"])];
const failures = [];
const review = [];
for (const r of records) {
    const by = (kind) => FIELDS.filter((f) => r.source[f] === kind);
    // Generated fields: every rule, strictly.
    const gen = by("generated").length ? checkRecord(r, { strict: true, fields: by("generated") }).errors : [];
    // Hand-written fields are kept as they are: problems become review notes.
    const man = by("existing").length ? checkRecord(r, { strict: false, fields: by("existing") }) : { errors: [], review: [] };
    // Audit: a missing field is a failure.
    const miss = by("missing").map((f) => `${f} is empty`);
    if (gen.length || miss.length) failures.push({ slug: r.slug, listNo: r.listNo, errors: [...gen, ...miss] });
    if (by("existing").length) {
        const notes = [...man.errors, ...man.review];
        if (shared.has(r.slug) && !REPLACE_SHARED) notes.push(`text shared verbatim with other projects (${[...shared.get(r.slug)].join(", ")})`);
        notes.push(...placeMismatch(r, cities));
        if (notes.length) review.push({ slug: r.slug, listNo: r.listNo, title: r.title, notes });
    }
}

const dup = duplicates(records);
const dupGenerated = Object.fromEntries(
    Object.entries(dup).map(([f, groups]) => [f, groups.filter((slugs) => slugs.some((s) => records.find((r) => r.slug === s).source[f] === "generated"))])
);
for (const [f, groups] of Object.entries(dupGenerated)) for (const slugs of groups) failures.push({ slug: slugs.join(", "), errors: [`identical ${f}`] });

// ── report ────────────────────────────────────────────────────────────────

const complete = (r) => FIELDS.every((f) => filled(r, f));
const beforeComplete = existing.filter(complete).length;
const count = (groups) => groups.reduce((a, g) => a + g.length, 0);
const line = (k, v) => console.log(`${k.padEnd(40)} ${v}`);

console.log(`\nProject page text — dataset "${dataset}"${AUDIT ? " (audit only)" : APPLY ? " (APPLY)" : " (dry run)"}\n`);
line("Projects found", docs.length);
line("  with a page (published)", docs.filter((d) => d.status === "published").length);
line("Projects already complete", beforeComplete);
line("Projects requiring content", AUDIT ? docs.length - beforeComplete : plan.length);
if (!AUDIT) {
    line("Successfully generated", plan.length - new Set(failures.map((f) => f.slug)).size);
    line("Unique content records generated", plan.length);
    line("Fields generated", plan.reduce((a, p) => a + p.fields.length, 0));
}
line("Validation failures", failures.length);
for (const f of FIELDS) line(`Duplicate ${f} (${AUDIT ? "any" : "involving generated"})`, AUDIT ? `${dup[f].length} texts on ${count(dup[f])} projects` : dupGenerated[f].length);
line("Complete after this run", records.filter(complete).length + " / " + records.length);
line("Broken brand references", docs.filter((d) => !d.brandOk).length);
line("Missing main photo (published)", docs.filter((d) => d.status === "published" && !d.hero).length);
line("Missing metadata (city/state/format/sector)", docs.filter((d) => !d.city || !d.state || !d.subCategory || !d.sector).length);
line("Missing location text", docs.filter((d) => !d.location).length);
line("Open Studio drafts (skipped on apply)", [...draftIds].length);
// Near-duplicates among the text this run writes (the hand-written copies are
// reported above; pasted ones would always read 100%).
if (!AUDIT) {
    for (const [f, s] of Object.entries(used.stats)) {
        line(`${f}: differs from all others in 2+ sentences`, `${s.apart2} / ${s.apart2 + s.apart1}`);
    }
}
for (const f of ["overview", "challenge", "solution"]) {
    const pool = AUDIT ? records : records.filter((r) => r.source[f] === "generated");
    const s = mostSimilar(pool, f);
    line(`Most similar ${f} pair${AUDIT ? "" : " (generated)"}`, s.a ? `${(s.score * 100).toFixed(0)}% word overlap (${s.a} / ${s.b})` : "-");
}
if (failures.length) {
    console.log("\nVALIDATION FAILURES:");
    for (const f of failures.slice(0, 40)) console.log(`  #${f.listNo ?? ""} ${f.slug}: ${f.errors.join("; ")}`);
}
if (review.length) {
    console.log(`\nHand-written text kept as it is — listed for manual review (${review.length}):`);
    for (const r of review) console.log(`  #${r.listNo} ${r.title} (${r.slug}): ${r.notes.join("; ")}`);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outFile = path.join(OUT_DIR, `${dataset}-${AUDIT ? "audit" : APPLY ? "applied" : "plan"}-${stamp}.json`);
fs.writeFileSync(
    outFile,
    JSON.stringify({ dataset, mode: AUDIT ? "audit" : APPLY ? "apply" : "dry-run", replaceShared: REPLACE_SHARED, failures, review, records }, null, 2)
);
console.log(`\nFull text and report: ${outFile}`);

// ── apply ─────────────────────────────────────────────────────────────────

if (AUDIT) process.exit(failures.length ? 1 : 0);
if (!APPLY) {
    console.log("Dry run only — nothing was written. Re-run with --dataset <name> --apply to save it to Sanity.\n");
    process.exit(failures.length ? 1 : 0);
}
if (failures.length) fail("Not applied: fix the validation failures first.");

let written = 0;
const skipped = [];
const toWrite = plan.filter((p) => {
    if (draftIds.has(`drafts.${p.doc._id}`)) {
        skipped.push(`${p.doc.slug} (draft open in the Studio)`);
        return false;
    }
    return true;
});
for (let i = 0; i < toWrite.length; i += 20) {
    const tx = client.transaction();
    for (const { doc, fields } of toWrite.slice(i, i + 20)) {
        const rec = records.find((r) => r._id === doc._id);
        const set = {};
        for (const f of fields) set[f === "keyFeatures" ? "features" : f] = rec[f];
        tx.patch(doc._id, (p) => p.ifRevisionId(doc._rev).set(set));
    }
    await tx.commit({ visibility: "async" });
    written += Math.min(20, toWrite.length - i);
    process.stdout.write(`\rWritten ${written} / ${toWrite.length}`);
}
console.log(`\nApplied to "${dataset}": ${written} project(s).${skipped.length ? ` Skipped: ${skipped.join(", ")}` : ""}\n`);
