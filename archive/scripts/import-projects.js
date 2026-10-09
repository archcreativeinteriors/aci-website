/**
 * Build src/app/lib/data/projectsData.js from scripts/data/projects-192.txt.
 *
 *   npm run projects:import
 *
 * The txt is the owner's own list and is the source of truth for BOTH the names
 * and the order. Names, spellings and locations are taken EXACTLY as written —
 * nothing is deduped, corrected or re-cased here. Redesign brief §9 is explicit
 * that the spelling inconsistencies (Hakim Aalim/Hakim Ali, Tony & Guy/Toni &
 * Guy, Bon Temps/Bon Tamps, Acedemy, Chhasttisgarh…) are a content decision to
 * raise with the client, not something to silently fix in code. This script
 * reports them and changes none of them.
 *
 * ORDER: the file runs oldest -> newest, so it is REVERSED — line 192 becomes
 * position 1. That is the "most recent first" the index promises.
 *
 * Classification (city / state / format / sector) is reused from the approved
 * demo's PJ array wherever a row matches it, since that mapping was curated.
 * Rows the demo does not have fall back to derivation.
 *
 * Photos: matched one-to-one against the 34 detailed records in data/projects.js
 * so the image comes from the local static import (keeping its blur placeholder)
 * rather than the demo's URLs, which point at the live site we are replacing.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const LIST = path.join(ROOT, "scripts/data/projects-192.txt");
const OUT = path.join(ROOT, "src/app/lib/data/projectsData.js");
const EXISTING = path.join(ROOT, "src/app/lib/data/projects.js");
const DEMO =
    process.argv[2] ||
    path.join(process.env.USERPROFILE || process.env.HOME, "Downloads/aci-projects-index.html");

// ── 1. parse the owner's list
const lines = fs
    .readFileSync(LIST, "utf8")
    .split("\n")
    .map((l) => l.replace(/\r$/, ""))
    .filter((l) => l.trim() && !l.trim().startsWith("#"));

const squash = (s) => s.replace(/\s+/g, " ").trim();

// The owner asked for the rows EXACTLY as written, so the name and location that
// get stored are only trimmed at the ends — internal spacing is left alone.
// Four rows really do carry a double space inside the location ("Apex  D'Rio",
// "Zora Mall  Raipur", "Alwar  Rajasthan" twice) and squash() was silently
// collapsing them. It stays in use for the DERIVED fields below (brand, the
// matching keys), where normalising is the point.
const trimOnly = (s) => s.replace(/^\s+|\s+$/g, "");

function parseLine(line) {
    // "<n><TAB>Name (Location)" — the leading number is the owner's row number.
    const m = line.match(/^\s*(\d+)\s*\t?\s*(.*)$/);
    const listNo = m ? Number(m[1]) : null;
    let rest = trimOnly(m ? m[2] : line);

    // Take the LAST bracketed group as the location: line 25 is
    // "Headline Salon (Makenews) (Sector 69 Gurgaon)" — two groups, and the
    // location is the second. Line 171 has none at all.
    const groups = [...rest.matchAll(/\(([^)]*)\)/g)];
    if (!groups.length) return { listNo, name: rest, loc: "" };

    const last = groups[groups.length - 1];
    const loc = trimOnly(last[1]);
    const name = trimOnly(rest.slice(0, last.index) + rest.slice(last.index + last[0].length));
    return { listNo, name, loc };
}

const parsed = lines.map(parseLine);

// A NEW project is added at the BOTTOM of the txt and must show at the TOP of
// the site, which sorts listNo descending. A row typed without its number would
// get none and sink to the bottom instead — so it takes the next number here.
// Two rows with one number have no defined order, so that stops the import.
let highestNo = 0;
for (const p of parsed) {
    if (p.listNo == null) {
        p.listNo = highestNo + 1;
        console.log(`numbered    : #${p.listNo} ${p.name} (the txt row had no number)`);
    }
    highestNo = Math.max(highestNo, p.listNo);
}
const clashes = parsed.filter((p, i) => parsed.findIndex((q) => q.listNo === p.listNo) !== i);
if (clashes.length) {
    clashes.forEach((p) => console.error(`! number ${p.listNo} is used twice (${p.name}) — renumber and re-run`));
    process.exit(1);
}

// ── 2. the demo's curated classification, matched by name + location
let demoIndex = new Map();
const canonicalCity = new Map();
try {
    const html = fs.readFileSync(DEMO, "utf8");
    const pj = JSON.parse(html.match(/var PJ=(\[\[[\s\S]*?\]\]);/)[1]);
    for (const [, name, brand, loc, city, state, fmt, sector] of pj) {
        demoIndex.set(key(name, loc), { brand, city, state, fmt, sector });
        // Canonical spelling+casing, so a derived row cannot invent a second
        // spelling of a city that already exists and inflate the city count.
        canonicalCity.set(city.toLowerCase(), city);
    }
} catch {
    console.warn("! demo file not readable — falling back to derivation for every row");
}

function key(name, loc) {
    return squash(`${name} ${loc}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
}

// ── 3. derivation fallback for rows the demo does not carry
const STATE_ALIASES = {
    haryana: "Haryana", punjab: "Punjab", rajasthan: "Rajasthan",
    uttarakhand: "Uttarakhand", jharkhand: "Jharkhand", bihar: "Bihar",
    gujarat: "Gujarat", maharashtra: "Maharashtra", assam: "Assam",
    chandigarh: "Chandigarh", odisha: "Odisha",
    chhattisgarh: "Chhattisgarh", chhatisgarh: "Chhattisgarh", chhasttisgarh: "Chhattisgarh",
    "jammu & kashmir": "J&K",
    "u.p": "Uttar Pradesh", "uttar pradesh": "Uttar Pradesh",
    "m.p": "Madhya Pradesh", uk: "Uttarakhand",
};
const CITY_STATE = {
    gurgaon: "Haryana", gurugram: "Haryana", gurugam: "Haryana", faridabad: "Haryana",
    manesar: "Haryana", karnal: "Haryana", panchkula: "Haryana", hisar: "Haryana",
    rohtak: "Haryana", "gwal pahari": "Haryana",
    delhi: "Delhi", saket: "Delhi", janakpuri: "Delhi", "hauz khas": "Delhi",
    "karol bagh": "Delhi", "green park": "Delhi", "lajpat nagar": "Delhi",
    noida: "Uttar Pradesh", ghaziabad: "Uttar Pradesh", lucknow: "Uttar Pradesh",
    kanpur: "Uttar Pradesh", moradabad: "Uttar Pradesh", bareilly: "Uttar Pradesh",
    dehradun: "Uttarakhand", haridwar: "Uttarakhand", rishikesh: "Uttarakhand",
    rudrapur: "Uttarakhand", haldwani: "Uttarakhand",
    ludhiana: "Punjab", patiala: "Punjab", zirakpur: "Punjab", amritsar: "Punjab",
    mohali: "Punjab", elante: "Chandigarh",
    jaipur: "Rajasthan", ajmer: "Rajasthan", alwar: "Rajasthan",
    patna: "Bihar", ranchi: "Jharkhand", dhanbad: "Jharkhand",
    jhamshedpur: "Jharkhand", bhubaneswar: "Odisha",
    indore: "Madhya Pradesh", raipur: "Chhattisgarh", ahmedabad: "Gujarat",
    pune: "Maharashtra", guwahati: "Assam",
    srinagar: "J&K", jammu: "J&K", udhampur: "J&K",
};

function longestHit(haystack, table) {
    let best = null;
    for (const [needle, value] of Object.entries(table)) {
        if (haystack.includes(needle) && (!best || needle.length > best.needle.length)) {
            best = { needle, value };
        }
    }
    return best ? best.value : null;
}

function deriveState(loc) {
    const l = ` ${loc.toLowerCase()} `;
    return longestHit(l, STATE_ALIASES) || longestHit(l, CITY_STATE) || null;
}

// Returns the SAME spelling the demo uses, or Title Case as a last resort.
// Returning the raw lowercase lookup key here silently created a 43rd city
// ("gurgaon" alongside "Gurgaon") and broke the derived count — exactly the
// drift brief §7 exists to prevent.
function deriveCity(loc) {
    const l = loc.toLowerCase();
    let hit = null;
    for (const city of Object.keys(CITY_STATE)) {
        if (l.includes(city) && (!hit || city.length > hit.length)) hit = city;
    }
    if (!hit) return squash(loc);
    return (
        canonicalCity.get(hit) ||
        hit.replace(/\b\w/g, (c) => c.toUpperCase())
    );
}

const FORMAT_WORDS =
    /\s+(unisex\s+salon\s+n\s+spa|unisex\s+salon\s+nail\s+cafe|salon\s+&\s+academy|salon\s+&\s+acedemy|salon\s+&\s+spa|unisex\s+salon(\s+by\s+\w+)?|makeup\s+studio|nail\s+art\s+studio|nail\s+art|nail\s+cafe|makeovers|spalon|salon|studio|academy|spa)$/i;

const deriveBrand = (name) => squash(name.replace(FORMAT_WORDS, "")) || name;

function deriveFmt(name) {
    const n = name.toLowerCase();
    if (/nail/.test(n)) return "Nail studio";
    if (/academy|acedemy/.test(n)) return "Academy";
    if (/\bspa\b/.test(n)) return "Spa";
    if (/studio/.test(n)) return "Studio";
    return "Salon";
}

const slugify = (s) =>
    s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

// ── 4. build rows, NEWEST FIRST (the file runs oldest -> newest)
const seenSlug = new Map();
const rows = parsed
    .slice()
    .reverse()
    .map(({ listNo, name, loc }) => {
        const demo = demoIndex.get(key(name, loc));

        let slug = slugify(`${name} ${loc}`);
        if (seenSlug.has(slug)) {
            seenSlug.set(slug, seenSlug.get(slug) + 1);
            slug = `${slug}-${seenSlug.get(slug)}`;
        } else seenSlug.set(slug, 1);

        return {
            listNo,
            slug,
            name,
            brand: demo ? demo.brand : deriveBrand(name),
            loc,
            city: demo ? demo.city : deriveCity(loc),
            state: demo ? demo.state : deriveState(loc),
            fmt: demo ? demo.fmt : deriveFmt(name),
            sector: demo ? demo.sector : "Salon and studio",
            detailSlug: null,
        };
    });

// ── 5. attach the 34 detailed records, one-to-one
const existingSrc = fs.readFileSync(EXISTING, "utf8");
const existing = [...existingSrc.matchAll(/id:\s*"([^"]+)"/g)].map((m) => ({
    slug: m[1],
    title: (existingSrc.match(new RegExp(`id:\\s*"${m[1]}"[\\s\\S]*?title:\\s*"([^"]*)"`)) || [])[1],
    location: (existingSrc.match(new RegExp(`id:\\s*"${m[1]}"[\\s\\S]*?location:\\s*"([^"]*)"`)) || [])[1],
}));

const tokens = (s) =>
    (s || "").toLowerCase().replace(/gurgaon/g, "gurugram").replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);

// Seven records the 0.5-Jaccard pass cannot reach, because the detail record and
// the owner's list name the same project differently. Keyed by detail slug ->
// the owner's LIST NUMBER (unambiguous; the txt is numbered 1..192). Applied
// before the fuzzy pass and excluded from it, so a manual pin always wins.
//
// Without these, seven live /projects/[id] pages build and sit in sitemap.xml
// with no link anywhere on the index — reachable only from Google.
//
//   detail record title / location      ->  list row
const MANUAL = {
    "geetanjali-salon-saket": 125,      // "Select City Walk Saket"    -> Select Citywalk Mall Saket New Delhi
    "punjabi-restaurant-gurugram": 144, // "Punjabi Restaurant"        -> Punjabi By Nature, M3M IFC Sector 66
    "eesha-salon": 167,                 // "Eesha Salon / Gurugram"    -> AIPL Street Sector 66 Gurgaon
    "toni-and-guy": 173,                // "Toni & Guy"                -> Tony & Guy Salon, Indirapuram
    "peluqueria-salon-lucknow": 176,    // "Gomti Nagar, Lucknow"      -> Peluqueria Salon, Lucknow U.P
    "hakim-ali-salon": 180,             // "Hakim Ali / Indore"        -> Hakim Aalim Salon, High Street Apollo
    // JUDGEMENT CALL, not an exact match: the record is titled just "Geetanjali
    // Salon Lucknow" with location "Lucknow", and the list has three Lucknow
    // Geetanjali rows (80 Phoenix Palassio, 101 Ashiyana studio, 115 Lulu Mall).
    // Pinned to the first Geetanjali *Salon* of the three. Re-point if the
    // photographs say otherwise.
    "geetanjali-salon-lucknow": 80,
    // Five the fuzzy pass got WRONG — same brand, wrong branch — found on
    // 2026-09-25 by matching the owner's photo folders (which carry the list
    // number) against each page. Two are proven by the photograph itself:
    // the page's photo is a visual match for a file in that folder.
    "geetanjali-salon-dlf-phase-4": 104, // photo match; was #93 DLF Cyber City
    "geetanjali-salon-vensejmall": 163,  // photo match; was #62 Ambience Mall
    "geetanjali-studio-ajmer": 166,      // "Ajmer"; was #182, which is Alwar
    "geetanjali-salon-dehradun": 100,    // "GMS Road, Dehradun"; was #170, EC Road
    "geetanjali-salon-gurugram": 181,    // "Sector 82"; was #151, Sector 65
};

const rowByListNo = new Map(rows.map((r, i) => [r.listNo, i]));
const manualRow = new Set();
const manualRecord = new Set();
for (const [slug, listNo] of Object.entries(MANUAL)) {
    const ei = existing.findIndex((e) => e.slug === slug);
    const ri = rowByListNo.get(listNo);
    if (ei === -1 || ri === undefined) {
        console.log(`! MANUAL entry could not be applied: ${slug} -> #${listNo}`);
        continue;
    }
    rows[ri].detailSlug = slug;
    manualRow.add(ri);
    manualRecord.add(ei);
}

const pairs = [];
rows.forEach((r, ri) =>
    existing.forEach((e, ei) => {
        if (manualRow.has(ri) || manualRecord.has(ei)) return;
        const want = new Set([...tokens(r.name), ...tokens(r.loc)]);
        const have = new Set([...tokens(e.title), ...tokens(e.location)]);
        let hits = 0;
        for (const t of have) if (want.has(t) && t.length > 2) hits++;
        const s = hits / Math.max(new Set([...want, ...have]).size, 1);
        if (s >= 0.5) pairs.push({ ri, ei, s });
    })
);
pairs.sort((a, b) => b.s - a.s);
const usedRow = new Set(manualRow);
const usedRecord = new Set(manualRecord);
for (const { ri, ei } of pairs) {
    if (usedRow.has(ri) || usedRecord.has(ei)) continue;
    usedRow.add(ri);
    usedRecord.add(ei);
    rows[ri].detailSlug = existing[ei].slug;
}

const out = `// GENERATED by scripts/import-projects.js — do not edit by hand.
// Source: scripts/data/projects-192.txt (the owner's list, ${rows.length} rows).
//
// ORDER IS NEWEST FIRST: the txt runs oldest -> newest and is reversed on import,
// so \`listNo\` counts DOWN from ${rows[0].listNo} here. Do not re-sort this array.
//
// Redesign brief §7: every brand, city, state and sector count on the site is
// DERIVED from these rows at render time (see lib/projectStats.js). Never
// hard-code a total that this array can compute.
//
// Names and locations are exactly as the owner wrote them — spelling variants
// included, per brief §9.
export const projectsData = ${JSON.stringify(rows, null, 4)};
`;
fs.writeFileSync(OUT, out);

// ── report
const uniq = (k) => new Set(rows.map((r) => r[k])).size;
const sectors = {};
rows.forEach((r) => (sectors[r.sector] = (sectors[r.sector] || 0) + 1));
const noState = rows.filter((r) => !r.state);
const fromDemo = rows.filter((r) => demoIndex.has(key(r.name, r.loc))).length;

console.log(`rows        : ${rows.length}   (order: #${rows[0].listNo} first -> #${rows[rows.length - 1].listNo} last)`);
console.log(`  first     : ${rows[0].name} (${rows[0].loc})`);
console.log(`  last      : ${rows[rows.length - 1].name} (${rows[rows.length - 1].loc})`);
console.log(`classified from the demo : ${fromDemo}/${rows.length}  (rest derived)`);
console.log(`linked to a detail page  : ${rows.filter((r) => r.detailSlug).length}`);
console.log(`\nderived totals: brands ${uniq("brand")} · cities ${uniq("city")} · states ${uniq("state")}`);
console.log(`sectors ${JSON.stringify(sectors)}`);
if (noState.length) {
    console.log(`\n! ${noState.length} row(s) with no state:`);
    noState.forEach((r) => console.log(`   ${r.listNo}. ${r.name} (${r.loc})`));
}

// Duplicates are reported, never removed — the owner asked for the list exactly.
const byKey = new Map();
rows.forEach((r) => {
    const k = key(r.name, r.loc);
    byKey.set(k, (byKey.get(k) || []).concat(r.listNo));
});
const dupes = [...byKey.entries()].filter(([, v]) => v.length > 1);
if (dupes.length) {
    console.log(`\n! ${dupes.length} duplicate row(s) kept as-is (plan §1 removes 5 to reach 187):`);
    dupes.forEach(([, nos]) => {
        const r = rows.find((x) => x.listNo === nos[0]);
        console.log(`   lines ${nos.join(" + ")}  ${r.name} (${r.loc})`);
    });
}
