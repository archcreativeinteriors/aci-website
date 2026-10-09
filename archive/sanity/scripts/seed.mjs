// Seed the Sanity dataset with the content the website shows TODAY.
//
//   npm run sanity:seed                   dry run — reads, never writes
//   npm run sanity:seed -- --apply        uploads the images and creates the documents
//   npm run sanity:seed -- --plan <file>  also writes the planned documents as NDJSON
//                                         (image fields carry `__file`, not an asset)
//
// ── what it copies ───────────────────────────────────────────────────────────
// Every document type the site has, from the very modules the site falls back
// to (src/app/lib/data/*.js), imported as-is — so Sanity starts out identical
// to what is live and nothing is retyped. Images are uploaded from public/.
//
//   siteSettings, homeHero, aboutPage, founder, teamMember, testimonial, faq,
//   blogPost, clientLogos
//   brand (66) and project (192) — built with import.js's OWN builders, so the
//     ids, slugs and brand references are exactly what the content-pack import
//     produces (it then MERGES into them; see mergeWrite() there). The 34
//     projects with a page on the site also get their copy and photograph and
//     status "published"; the owner chose (2026-09-25) to leave
//     clientDisplayConsent unticked until each client is confirmed, and their
//     photos are today's (partly trial-watermarked) ones, photoQuality "usable".
//   homeSelectedProjects — today's six, as references to those projects.
//
// ── it never overwrites ──────────────────────────────────────────────────────
// Every document has a fixed id (the singletons their type name, the rest
// `<type>-<slug>`). NEVER a dot in an id: Sanity treats a dotted id
// (`teamMember.x`) as PRIVATE — visible to the Studio, invisible to the site's
// unauthenticated reads, so the site would silently keep its local copy. That
// happened on the first run (2026-09-25) and was migrated. A document is only
// CREATED if neither it nor a draft of
// it exists. Anything an editor has already typed in the Studio is skipped and
// reported, never replaced — so running this twice is harmless. All creations
// go in ONE transaction: either every document is created or none is.
//
// ── credentials ──────────────────────────────────────────────────────────────
// Reads NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET and, for
// --apply only, SANITY_WRITE_TOKEN from .env.local (or the environment). It
// prints variable NAMES, never values.

import fs from "node:fs";
import path from "node:path";
import { createRequire, registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

// Two levels up: this file lives at sanity/scripts/.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const require = createRequire(path.join(ROOT, "package.json"));
const LIB_DIR = path.join(ROOT, "src", "app", "lib");
const DATA_DIR = path.join(LIB_DIR, "data");
const PUBLIC_DIR = path.join(ROOT, "public");
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;

const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const planIndex = argv.indexOf("--plan");
const PLAN_OUT = planIndex !== -1 ? argv[planIndex + 1] : null;

// Errors are thrown and reported once, at the bottom. The script never calls
// process.exit(): on Windows, exiting while the HTTP client's sockets are still
// closing aborts Node with a libuv assertion (seen on Node 24).
class SeedError extends Error {}
function fail(message) {
    throw new SeedError(message);
}

// ── env: the same files Next reads, without printing a value ───────────────
require("@next/env").loadEnvConfig(ROOT, false, { info() {}, error() {} });
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const TOKEN = process.env.SANITY_WRITE_TOKEN || "";

// ── load the site's own data modules ─────────────────────────────────────────
// They are ES modules that `import` images (Next turns those into objects). In
// plain Node an image import becomes { __file: <absolute path> } instead, which
// is all the seed needs to upload it. lib/projectStats.js is loaded too; like
// the site's code it imports without file extensions, which Next resolves and
// plain Node does not, so the resolve hook adds ".js".
registerHooks({
    resolve(specifier, context, nextResolve) {
        if (
            specifier.startsWith(".") &&
            !path.extname(specifier) &&
            context.parentURL?.startsWith(pathToFileURL(LIB_DIR).href)
        ) {
            const candidate = new URL(`${specifier}.js`, context.parentURL);
            if (fs.existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
        }
        return nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
        if (url.startsWith("file:") && IMAGE_EXT.test(url)) {
            return {
                format: "module",
                source: `export default ${JSON.stringify({ __file: fileURLToPath(url) })};`,
                shortCircuit: true,
            };
        }
        if (url.startsWith(pathToFileURL(LIB_DIR).href)) {
            return { ...nextLoad(url, { ...context, format: "module" }), format: "module" };
        }
        return nextLoad(url, context);
    },
});
const load = (name) => import(pathToFileURL(path.join(DATA_DIR, `${name}.js`)).href);

async function main() {
    if (planIndex !== -1 && !PLAN_OUT) fail("--plan needs a file path.");

    const [{ siteSettings }, { hero }, { about }, { founder, team }, { testimonials }, { faqs }, { blogs }, { clientLogoRows },
        { projects: detailProjects }, { selectedProjectsText }] =
        await Promise.all(
            ["siteSettings", "hero", "about", "team", "testimonials", "faqs", "blogs", "clientLogos",
                "projects", "selectedProjects"].map(load)
        );
    // The same six the home page picks today, by the site's own function.
    const { selectedProjects } = await import(pathToFileURL(path.join(LIB_DIR, "projectStats.js")).href);
    // The content-pack importer's builders — one source of ids and field mapping.
    const { loadSpine, buildBrandDocs, buildProjectDoc } = require(path.join(ROOT, "sanity", "scripts", "import.js"));

    // ── helpers ──────────────────────────────────────────────────────────────────
    const slugify = (s) =>
        String(s)
            .toLowerCase()
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/&/g, " and ")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 60);

    /** An image field, still pointing at a local file. `alt` only when the site has one. */
    function image(source, alt, key) {
        const file =
            typeof source === "string"
                ? path.join(PUBLIC_DIR, source.replace(/^\/+/, ""))
                : source && source.__file;
        if (!file) fail(`an image has no file (${JSON.stringify(source)}).`);
        return {
            ...(key ? { _key: key } : {}),
            _type: "image",
            __file: file,
            ...(alt ? { alt } : {}),
        };
    }

    const MONTHS = ["january", "february", "march", "april", "may", "june", "july",
        "august", "september", "october", "november", "december"];
    /** "June 12, 2026" -> "2026-06-12" — the inverse of formatDate() in contentSource.js. */
    function isoDate(text) {
        const m = String(text).trim().match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
        const month = m ? MONTHS.indexOf(m[1].toLowerCase()) : -1;
        if (month === -1) fail(`cannot read the blog date "${text}".`);
        return `${m[3]}-${String(month + 1).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
    }

    // ── the documents ────────────────────────────────────────────────────────────
    const docs = [];

    docs.push({
        _id: "siteSettings",
        _type: "siteSettings",
        email: siteSettings.email,
        phone: siteSettings.phone,
        callPhone: siteSettings.callPhone,
        whatsappPhone: siteSettings.whatsappPhone,
        spacesDelivered: siteSettings.spacesDelivered,
        cities: siteSettings.cities,
        states: siteSettings.states,
    });

    docs.push({
        _id: "homeHero",
        _type: "homeHero",
        eyebrow: hero.eyebrow,
        heading: hero.heading,
        // Keeps its {rolloutSpaces} / {rolloutStates} placeholders — the site fills them.
        paragraph: hero.paragraph,
        // Only slide 1 carries alt text on the site; the rest are decorative repeats.
        slides: hero.slides.map((s, i) => image(s.image, s.alt, `slide-${i + 1}`)),
        mobileImage: image(hero.mobileImage.image, hero.mobileImage.alt),
    });

    docs.push({
        _id: "aboutPage",
        _type: "aboutPage",
        heading: about.heading,
        image: image(about.image, about.imageAlt),
        sectionHeading: about.sectionHeading,
        // Keeps its {rollout…} placeholders — the site fills them.
        paragraphs: about.paragraphs,
    });

    // Founder / team photos get NO alt: blank means the site composes
    // "<name>, <designation>", which is what it shows today.
    docs.push({
        _id: "founder",
        _type: "founder",
        name: founder.name,
        designation: founder.designation,
        photo: image(founder.photo),
        bio: founder.bio,
        quote: founder.quote,
    });

    team.forEach((m, i) =>
        docs.push({
            _id: `teamMember-${slugify(m.name)}`,
            _type: "teamMember",
            name: m.name,
            designation: m.designation,
            photo: image(m.photo),
            order: i + 1,
        })
    );

    testimonials.forEach((t, i) =>
        docs.push({
            _id: `testimonial-${slugify(t.name)}`,
            _type: "testimonial",
            name: t.name,
            role: t.role,
            text: t.text,
            ...(t.rating ? { rating: t.rating } : {}),
            order: i + 1,
        })
    );

    faqs.forEach((f, i) =>
        docs.push({
            _id: `faq-${slugify(f.q)}`,
            _type: "faq",
            question: f.q,
            answer: f.a,
            order: i + 1,
        })
    );

    // Cover images get NO alt: blank means the site uses the post title, as today.
    blogs.forEach((b) =>
        docs.push({
            _id: `blogPost-${b.id}`,
            _type: "blogPost",
            title: b.title,
            slug: { _type: "slug", current: b.id },
            image: image(b.image),
            date: isoDate(b.date),
            ...(b.author ? { author: b.author } : {}),
            category: b.category,
            excerpt: b.excerpt,
            ...(b.metaDescription ? { metaDescription: b.metaDescription } : {}),
            ...(b.relatedService ? { relatedService: b.relatedService } : {}),
            content: b.content.map((s, i) => ({
                _key: `section-${i + 1}`,
                _type: "section",
                heading: s.heading,
                paragraphs: s.paragraphs,
            })),
        })
    );

    docs.push({
        _id: "clientLogos",
        _type: "clientLogos",
        rows: clientLogoRows.map((row, r) => ({
            _key: `row-${r + 1}`,
            _type: "clientLogoRow",
            logos: row.map((l, i) => ({
                _key: `row-${r + 1}-logo-${i + 1}`,
                _type: "clientLogo",
                name: l.name,
                image: image(l.src),
                wide: Boolean(l.wide),
            })),
        })),
    });

    // ── brands, projects, selected projects ──────────────────────────────────────
    // ORDER MATTERS inside the one transaction: projects hold a reference to
    // their brand, and the home selection to its projects, so each document is
    // created after the ones it points at.
    const strip = (doc) => {
        const { _assets, _consentGiven, ...rest } = doc;
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
    };
    const spine = loadSpine();

    for (const brand of buildBrandDocs(spine, new Map()).docs) docs.push(strip(brand));

    const detailById = new Map(detailProjects.map((p) => [p.id, p]));
    const text = (s) => (typeof s === "string" && s.trim() ? s.trim() : undefined);
    for (const row of [...spine.values()].sort((a, b) => b.listNo - a.listNo)) {
        // Exactly what the content-pack import would create for an empty folder…
        const doc = buildProjectDoc({ row, details: null, hero: null, gallery: [], before: [], dir: "" });
        // …plus, for the 34 with a page on the site, that page's copy and photo.
        if (row.detailSlug) {
            const rich = detailById.get(row.detailSlug);
            if (!rich) fail(`list row #${row.listNo} points at "${row.detailSlug}", which data/projects.js does not have.`);
            const copy = {
                overview: text(rich.desc),
                challenge: text(rich.challenge),
                solution: text(rich.solution),
                features: Array.isArray(rich.features) && rich.features.length ? rich.features : undefined,
            };
            Object.assign(doc, copy, {
                // No alt: every card and page uses the project name.
                heroImage: rich.image ? image(rich.image) : undefined,
                photoQuality: rich.image ? "usable" : "none",
                storyStrength: Object.values(copy).some(Boolean) ? "adequate" : "thin",
                // Live on the site today, so published — but consent is NOT
                // recorded until the owner confirms each client (2026-09-25).
                status: "published",
                clientDisplayConsent: false,
            });
        }
        docs.push(strip(doc));
    }

    docs.push({
        _id: "homeSelectedProjects",
        _type: "homeSelectedProjects",
        ...selectedProjectsText,
        projects: selectedProjects(6).map((row) => ({
            _key: `project-${row.listNo}`,
            _type: "reference",
            _ref: `project-${row.listNo}`,
        })),
    });

    // ── sanity checks on the plan itself ─────────────────────────────────────────
    const ids = docs.map((d) => d._id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length) fail(`two documents would share an id: ${[...new Set(dupes)].join(", ")}.`);

    /** Every image placeholder in a document, wherever it sits. */
    function imagesIn(value, found = []) {
        if (Array.isArray(value)) value.forEach((v) => imagesIn(v, found));
        else if (value && typeof value === "object") {
            if (value.__file) found.push(value);
            else Object.values(value).forEach((v) => imagesIn(v, found));
        }
        return found;
    }
    const files = [...new Set(docs.flatMap((d) => imagesIn(d).map((i) => i.__file)))];
    const missing = files.filter((f) => !fs.existsSync(f));
    if (missing.length) fail(`image file(s) not found:\n  ${missing.join("\n  ")}`);
    const bytes = files.reduce((n, f) => n + fs.statSync(f).size, 0);

    if (PLAN_OUT) {
        fs.writeFileSync(PLAN_OUT, docs.map((d) => JSON.stringify(d)).join("\n") + "\n");
    }

    // ── report ───────────────────────────────────────────────────────────────────
    const byType = docs.reduce((m, d) => ({ ...m, [d._type]: (m[d._type] || 0) + 1 }), {});
    console.log(`\nSanity seed — ${APPLY ? "APPLY" : "dry run (nothing is written)"}`);
    console.log(`  project id  : ${PROJECT_ID ? "set" : "NOT SET (NEXT_PUBLIC_SANITY_PROJECT_ID)"}`);
    console.log(`  dataset     : ${DATASET}`);
    console.log(`  write token : ${TOKEN ? "set" : "not set (SANITY_WRITE_TOKEN)"}`);
    console.log(`\ndocuments planned: ${docs.length}`);
    for (const [type, n] of Object.entries(byType)) console.log(`  ${type.padEnd(14)} ${n}`);
    console.log(`images to upload : ${files.length} files, ${(bytes / 1024 / 1024).toFixed(1)} MB`);
    if (PLAN_OUT) console.log(`plan written     : ${PLAN_OUT}`);

    if (!PROJECT_ID) {
        if (APPLY) fail("--apply needs NEXT_PUBLIC_SANITY_PROJECT_ID in .env.local.");
        console.log("\n(no project id, so existing documents were not checked)\n");
        return;
    }

    const { createClient } = require("@sanity/client");
    const client = createClient({
        projectId: PROJECT_ID,
        dataset: DATASET,
        apiVersion: "2024-01-01",
        useCdn: false,
        ...(TOKEN ? { token: TOKEN } : {}),
        // raw: with a token this also returns drafts, so an editor's unpublished
        // work counts as "already there". Without a token only published is visible.
        perspective: "raw",
    });

    const existing = new Set(
        await client.fetch(`*[_id in $ids]._id`, { ids: [...ids, ...ids.map((id) => `drafts.${id}`)] })
    );
    const skip = docs.filter((d) => existing.has(d._id) || existing.has(`drafts.${d._id}`));
    const create = docs.filter((d) => !skip.includes(d));
    console.log(`\nalready in Sanity (left untouched): ${skip.length}`);
    for (const d of skip) console.log(`  - ${d._id}`);
    console.log(`would be created                  : ${create.length}`);
    if (!TOKEN) console.log("  (without a token only PUBLISHED documents are visible to this check)");

    if (!APPLY) {
        console.log("\nDry run only. Re-run with --apply to write.\n");
        return;
    }
    if (!TOKEN) fail("--apply needs SANITY_WRITE_TOKEN in .env.local (an Editor token).");
    if (create.length === 0) {
        console.log("\nNothing to create.\n");
        return;
    }

    // ── apply ────────────────────────────────────────────────────────────────────
    // Upload each file once (Sanity also de-duplicates identical files itself),
    // then swap every placeholder for a reference to its asset.
    const neededFiles = [...new Set(create.flatMap((d) => imagesIn(d).map((i) => i.__file)))];
    const assetFor = new Map();
    console.log(`\nuploading ${neededFiles.length} images…`);
    for (const [n, file] of neededFiles.entries()) {
        const asset = await client.assets.upload("image", fs.createReadStream(file), {
            filename: path.basename(file),
        });
        assetFor.set(file, asset._id);
        if ((n + 1) % 20 === 0 || n + 1 === neededFiles.length) console.log(`  ${n + 1}/${neededFiles.length}`);
    }

    const withAssets = (value) => {
        if (Array.isArray(value)) return value.map(withAssets);
        if (value && typeof value === "object") {
            if (value.__file) {
                const { __file, ...rest } = value;
                return { ...rest, asset: { _type: "reference", _ref: assetFor.get(__file) } };
            }
            return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, withAssets(v)]));
        }
        return value;
    };

    const tx = client.transaction();
    for (const d of create) tx.createIfNotExists(withAssets(d));
    await tx.commit();
    console.log(`\nDone: ${create.length} documents created, ${skip.length} left untouched.`);
    console.log("Rebuild the site (npm run build) for it to serve this content.\n");
}

try {
    await main();
} catch (e) {
    if (!(e instanceof SeedError)) throw e;
    console.error(`
seed: ${e.message}
`);
    process.exitCode = 1;
}
