// npm run check-photos [-- --dataset staging]
//
// Which brands have photographs on the site, and which projects are still
// waiting for one — the "what to shoot next" list (owner, 2026-10-01).
//
// READ-ONLY, and needs NO token: it asks Sanity's public API for published
// documents only, exactly what the site itself reads. It never writes, and
// SANITY_WRITE_TOKEN is not read. Reads NEXT_PUBLIC_SANITY_PROJECT_ID and
// NEXT_PUBLIC_SANITY_DATASET from .env.local (names only are ever printed).
//
// THE RULE IS THE SITE'S (src/app/lib/content/brandImages.js): a project's
// photo is SHOWN when the project has a published page ("status":
// "published") and a main photo; a brand "has photos" when at least one of its
// projects' photos is shown. A brand with no photos AND no project page is
// noindex and left out of sitemap.xml. The query below mirrors PROJECT_ROWS in
// src/app/lib/content/queries.js — keep the two in step.

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "package.json"));
require("@next/env").loadEnvConfig(ROOT, false, { info() {}, error() {} });

const args = process.argv.slice(2);
const datasetArg = args.includes("--dataset") ? args[args.indexOf("--dataset") + 1] : null;
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = datasetArg || process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
if (!projectId) {
    console.error("NEXT_PUBLIC_SANITY_PROJECT_ID is not set (.env.local).");
    process.exit(1);
}

const client = require("@sanity/client").createClient({
    projectId,
    dataset,
    apiVersion: "2024-01-01",
    useCdn: false,
    perspective: "published",
});

// Same slug as /projects/brand/[slug] (brandSlug in src/app/lib/content/stats.js).
const brandSlug = (brand) =>
    (brand || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const rows = await client.fetch(`*[_type == "project" && defined(listNo)] | order(listNo desc, _createdAt desc) {
  _id, listNo, name, "brand": brand->name, city, status, "photo": heroImage.asset->url
}`);

const brands = new Map();
for (const r of rows) {
    const key = r.brand || "(no brand)";
    if (!brands.has(key)) brands.set(key, { shown: 0, hasPage: false, missing: [], total: 0 });
    const b = brands.get(key);
    b.total++;
    const page = r.status === "published";
    if (page) b.hasPage = true;
    if (page && r.photo) b.shown++;
    else b.missing.push(r);
}

const list = [...brands.entries()].sort((a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0]));
const withPhotos = list.filter(([, b]) => b.shown > 0);
const without = list.filter(([, b]) => b.shown === 0);
const noindex = without.filter(([, b]) => !b.hasPage);
const why = (r) => (r.status !== "published" ? (r.photo ? "photo uploaded, page not published" : "no photo, no page") : "page published, no photo");

console.log(`Sanity dataset "${dataset}" — ${rows.length} projects, ${list.length} brands (read-only)\n`);
console.log(`BRANDS WITH PHOTOS (${withPhotos.length}) — photographed projects / projects:`);
console.log("  " + withPhotos.map(([n, b]) => `${n} ${b.shown}/${b.total}`).join(", ") + "\n");

console.log(`BRANDS WITHOUT ANY PHOTO (${without.length}) — the site shows a placeholder:`);
for (const [n, b] of without) {
    console.log(`  ${n}  /projects/brand/${brandSlug(n)}${b.hasPage ? "" : "  [noindex, not in sitemap]"}`);
}

const shoot = list.flatMap(([n, b]) => b.missing.map((r) => ({ brand: n, ...r })));
console.log(`\nPROJECTS STILL WITHOUT A SHOWN PHOTO (${shoot.length}) — what to shoot next:`);
for (const r of shoot) console.log(`  #${r.listNo}  ${r.brand} — ${r.name}${r.city ? `, ${r.city}` : ""}  (${r._id}; ${why(r)})`);

console.log(`\nNOINDEX + LEFT OUT OF sitemap.xml (${noindex.length}): ${noindex.map(([n]) => n).join(", ") || "none"}`);
console.log("They return on their own once a photo is published.");
