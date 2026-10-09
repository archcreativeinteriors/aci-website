#!/usr/bin/env node
/**
 * sanity-scaffold — create the empty content pack for the owner to fill in.
 *
 *   node sanity/scripts/scaffold.js                       # dry run
 *   node sanity/scripts/scaffold.js --apply               # write it
 *   node sanity/scripts/scaffold.js --apply --dir <path>  # somewhere else
 *
 * Builds `../sanity-import` — one folder per project in src/app/lib/data/
 * projectsData.js, named `NNN-<slug>`, each holding a details.txt template
 * pre-filled with that project's own name, brand and location — plus one folder
 * per brand. The owner drops photographs into the right folder and fills in the
 * blanks; `sanity/scripts/import.js` then reads the result.
 *
 * ── WHY IT IS BUILT AND NOT HAND-MADE ───────────────────────────────────────
 * The import joins on the folder's NUMBER PREFIX (`080-` -> listNo 80), not on
 * its name. Hand-typing 192 of those is one transposed digit away from filing a
 * Lucknow salon's photographs under a Gurugram one — and the import would still
 * succeed, because 080 is a perfectly valid number. Generating them from the
 * same array the importer uses as its spine makes that class of mistake
 * impossible.
 *
 * ── SAFE TO RE-RUN ──────────────────────────────────────────────────────────
 * It NEVER overwrites a details.txt that already exists, and never touches an
 * image. Re-running after the owner has filled some in adds only what is
 * missing, so it can be run again if projectsData.js ever gains rows.
 *
 * ── WHERE IT WRITES, AND WHY NOT IN THE REPO ────────────────────────────────
 * Default is `../sanity-import`, a SIBLING of the repo. The pack will hold
 * ~960 camera originals; `.git` is already a 258 MB pack of exactly this kind
 * of file (CLAUDE.md, Deployment). Putting them inside the working tree is one
 * `git add -A` away from making that permanent.
 */

const fs = require("fs");
const path = require("path");

// Repo root. TWO levels up, because this file lives at sanity/scripts/ —
// it was scripts/ until 2026-09-23. Nothing in the build touches these
// scripts, so a wrong ROOT here fails only at `npm run sanity:*`, never at
// `npm run build`. Re-derive it if this file ever moves again.
const ROOT = path.resolve(__dirname, "..", "..");

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, d) => {
    const i = argv.indexOf(n);
    return i !== -1 && argv[i + 1] ? argv[i + 1] : d;
};

const APPLY = flag("--apply");
// Rewrites templates that already exist. Default is off, because by the time
// this is re-run the owner may have typed into them — and an overwritten
// details.txt is unrecoverable work, not a regenerable artefact. Only use it
// while the pack is still empty.
const FORCE = flag("--force");
const OUT = path.resolve(opt("--dir", path.join(ROOT, "..", "sanity-import")));

/** The spine — read exactly as sanity/scripts/import.js reads it. */
function loadRows() {
    const src = fs.readFileSync(path.join(ROOT, "src/app/lib/data/projectsData.js"), "utf8");
    return JSON.parse(src.slice(src.indexOf("["), src.lastIndexOf("]") + 1));
}

/** Mirrors brandSlug() in src/app/lib/projectStats.js and in sanity-import.js. */
function brandSlug(brand) {
    return (brand || "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * `NNN-` zero-padded to three digits, then a short readable tail.
 *
 * The importer's prefix rule is /^(\d{1,3})-/, so 80- would match as well as
 * 080-. Padding is for the HUMAN: unpadded, a directory listing sorts 1, 10,
 * 100, 11 … and the folder you want is never where you look for it.
 */
function folderName(row) {
    const tail = row.slug.split("-").slice(0, 6).join("-");
    return `${String(row.listNo).padStart(3, "0")}-${tail}`;
}

/**
 * The per-project template.
 *
 * Every label here is one `sanity/scripts/import.js` parses — SINGLE, BLOCK and
 * FEATURES. An unrecognised ALL-CAPS label is reported as an error by that
 * script rather than ignored, so this file must not invent one.
 *
 * ── ALL GUIDANCE SITS ABOVE THE FIRST LABEL, AND THAT IS NOT COSMETIC ───────
 * The parser captures EVERY line after a label until the next known label. The
 * first version of this template put a `# explain the next field` comment
 * between each pair, which meant the comment was read as the VALUE of the field
 * above it — the import dry run reported "with a YEAR: 192", because all 192
 * files had YEAR set to "# Built-up area in square feet, digits only".
 * That would have written a line of instructions into 192 documents.
 *
 * Text before the FIRST label is discarded (`current` is still null), so the
 * legend is safe there and only blank lines may separate the labels below it.
 * If a field is ever added, add its explanation to the legend — never inline.
 */
function detailsTemplate(row) {
    return [
        `# ${row.name} — ${row.loc}`,
        `# ${row.brand} · ${row.city}, ${row.state} · ${row.fmt}`,
        `# Project #${row.listNo} — do NOT change the "${String(row.listNo).padStart(3, "0")}-" on this folder's name.`,
        "#",
        "# ── HOW TO FILL THIS IN ────────────────────────────────────────────",
        "# Type your answer after the label, or on the lines beneath it.",
        "#",
        "# LEAVE ANYTHING YOU ARE UNSURE OF BLANK. Blank means 'not known' and",
        "# the website simply omits it. A guess becomes a published claim.",
        "#",
        "# Do not add labels of your own, and do not write notes between the",
        "# labels below — everything under a label is read as its value.",
        "#",
        "#   CONSENT         yes / no — must be yes for this project to go live",
        "#   SCOPE           one line on what the job covered",
        "#   CREDITS         photographer or anyone to credit",
        "#   OVERVIEW        a paragraph on the space and the brief",
        "#   CHALLENGE       what made this site difficult",
        "#   SOLUTION        what was done about it",
        '#   FEATURES        one "- item" per line',
        "#   TESTIMONIAL     the client's own words ONLY — never write this for",
        "#                   them; an invented quote is the one thing here that",
        "#                   cannot be undone later",
        "#",
        "# Photographs go in this same folder — see PHOTOS-HERE.txt.",
        "# ───────────────────────────────────────────────────────────────────",
        "",
        "CONSENT:",
        "",
        "SCOPE:",
        "",
        "CREDITS:",
        "",
        "OVERVIEW:",
        "",
        "CHALLENGE:",
        "",
        "SOLUTION:",
        "",
        "FEATURES:",
        "",
        "TESTIMONIAL:",
        "",
    ].join("\n");
}

function photosReadme(row) {
    return [
        `${row.name} — ${row.loc}`,
        "",
        "Photographs go in THIS folder, named exactly like this:",
        "",
        "  hero.jpg        the one main shot (required to publish)",
        "  01.jpg          gallery, two digits, in the order you want them shown",
        "  02.jpg",
        "  before-01.jpg   optional before/during shots",
        "",
        ".png works too. Any OTHER filename is reported as an error and skipped",
        "— including 1.jpg, which needs to be 01.jpg.",
        "",
        "Send the ORIGINALS. Do not resize, compress or watermark them first:",
        "the importer caps the long edge at 2560px and applies the ACI",
        "watermark itself, and a file that has already been shrunk cannot be",
        "un-shrunk later.",
        "",
    ].join("\n");
}

function brandReadme(name, slug) {
    return [
        `${name}`,
        "",
        "Optional, and only if you have them:",
        "",
        "  logo.png          the brand's logo",
        "  hero.jpg          a photograph to head this brand's page",
        "  description.txt   a paragraph about the brand",
        "  consent.txt       ONLY to WITHDRAW permission — write: no",
        "",
        "Leave this folder empty if there is nothing to add. An absent",
        `consent.txt means yes: ${name} is already named on the live site, so`,
        "that file exists to take permission away, never to grant it.",
        "",
    ].join("\n");
}

function main() {
    const rows = loadRows();
    const plan = { dirs: 0, details: 0, readmes: 0, skipped: 0 };

    const write = (p, body) => {
        if (fs.existsSync(p) && !FORCE) {
            plan.skipped++;
            return;
        }
        if (APPLY) fs.writeFileSync(p, body);
        return true;
    };
    const mkdir = (p) => {
        if (!fs.existsSync(p)) {
            if (APPLY) fs.mkdirSync(p, { recursive: true });
            plan.dirs++;
        }
    };

    mkdir(OUT);
    mkdir(path.join(OUT, "projects"));
    mkdir(path.join(OUT, "brands"));

    for (const row of rows) {
        const dir = path.join(OUT, "projects", folderName(row));
        mkdir(dir);
        if (write(path.join(dir, "details.txt"), detailsTemplate(row))) plan.details++;
        if (write(path.join(dir, "PHOTOS-HERE.txt"), photosReadme(row))) plan.readmes++;
    }

    const brands = new Map();
    for (const row of rows) if (!brands.has(row.brand)) brands.set(row.brand, brandSlug(row.brand));
    for (const [name, slug] of brands) {
        const dir = path.join(OUT, "brands", slug);
        mkdir(dir);
        if (write(path.join(dir, "ABOUT-THIS-FOLDER.txt"), brandReadme(name, slug))) plan.readmes++;
    }

    console.log(`${APPLY ? "Wrote" : "Would write"} the content pack at:\n  ${OUT}\n`);
    console.log(`  projects        : ${rows.length}`);
    console.log(`  brands          : ${brands.size}`);
    console.log(`  folders created : ${plan.dirs}`);
    console.log(`  details.txt     : ${plan.details}`);
    console.log(`  readme files    : ${plan.readmes}`);
    if (plan.skipped) console.log(`  left untouched  : ${plan.skipped} (already existed)`);
    if (!APPLY) console.log(`\nDry run. Re-run with --apply to write it.`);
    else console.log(`\nNext: drop photographs in, then\n  npm run sanity:import -- --dir ${OUT}`);
}

main();
