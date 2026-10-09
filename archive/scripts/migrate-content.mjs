// Moves the content that is still only in the code into Sanity — Phase 5 of
// the "all content into Sanity" migration (owner-approved plan, 2026-09-28).
//
//   node scripts/migrate-content.mjs --type <type>                  dry run on STAGING
//   node scripts/migrate-content.mjs --type <type> --apply          write to staging
//   node scripts/migrate-content.mjs --type <type> --dataset production --limit 1 --apply
//
// Types, in the approved order:
//   siteSettings         MERGE address / hours / maps / social links (lib/site.js BUSINESS)
//   service              CREATE service-<slug> x3, photos uploaded (lib/data/services.js)
//   costingPage          CREATE the singleton (text of the built /costing page)
//   legalPage            CREATE legalPage-privacy-policy, legalPage-terms (built pages)
//   aboutPage            MERGE processStages (STAGES in app/about/page.js)
//   homePage             CREATE the singleton: What-we-do cards (components/home/WhatWeDo.jsx)
//   projectPageLocation  MERGE pageLocation on the 34 project pages (lib/data/projects.js)
//
// SAFETY
//   * Dry run unless --apply; STAGING unless --dataset production.
//   * CREATE = createIfNotExists: a document that exists is skipped, never replaced.
//     MERGE = setIfMissing on the published document, guarded by its revision:
//     a field that already has a value is never overwritten, and a document edited
//     in the Studio since it was read makes the whole transaction fail untouched.
//     createOrReplace is never used.
//   * A document with an unpublished Studio draft is skipped and reported.
//   * Every planned document is validated against the Studio schema
//     (`sanity documents validate --file`) before anything is written; any
//     error stops the run.
//   * One transaction per run: all of it is written or none of it.
//   * Images: a file already in the dataset (same sha1) is reused, not uploaded.
//   * Every result is appended to C:\Backups\arch-sanity\migration.log.
//
// The legal and costing texts are read from the site's own BUILT pages (the
// newest of .next-a / .next-b / .next), so they are exactly what visitors see;
// the contact details in them become {email} {phone} {address} {siteName}.
//
// Reads NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN from .env.local;
// prints variable NAMES, never values.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire, registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIB = path.join(ROOT, "src", "app", "lib");
const require = createRequire(path.join(ROOT, "package.json"));
const { parse } = require("node-html-parser");

const argv = process.argv.slice(2);
const opt = (n) => {
    const i = argv.indexOf(n);
    return i !== -1 ? argv[i + 1] : undefined;
};
const APPLY = argv.includes("--apply");
const TYPE = opt("--type");
const DATASET = opt("--dataset") || "staging";
const LIMIT = opt("--limit") ? Number(opt("--limit")) : Infinity;
const LOG = "C:/Backups/arch-sanity/migration.log";

class MigrationError extends Error {}
const fail = (m) => {
    throw new MigrationError(m);
};

require("@next/env").loadEnvConfig(ROOT, false, { info() {}, error() {} });
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
const TOKEN = process.env.SANITY_WRITE_TOKEN || "";

// The site's data modules import images; in plain Node those become { __file }.
registerHooks({
    resolve(s, c, n) {
        if (s.startsWith(".") && !path.extname(s) && c.parentURL?.startsWith(pathToFileURL(LIB).href)) {
            const u = new URL(`${s}.js`, c.parentURL);
            if (fs.existsSync(fileURLToPath(u))) return { url: u.href, shortCircuit: true };
        }
        return n(s, c);
    },
    load(u, c, n) {
        if (u.startsWith("file:") && /\.(jpe?g|png|webp|avif)$/i.test(u))
            return { format: "module", source: `export default ${JSON.stringify({ __file: fileURLToPath(u) })};`, shortCircuit: true };
        if (u.startsWith(pathToFileURL(LIB).href)) return { ...n(u, { ...c, format: "module" }), format: "module" };
        return n(u, c);
    },
});
const lib = (p) => import(pathToFileURL(path.join(LIB, p)).href);

// ── helpers ──────────────────────────────────────────────────────────────────
const key = () => crypto.randomBytes(6).toString("hex");
const sha1 = (file) => crypto.createHash("sha1").update(fs.readFileSync(file)).digest("hex");
const clean = (s) => s.replace(/\s+/g, " ").trim();

/** The literal array assigned to `const NAME = [...]` in a source file (plain strings only). */
function literalArray(file, name) {
    const src = fs.readFileSync(path.join(ROOT, file), "utf8");
    const m = src.match(new RegExp(`const ${name} = (\\[[\\s\\S]*?\\n\\]);`));
    if (!m) fail(`${name} not found in ${file}`);
    return Function(`"use strict"; return (${m[1]});`)();
}

function builtPage(route) {
    const dirs = [".next-a", ".next-b", ".next"]
        .map((d) => path.join(ROOT, d))
        .filter((d) => fs.existsSync(path.join(d, "BUILD_ID")) && fs.existsSync(path.join(d, "server", "app", `${route}.html`)))
        .sort((a, b) => fs.statSync(path.join(b, "BUILD_ID")).mtimeMs - fs.statSync(path.join(a, "BUILD_ID")).mtimeMs);
    if (!dirs.length) fail(`no build contains /${route} — run npm run build first`);
    return { root: parse(fs.readFileSync(path.join(dirs[0], "server", "app", `${route}.html`), "utf8")), from: path.basename(dirs[0]) };
}

// ── what each type plans ─────────────────────────────────────────────────────
// Each returns [{ id, action: "create" | "merge", doc | fields, images? }].

const PLANNERS = {
    async siteSettings() {
        const { BUSINESS } = await lib("site.js");
        const a = BUSINESS.address;
        if (a.addressCountry !== "IN") fail("BUSINESS.address is not in India — the schema has no country field");
        return [{
            id: "siteSettings",
            action: "merge",
            fields: {
                address: { streetAddress: a.streetAddress, locality: a.addressLocality, region: a.addressRegion, postalCode: a.postalCode },
                shortAddress: BUSINESS.shortAddress,
                mapsUrl: BUSINESS.mapsUrl,
                mapsEmbedUrl: BUSINESS.mapsEmbedUrl,
                geo: { lat: BUSINESS.geo.latitude, lng: BUSINESS.geo.longitude },
                openingDays: BUSINESS.openingHours.days,
                opens: BUSINESS.openingHours.opens,
                closes: BUSINESS.openingHours.closes,
                socialLinks: BUSINESS.sameAs,
                areaServed: BUSINESS.areaServed,
                priceRange: BUSINESS.priceRange,
            },
        }];
    },

    async service() {
        const { services } = await lib("data/services.js");
        return services.map((s, i) => ({
            id: `service-${s.slug}`,
            action: "create",
            images: { image: s.image.__file },
            doc: {
                _id: `service-${s.slug}`,
                _type: "service",
                title: s.title,
                slug: { _type: "slug", current: s.slug },
                icon: s.icon,
                tagline: s.tagline,
                label: s.label,
                image: { _type: "image", __file: s.image.__file },
                description: s.description,
                features: s.features,
                process: s.process,
                order: i + 1,
            },
        }));
    },

    async costingPage() {
        const { root, from } = builtPage("costing");
        const page = root.querySelector(".costing-page");
        const hero = page.querySelector(".costing-hero");
        const price = page.querySelector(".costing-price");
        const h1 = hero.querySelector("h1").innerHTML.split(/<br\s*\/?>/i).map((t) => clean(parse(t).text));
        console.log(`  (text read from ${from}/server/app/costing.html)`);
        return [{
            id: "costingPage",
            action: "create",
            doc: {
                _id: "costingPage",
                _type: "costingPage",
                eyebrow: clean(hero.querySelector("span").text),
                heading: h1.join("\n"),
                intro: clean(hero.querySelector("p").text),
                price: clean(price.querySelector("h2").text),
                unit: clean(price.querySelector("span").text),
                note: clean(price.querySelector("p").text),
                includesHeading: clean(page.querySelector(".costing-includes h3").text),
                includes: page.querySelectorAll(".include-item p").map((p) => clean(p.text)),
            },
        }];
    },

    async legalPage() {
        const { SITE_NAME, BUSINESS } = await lib("site.js");
        const { getSiteSettings } = await lib("contentSource.js");
        const { contact } = await getSiteSettings();
        const a = BUSINESS.address;
        // Longest first, so the address is replaced before any part of it.
        const tokens = [
            [`${a.streetAddress}, ${a.addressLocality}, ${a.addressRegion} ${a.postalCode}`, "{address}"],
            [contact.email, "{email}"],
            [contact.telephoneDisplay, "{phone}"],
            [SITE_NAME, "{siteName}"],
        ];
        const tokenize = (t) => tokens.reduce((s, [value, token]) => s.split(value).join(token), t);

        const spans = (el) => {
            const out = [];
            const walk = (node, marks) => {
                if (node.nodeType === 3) {
                    const text = node.text.replace(/\s+/g, " ");
                    if (text) out.push({ _type: "span", _key: key(), text, marks });
                } else if (node.nodeType === 1) {
                    const tag = node.rawTagName.toLowerCase();
                    const m = tag === "strong" || tag === "b" ? [...marks, "strong"] : tag === "em" || tag === "i" ? [...marks, "em"] : marks;
                    if (!["strong", "b", "em", "i", "span"].includes(tag)) fail(`unexpected <${tag}> inside a legal paragraph`);
                    node.childNodes.forEach((c) => walk(c, m));
                }
            };
            el.childNodes.forEach((c) => walk(c, []));
            if (out.length) {
                out[0].text = out[0].text.replace(/^ /, "");
                out[out.length - 1].text = out[out.length - 1].text.replace(/ $/, "");
            }
            // Merge neighbours with the same marks, then put the tokens in.
            const merged = [];
            for (const s of out) {
                const last = merged[merged.length - 1];
                if (last && last.marks.join() === s.marks.join()) last.text += s.text;
                else merged.push({ ...s });
            }
            return merged.filter((s) => s.text).map((s) => ({ ...s, text: tokenize(s.text) }));
        };
        const block = (el, style, list) => ({
            _type: "block",
            _key: key(),
            style,
            markDefs: [],
            children: spans(el),
            ...(list ? { listItem: "bullet", level: 1 } : {}),
        });

        return ["privacy-policy", "terms"].map((slug) => {
            const { root, from } = builtPage(slug);
            const inner = root.querySelector(".legal-page-inner");
            const body = [];
            let title = null;
            let lastUpdated = null;
            for (const el of inner.childNodes.filter((n) => n.nodeType === 1)) {
                const tag = el.rawTagName.toLowerCase();
                if (tag === "h1") title = clean(el.text);
                else if (tag === "p" && el.classList.contains("legal-updated")) lastUpdated = clean(el.text).replace(/^Last updated:\s*/, "");
                else if (tag === "p") body.push(block(el, "normal"));
                else if (tag === "h2") body.push(block(el, "h2"));
                else if (tag === "ul") el.querySelectorAll("li").forEach((li) => body.push(block(li, "normal", true)));
                else fail(`unexpected <${tag}> in /${slug}`);
            }
            console.log(`  (text read from ${from}/server/app/${slug}.html: ${body.length} blocks)`);
            return {
                id: `legalPage-${slug}`,
                action: "create",
                doc: { _id: `legalPage-${slug}`, _type: "legalPage", title, slug: { _type: "slug", current: slug }, lastUpdated, body },
            };
        });
    },

    async aboutPage() {
        const stages = literalArray("src/app/about/page.js", "STAGES");
        return [{
            id: "aboutPage",
            action: "merge",
            fields: { processStages: stages.map(([label, title, text]) => ({ _type: "processStage", _key: key(), label, title, text })) },
        }];
    },

    async homePage() {
        const cards = literalArray("src/app/components/home/WhatWeDo.jsx", "CARDS");
        return [{
            id: "homePage",
            action: "create",
            doc: {
                _id: "homePage",
                _type: "homePage",
                whatWeDo: cards.map((c) => ({ _type: "whatWeDoCard", _key: key(), title: c.title, body: c.body, sector: c.sector, href: c.href })),
            },
        }];
    },

    async projectPageLocation(client) {
        const { projects } = await lib("data/projects.js");
        const docs = await client.fetch(`*[_type == "project" && !(_id in path("drafts.**")) && slug.current in $s]{_id, "slug": slug.current}`, {
            s: projects.map((p) => p.id),
        });
        return projects.map((p) => {
            const d = docs.filter((x) => x.slug === p.id);
            if (d.length !== 1) fail(`${d.length} project documents have the slug "${p.id}" (expected 1)`);
            return { id: d[0]._id, action: "merge", fields: { pageLocation: p.location.trim() } };
        });
    },
};

// ── validation: the Studio's own rules, via the CLI ─────────────────────────
function validate(docs, pendingImages) {
    if (!docs.length) return [];
    const file = path.join(os.tmpdir(), `migrate-${process.pid}.ndjson`);
    fs.writeFileSync(file, docs.map((d) => JSON.stringify(d)).join("\n") + "\n");
    const r = spawnSync(
        process.execPath,
        [path.join(ROOT, "node_modules/sanity/bin/sanity"), "documents", "validate", "--file", file, "-d", DATASET, "--format", "ndjson", "--level", "error", "-y"],
        { cwd: ROOT, encoding: "utf8", env: { ...process.env, SANITY_AUTH_TOKEN: TOKEN } }
    );
    fs.rmSync(file, { force: true });
    const markers = (r.stdout || "")
        .split("\n")
        .filter((l) => l.startsWith("{"))
        .map((l) => JSON.parse(l))
        .flatMap((d) => (d.markers || []).map((m) => ({ id: d.documentId, path: (m.path || []).join("."), message: m.message, level: m.level })))
        .filter((m) => m.level === "error");
    if (r.status !== 0 && !markers.length) fail(`validation could not run:\n${(r.stderr || r.stdout).slice(-800)}`);
    // In a dry run, photos not uploaded yet point at stand-in assets; those
    // reference errors are expected and reported separately.
    return markers.filter((m) => !(pendingImages.has(m.id) && /asset/.test(m.path)));
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
    if (!PLANNERS[TYPE]) fail(`--type must be one of: ${Object.keys(PLANNERS).join(", ")}`);
    if (!["staging", "production"].includes(DATASET)) fail("--dataset must be staging or production");
    if (!PROJECT_ID || !TOKEN) fail("NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN must be set in .env.local");
    const client = require("@sanity/client").createClient({
        projectId: PROJECT_ID, dataset: DATASET, apiVersion: "2024-01-01", useCdn: false, token: TOKEN, perspective: "raw",
    });

    console.log(`\nmigrate ${TYPE} -> ${DATASET} — ${APPLY ? "APPLY" : "dry run (nothing is written)"}${LIMIT < Infinity ? `, first ${LIMIT} only` : ""}`);
    const plan = (await PLANNERS[TYPE](client)).slice(0, LIMIT);

    // What is already there.
    const ids = plan.map((p) => p.id);
    const existing = new Map((await client.fetch(`*[_id in $ids]`, { ids: [...ids, ...ids.map((i) => `drafts.${i}`)] })).map((d) => [d._id, d]));

    const ops = [];
    for (const p of plan) {
        const current = existing.get(p.id);
        if (existing.has(`drafts.${p.id}`)) ops.push({ ...p, result: "skip", why: "has an unpublished Studio draft" });
        else if (p.action === "create" && current) ops.push({ ...p, result: "skip", why: "already exists" });
        else if (p.action === "create") ops.push({ ...p, result: "create", after: p.doc });
        else if (!current) fail(`${p.id} does not exist — nothing to merge into`);
        else {
            const missing = Object.fromEntries(Object.entries(p.fields).filter(([k]) => current[k] === undefined || current[k] === null || current[k] === ""));
            const kept = Object.keys(p.fields).filter((k) => !(k in missing));
            if (!Object.keys(missing).length) ops.push({ ...p, result: "skip", why: `already filled: ${kept.join(", ")}` });
            else ops.push({ ...p, result: "merge", fields: missing, kept, rev: current._rev, after: { ...current, ...missing } });
        }
    }

    // Images: reuse a file the dataset already has; otherwise upload (apply only).
    const pendingImages = new Set();
    for (const op of ops.filter((o) => o.result === "create" && o.images)) {
        for (const [field, file] of Object.entries(op.images)) {
            const hash = sha1(file);
            let assetId = await client.fetch(`*[_type == "sanity.imageAsset" && sha1hash == $h][0]._id`, { h: hash });
            op.imageNotes = [...(op.imageNotes || []), `${path.basename(file)}: ${assetId ? "already in Sanity, reused" : APPLY ? "uploaded" : "will be uploaded"}`];
            if (!assetId && APPLY) assetId = (await client.assets.upload("image", fs.createReadStream(file), { filename: path.basename(file) }))._id;
            if (!assetId) {
                pendingImages.add(op.id);
                assetId = `image-${hash}-1x1-jpg`; // stand-in for the dry run's validation only
            }
            const { __file, ...rest } = op.doc[field];
            op.doc[field] = { ...rest, asset: { _type: "reference", _ref: assetId } };
            op.after = op.doc;
        }
    }

    for (const op of ops) {
        const detail =
            op.result === "skip" ? op.why
            : op.result === "merge" ? `fill ${Object.keys(op.fields).join(", ")}${op.kept.length ? ` (keep ${op.kept.join(", ")})` : ""}`
            : `new document${op.imageNotes ? `; ${op.imageNotes.join("; ")}` : ""}`;
        console.log(`  ${op.result.padEnd(6)} ${op.id.padEnd(28)} ${detail}`);
    }

    const writes = ops.filter((o) => o.result !== "skip");
    const errors = validate(writes.map((o) => o.after), pendingImages);
    if (errors.length) {
        errors.forEach((e) => console.log(`  ! ${e.id} ${e.path}: ${e.message}`));
        fail(`${errors.length} validation error(s) — nothing was written`);
    }
    console.log(`\nschema validation: ${writes.length} document(s), 0 errors${pendingImages.size ? " (photos still to upload are checked on --apply)" : ""}`);
    console.log(`summary: create ${ops.filter((o) => o.result === "create").length}, merge ${ops.filter((o) => o.result === "merge").length}, skip ${ops.filter((o) => o.result === "skip").length}`);

    if (!APPLY) {
        console.log("\nDry run only. Re-run with --apply to write.\n");
        return;
    }
    if (!writes.length) {
        console.log("\nNothing to write.\n");
        return;
    }

    const tx = client.transaction();
    for (const op of writes) {
        if (op.result === "create") tx.createIfNotExists(op.doc);
        else tx.patch(op.id, (p) => p.ifRevisionId(op.rev).setIfMissing(op.fields));
    }
    const log = (entry) => fs.appendFileSync(LOG, JSON.stringify({ at: new Date().toISOString(), dataset: DATASET, type: TYPE, ...entry }) + "\n");
    try {
        const res = await tx.commit({ visibility: "sync" });
        for (const op of ops) log({ id: op.id, result: op.result, ...(op.why ? { why: op.why } : {}), transaction: op.result === "skip" ? undefined : res.transactionId });
        console.log(`\nwritten: transaction ${res.transactionId}, ${res.results.length} document(s). Logged to ${LOG}\n`);
    } catch (e) {
        log({ result: "FAILED", error: e.message });
        fail(`the transaction was refused — nothing was written: ${e.message}`);
    }
}

try {
    await main();
} catch (e) {
    if (!(e instanceof MigrationError)) throw e;
    console.error(`\nmigrate: ${e.message}\n`);
    process.exitCode = 1;
}
