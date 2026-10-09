#!/usr/bin/env node
/**
 * sanity-import — upload the content pack (`sanity-import/`) into Sanity.
 *
 *   node sanity/scripts/import.js --dir ../sanity-import            # dry run
 *   node sanity/scripts/import.js --dir ../sanity-import --apply    # for real
 *
 * DRY RUN IS THE DEFAULT and needs no credentials and no network: it walks the
 * folder, joins it to the project spine, validates every field and prints the
 * exact plan. Run it before every real import; it is the only place a bad
 * folder name or a missing CONSENT line is cheap to find.
 *
 * ── the join ────────────────────────────────────────────────────────────────
 * `sanity-import/projects/080-geetanjali-salon-.../` joins on the NUMBER
 * PREFIX, not the name: 080 -> listNo 80 -> the row in
 * src/app/lib/data/projectsData.js. That array stays the spine even after the
 * migration, because it is the owner's own 192-row list and carries the
 * ordering (`listNo` descending) the index depends on. A folder whose prefix
 * matches no row is an error, never a new project — the pack tells the owner
 * not to rename folders, and this is why.
 *
 * Document ids are DETERMINISTIC (`project-<listNo>`, `brand-<slug>`) so the
 * import is idempotent: re-running it after a second batch of photographs
 * updates the same documents rather than creating duplicates. That is the
 * pack's "each batch is one re-import" promise, and it only holds because the
 * ids are derived rather than generated.
 *
 * A HYPHEN, never a dot: Sanity treats a dotted id (`project.80`) as private —
 * the Studio sees it, the site's unauthenticated reads do not, so every project
 * would have silently stayed on local data. The ids were dotted until
 * 2026-09-25 (fixed before this script was ever run with --apply).
 *
 * ── what it does NOT do ─────────────────────────────────────────────────────
 * It imports `brand` and `project` documents only. `siteSettings`, `homeHero`,
 * `homeSelectedProjects`, `clientLogos`, `aboutPage`, `founder`, `teamMember`,
 * `testimonial`, `faq` and `blogPost` have schemas too, but are entered
 * directly in the Studio (the Content menu) — a handful of records each, no
 * folder format — so the pack's hero/, about/, founder/, team/, blog/, clients/,
 * testimonials.csv, faq.txt, site-settings.txt and clients.csv are reported
 * and skipped. services/ has no schema yet, so this REPORTS it and skips it
 * rather than inventing a document type. Add the schema first, then extend
 * this script.
 */

const fs = require("fs");
const path = require("path");

// Repo root. TWO levels up, because this file lives at sanity/scripts/ —
// it was scripts/ until 2026-09-23. Nothing in the build touches these
// scripts, so a wrong ROOT here fails only at `npm run sanity:*`, never at
// `npm run build`. Re-derive it if this file ever moves again.
const ROOT = path.resolve(__dirname, "..", "..");
const sharp = require(path.join(ROOT, "node_modules", "sharp"));

// ── args ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, d) => {
    const i = argv.indexOf(n);
    return i !== -1 && argv[i + 1] ? argv[i + 1] : d;
};

const APPLY = flag("--apply");
const IMPORT_DIR = path.resolve(opt("--dir", path.join(ROOT, "..", "sanity-import")));
const LIMIT = Number(opt("--limit", "0")) || 0;
const SKIP_WATERMARK = flag("--no-watermark");

// ── config ──────────────────────────────────────────────────────────────────
const PROJECT_ID = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
const DATASET = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const TOKEN = process.env.SANITY_WRITE_TOKEN || "";

// Longest-side cap for uploaded photographs. Sanity serves derivatives from the
// CDN, so this is about upload time and stored bytes, not delivered bytes —
// the same reasoning as the 2560 cap in optimize-images.js.
const MAX_EDGE = 2560;
const WATERMARK = path.join(ROOT, "public", "aci-logo.png");
const WATERMARK_WIDTH_PCT = 0.2; // of the photo's width
const WATERMARK_MARGIN_PCT = 0.03;

const IMAGE_RE = /\.(jpe?g|png)$/i;
const HERO_RE = /^hero\.(jpe?g|png)$/i;
const GALLERY_RE = /^\d{2,}\.(jpe?g|png)$/i;
const BEFORE_RE = /^before-\d{2,}\.(jpe?g|png)$/i;

// ── the spine ───────────────────────────────────────────────────────────────
function loadSpine() {
    const src = fs.readFileSync(path.join(ROOT, "src/app/lib/data/projectsData.js"), "utf8");
    const rows = JSON.parse(src.slice(src.indexOf("["), src.lastIndexOf("]") + 1));
    return new Map(rows.map((r) => [r.listNo, r]));
}

/**
 * Mirrors brandSlug() in src/app/lib/projectStats.js. The two MUST agree — the
 * slug is what /projects/brand/<slug> is built from, so a drift here silently
 * changes 7 live URLs.
 */
function brandSlug(brand) {
    return (brand || "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

// ── details.txt ─────────────────────────────────────────────────────────────
const SINGLE = ["SCOPE", "CONSENT", "CREDITS"];
const BLOCK = ["OVERVIEW", "CHALLENGE", "SOLUTION", "TESTIMONIAL"];

/**
 * Parses the pack's template. A label is `KEY:` at the start of a line; a block
 * key runs until the next known label. FEATURES is a `- ` list.
 *
 * Unknown ALL-CAPS labels are collected and reported rather than dropped: a
 * typo'd label otherwise looks exactly like a field the owner forgot to fill.
 */
function parseDetails(text) {
    const out = { features: [], unknown: [] };
    const known = new Set([...SINGLE, ...BLOCK, "FEATURES"]);
    let current = null;
    let buf = [];

    const flush = () => {
        if (!current) return;
        const v = buf.join("\n").trim();
        if (current === "FEATURES") {
            out.features = v
                .split(/\r?\n/)
                .map((l) => l.replace(/^[-*]\s*/, "").trim())
                .filter(Boolean);
        } else if (v) {
            out[current] = v;
        }
        buf = [];
    };

    for (const line of text.split(/\r?\n/)) {
        const m = line.match(/^([A-Z_]{3,})\s*:\s*(.*)$/);
        if (m && known.has(m[1])) {
            flush();
            current = m[1];
            buf = m[2] ? [m[2]] : [];
        } else if (m && !known.has(m[1])) {
            out.unknown.push(m[1]);
        } else if (current) {
            buf.push(line);
        }
    }
    flush();
    return out;
}

const yes = (v) => /^y(es)?$/i.test(String(v || "").trim());

// ── image prep ──────────────────────────────────────────────────────────────
let watermarkCache = null;
async function watermarkFor(width) {
    const w = Math.max(80, Math.round(width * WATERMARK_WIDTH_PCT));
    if (watermarkCache && watermarkCache.w === w) return watermarkCache.buf;
    const buf = await sharp(WATERMARK).resize({ width: w }).png().toBuffer();
    watermarkCache = { w, buf };
    return buf;
}

/**
 * Downscale to MAX_EDGE and composite the ACI mark bottom-right.
 *
 * The pack tells the owner NOT to watermark by hand. 21 of the 34 photographs
 * on the site today carry a third-party "trial version" banner precisely
 * because that was done by hand in a trial app. Applying the mark here means
 * every photo gets an identical one and no banner can creep back in.
 * `--no-watermark` exists for re-importing files that already carry it.
 */
async function prepareImage(file) {
    let img = sharp(file).rotate();
    const meta = await img.metadata();
    if (Math.max(meta.width, meta.height) > MAX_EDGE) {
        img = img.resize(meta.width >= meta.height ? { width: MAX_EDGE } : { height: MAX_EDGE });
    }
    let buf = await img.jpeg({ quality: 82, mozjpeg: true }).toBuffer();

    if (!SKIP_WATERMARK && fs.existsSync(WATERMARK)) {
        const m = await sharp(buf).metadata();
        const mark = await watermarkFor(m.width);
        const mm = await sharp(mark).metadata();
        const pad = Math.round(m.width * WATERMARK_MARGIN_PCT);
        buf = await sharp(buf)
            .composite([
                { input: mark, left: m.width - mm.width - pad, top: m.height - mm.height - pad },
            ])
            .jpeg({ quality: 82, mozjpeg: true })
            .toBuffer();
    }
    return buf;
}

// ── scan ────────────────────────────────────────────────────────────────────
function scanProjectFolders(spine) {
    const base = path.join(IMPORT_DIR, "projects");
    if (!fs.existsSync(base)) return { items: [], errors: [`missing folder: ${base}`] };

    const items = [];
    const errors = [];

    for (const dirent of fs.readdirSync(base, { withFileTypes: true })) {
        if (!dirent.isDirectory()) continue;
        const folder = dirent.name;

        const m = folder.match(/^(\d{1,3})-/);
        if (!m) {
            errors.push(`${folder}: no NNN- number prefix — cannot join it to a project`);
            continue;
        }
        const listNo = Number(m[1]);
        const row = spine.get(listNo);
        if (!row) {
            errors.push(`${folder}: prefix ${listNo} matches no row in projectsData.js`);
            continue;
        }

        const dir = path.join(base, folder);
        const files = fs.readdirSync(dir).filter((f) => IMAGE_RE.test(f));
        const hero = files.find((f) => HERO_RE.test(f)) || null;
        const gallery = files.filter((f) => GALLERY_RE.test(f)).sort();
        const before = files.filter((f) => BEFORE_RE.test(f)).sort();
        const stray = files.filter(
            (f) => !HERO_RE.test(f) && !GALLERY_RE.test(f) && !BEFORE_RE.test(f)
        );

        let details = null;
        const dp = path.join(dir, "details.txt");
        if (fs.existsSync(dp)) {
            details = parseDetails(fs.readFileSync(dp, "utf8"));
            if (details.unknown.length) {
                errors.push(
                    `${folder}: unrecognised label(s) in details.txt: ${details.unknown.join(", ")}`
                );
            }
        }
        if (stray.length) {
            errors.push(
                `${folder}: ignored, name is not hero/NN/before-NN: ${stray.join(", ")}`
            );
        }

        items.push({ folder, listNo, row, dir, hero, gallery, before, details });
    }

    return { items: items.sort((a, b) => a.listNo - b.listNo), errors };
}

function scanBrandFolders() {
    const base = path.join(IMPORT_DIR, "brands");
    const out = new Map();
    if (!fs.existsSync(base)) return out;

    for (const d of fs.readdirSync(base, { withFileTypes: true })) {
        if (!d.isDirectory()) continue;
        const dir = path.join(base, d.name);
        const names = fs.readdirSync(dir);
        const read = (f) =>
            names.includes(f) ? fs.readFileSync(path.join(dir, f), "utf8").trim() : null;
        const pick = (re) => names.find((f) => re.test(f)) || null;

        out.set(d.name, {
            slug: d.name,
            dir,
            logo: pick(/^logo\.(png|jpe?g)$/i),
            hero: pick(/^hero\.(jpe?g|png)$/i),
            description: read("description.txt"),
            consent: read("consent.txt"),
        });
    }
    return out;
}

// ── document builders ───────────────────────────────────────────────────────
function buildBrandDocs(spine, folders) {
    const names = new Map();
    for (const row of spine.values()) {
        if (!names.has(row.brand)) names.set(row.brand, brandSlug(row.brand));
    }

    const docs = [];
    for (const [name, slug] of names) {
        const f = folders.get(slug) || null;
        docs.push({
            _id: `brand-${slug}`,
            _type: "brand",
            name,
            slug: { _type: "slug", current: slug },
            description: (f && f.description) || undefined,
            // Absent consent.txt means yes: these 66 brands are already named
            // on the live site. The file exists to withdraw permission, not to
            // grant it.
            displayConsent: f && f.consent ? yes(f.consent) : true,
            // Whether consent.txt exists — mergeWrite only overwrites an
            // existing brand's consent when the owner actually said something.
            _consentGiven: Boolean(f && f.consent),
            featured: false,
            _assets: f
                ? {
                      logo: f.logo ? path.join(f.dir, f.logo) : null,
                      hero: f.hero ? path.join(f.dir, f.hero) : null,
                  }
                : {},
        });
    }

    const known = new Set(names.values());
    const orphans = [...folders.keys()].filter((s) => !known.has(s));
    return { docs, orphans };
}

function willPublish(item) {
    return !!item.hero && !!item.details && yes(item.details.CONSENT);
}

function buildProjectDoc(item) {
    const { row } = item;
    const d = item.details || {};
    const consent = yes(d.CONSENT);
    const hasCopy = !!(d.OVERVIEW || d.CHALLENGE || d.SOLUTION || (d.features && d.features.length));

    return {
        _id: `project-${row.listNo}`,
        _type: "project",
        name: row.name,
        slug: { _type: "slug", current: row.detailSlug || row.slug },
        brand: { _type: "reference", _ref: `brand-${brandSlug(row.brand)}` },
        sector: row.sector,
        subCategory: row.fmt,
        location: row.loc,
        city: row.city,
        state: row.state,
        scope: d.SCOPE || undefined,
        overview: d.OVERVIEW || undefined,
        challenge: d.CHALLENGE || undefined,
        solution: d.SOLUTION || undefined,
        features: d.features && d.features.length ? d.features : undefined,
        testimonial: d.TESTIMONIAL || undefined,
        credits: d.CREDITS || undefined,
        photoQuality: item.hero ? "approved" : "none",
        storyStrength: hasCopy ? "adequate" : "thin",
        // §26/§27: published needs BOTH a photograph and written consent.
        // Anything less stays a draft — an index row with no detail page,
        // which is what 158 of the 192 are today anyway.
        status: willPublish(item) ? "published" : "draft",
        clientDisplayConsent: consent,
        listNo: row.listNo,
        _assets: {
            hero: item.hero ? path.join(item.dir, item.hero) : null,
            gallery: item.gallery.map((f) => path.join(item.dir, f)),
            before: item.before.map((f) => path.join(item.dir, f)),
        },
    };
}

// ── write without losing anything ───────────────────────────────────────────
// A document that does not exist yet is created whole. One that DOES exist —
// seeded from the live site (npm run sanity:seed) or edited in the Studio —
// only receives what THIS run of the pack actually supplies: text that is not
// blank, photographs that are in the folder, consent the owner filled in. An
// empty details.txt or a folder without photos must never wipe copy that is
// already there (the pack's templates start empty; the site's 34 written
// projects do not). Until 2026-09-25 this was createOrReplace, which would have
// done exactly that.
//
// Status only ever moves UP to "published" (hero + CONSENT: yes) — except an
// explicit "CONSENT: no", which unpublishes: withdrawn permission wins.
async function mergeWrite(client, doc, packFields) {
    const set = Object.fromEntries(
        Object.entries(packFields).filter(([, v]) => v !== undefined && v !== null)
    );
    const tx = client.transaction().createIfNotExists(doc);
    if (Object.keys(set).length) tx.patch(doc._id, (p) => p.set(set));
    await tx.commit();
}

/** What the pack supplied for a project this run (after attachAssets). */
function projectPackFields(item, doc) {
    const consentText = String((item.details && item.details.CONSENT) || "").trim();
    const withdrawn = consentText !== "" && !yes(consentText);
    return {
        scope: doc.scope,
        overview: doc.overview,
        challenge: doc.challenge,
        solution: doc.solution,
        features: doc.features,
        testimonial: doc.testimonial,
        credits: doc.credits,
        heroImage: doc.heroImage,
        gallery: doc.gallery,
        beforeImages: doc.beforeImages,
        photoQuality: item.hero ? "approved" : undefined,
        storyStrength: doc.storyStrength === "adequate" ? "adequate" : undefined,
        clientDisplayConsent: consentText ? doc.clientDisplayConsent : undefined,
        status: doc.status === "published" ? "published" : withdrawn ? "draft" : undefined,
    };
}

/** What the pack supplied for a brand this run (after attachAssets). */
function brandPackFields(doc, consentGiven) {
    return {
        description: doc.description,
        logo: doc.logo,
        heroImage: doc.heroImage,
        displayConsent: consentGiven ? doc.displayConsent : undefined,
    };
}

// ── upload ──────────────────────────────────────────────────────────────────
async function upload(client, file, alt) {
    const buf = await prepareImage(file);
    const asset = await client.assets.upload("image", buf, {
        filename: path.basename(file).replace(/\.[^.]+$/, ".jpg"),
    });
    return { _type: "image", asset: { _type: "reference", _ref: asset._id }, alt };
}

async function attachAssets(client, doc, altBase) {
    const a = doc._assets || {};
    delete doc._assets;

    if (a.hero) doc.heroImage = await upload(client, a.hero, `${altBase} — interior by Arch Creative Interiors`);
    if (a.logo) doc.logo = await upload(client, a.logo, `${altBase} logo`);

    if (a.gallery && a.gallery.length) {
        doc.gallery = [];
        for (let i = 0; i < a.gallery.length; i++) {
            const img = await upload(client, a.gallery[i], `${altBase} — view ${i + 1}`);
            doc.gallery.push({ ...img, _key: `g${i}` });
        }
    }
    if (a.before && a.before.length) {
        doc.beforeImages = [];
        for (let i = 0; i < a.before.length; i++) {
            const img = await upload(client, a.before[i], `${altBase} — before works, view ${i + 1}`);
            doc.beforeImages.push({ ...img, _key: `b${i}` });
        }
    }
    return doc;
}

// ── report ──────────────────────────────────────────────────────────────────
// Have a schema, but are edited in the Studio rather than imported.
const STUDIO_ONLY = [
    "hero", "about", "founder", "team", "blog", "clients",
    "testimonials.csv", "faq.txt", "site-settings.txt", "clients.csv",
];
const UNSUPPORTED = ["services"];
const UNSUPPORTED_FILES = [];

function report(spine, items, brandDocs, errors, orphans) {
    const pub = items.filter(willPublish).length;
    const galleryImgs = items.reduce((n, p) => n + p.gallery.length + p.before.length, 0);

    console.log(`\nimport dir : ${IMPORT_DIR}`);
    console.log(`mode       : ${APPLY ? "APPLY — writes to Sanity" : "DRY RUN — no network, no writes"}`);
    if (APPLY) console.log(`target     : projectId=${PROJECT_ID} dataset=${DATASET}`);
    console.log(`watermark  : ${SKIP_WATERMARK ? "skipped (--no-watermark)" : path.relative(ROOT, WATERMARK)}`);

    console.log(`\nprojects`);
    console.log(`  spine rows (projectsData.js) : ${spine.size}`);
    console.log(`  folders found                : ${items.length}`);
    console.log(`  with hero                    : ${items.filter((p) => p.hero).length}`);
    console.log(`  with details.txt             : ${items.filter((p) => p.details).length}`);
    console.log(`  with CONSENT: yes            : ${items.filter((p) => p.details && yes(p.details.CONSENT)).length}`);
    console.log(`  gallery + before images      : ${galleryImgs}`);
    console.log(`  -> will publish              : ${pub}`);
    console.log(`  -> not published by the pack : ${items.length - pub}   (new documents start as draft; an existing published project keeps its status)`);

    console.log(`\nbrands`);
    console.log(`  documents (derived from spine) : ${brandDocs.length}`);
    console.log(`  with a folder of their own     : ${brandDocs.filter((b) => b._assets && (b._assets.logo || b._assets.hero)).length}`);
    if (orphans.length) console.log(`  folders matching no brand      : ${orphans.join(", ")}`);

    const present = [
        ...UNSUPPORTED.filter((n) => fs.existsSync(path.join(IMPORT_DIR, n))),
        ...UNSUPPORTED_FILES.filter((n) => fs.existsSync(path.join(IMPORT_DIR, n))),
    ];
    if (present.length) {
        console.log(`\nskipped — no schema exists for these yet: ${present.join(", ")}`);
        console.log(`  Add a document type in sanity/schemas/ and extend this script before`);
        console.log(`  expecting them to import. Nothing is written for them at all — they`);
        console.log(`  are not silently half-imported.`);
    }

    const studioOnly = STUDIO_ONLY.filter((n) => fs.existsSync(path.join(IMPORT_DIR, n)));
    if (studioOnly.length) {
        console.log(`\nskipped — enter these in the Studio instead: ${studioOnly.join(", ")}`);
        console.log(`  (the Content menu: Site settings, Home hero, Client logos, About page, Founder,`);
        console.log(`  Team, Testimonials, FAQs, Blog posts). They are not imported from the pack.`);
    }

    if (errors.length) {
        console.log(`\n${errors.length} problem(s):`);
        for (const e of errors) console.log(`  ! ${e}`);
    }
    console.log("");
}

// ── main ────────────────────────────────────────────────────────────────────
async function main() {
    if (!fs.existsSync(IMPORT_DIR)) {
        console.error(
            `No import folder at ${IMPORT_DIR}\n` +
                `Pass --dir <path>. See sanity/content-pack.md for the expected shape.\n`
        );
        process.exit(1);
    }

    const spine = loadSpine();
    const { items, errors } = scanProjectFolders(spine);
    const brandFolders = scanBrandFolders();
    const { docs: brandDocs, orphans } = buildBrandDocs(spine, brandFolders);

    report(spine, items, brandDocs, errors, orphans);

    // --json prints exactly what would be written, minus the uploaded asset
    // refs (which only exist after an upload). Worth running once before the
    // first --apply: a field that comes out undefined here comes out undefined
    // in Sanity too, and that is much cheaper to see now.
    if (flag("--json")) {
        console.log(JSON.stringify({ brands: brandDocs, projects: items.map(buildProjectDoc) }, null, 2));
    }

    if (!APPLY) {
        console.log("Dry run only. Re-run with --apply to write.\n");
        process.exit(errors.length ? 1 : 0);
    }
    if (errors.length) {
        console.error(
            "Refusing to import with unresolved problems above.\n" +
                "Fix them, then re-run the dry run to confirm the list is what you expect.\n"
        );
        process.exit(1);
    }
    if (!PROJECT_ID || !TOKEN) {
        console.error(
            "--apply needs SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in the environment.\n" +
                '(SANITY_DATASET defaults to "production".)\n'
        );
        process.exit(1);
    }

    const { createClient } = require(path.join(ROOT, "node_modules", "@sanity", "client"));
    const client = createClient({
        projectId: PROJECT_ID,
        dataset: DATASET,
        token: TOKEN,
        apiVersion: "2024-01-01",
        useCdn: false,
    });

    // Brands first: every project holds a reference to one, and a reference to
    // a document that does not exist yet is what turns an import into 192
    // broken records.
    console.log(`brands: uploading ${brandDocs.length}…`);
    for (const doc of brandDocs) {
        const consentGiven = doc._consentGiven;
        delete doc._consentGiven;
        await attachAssets(client, doc, doc.name);
        await mergeWrite(client, doc, brandPackFields(doc, consentGiven));
    }

    const todo = LIMIT ? items.slice(0, LIMIT) : items;
    console.log(`projects: uploading ${todo.length}…`);
    let n = 0;
    for (const item of todo) {
        const doc = buildProjectDoc(item);
        await attachAssets(client, doc, `${item.row.name}, ${item.row.loc}`);
        await mergeWrite(client, doc, projectPackFields(item, doc));
        n += 1;
        if (n % 10 === 0 || n === todo.length) console.log(`  ${n}/${todo.length}`);
    }

    console.log(`\nDone. ${brandDocs.length} brands, ${n} projects.\n`);
}

if (require.main === module) {
    main().catch((e) => {
        console.error("\nimport failed:", e.message);
        process.exit(1);
    });
}

module.exports = {
    parseDetails, brandSlug, buildProjectDoc, buildBrandDocs, prepareImage, loadSpine,
    mergeWrite, projectPackFields, brandPackFields,
};
