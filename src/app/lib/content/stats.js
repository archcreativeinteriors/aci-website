// Every total the site shows, DERIVED from the project list (Phase 6: the list
// now comes from Sanity — getProjectRows() in lib/content/projects.js — instead
// of data/projectsData.js; the derivations themselves are unchanged).
//
// Redesign brief §7: "Brands, city counts, state counts and all bar charts are
// derived at render time from this array. Never hard-code a count that the data
// can compute."
//
// THE PROJECT TOTAL IS NOT RENDERED ANYWHERE (owner, 2026-09-17), nor any
// share-of-total percentage (104 ÷ 0.53 gives the total back). PROJECT_STATS
// still counts it only so /projects can tell "unfiltered" from a subset.
// Cities / states / spaces shown as headline numbers are TYPED in Site
// settings (owner, 2026-09-24); per-brand and per-state counts stay derived.
//
// Use: `const stats = await getStats()` (lib/content/projects.js), then
// stats.brandsByCount() etc. The pure helpers below need no data.
//
// NOTE: plain for-loops, not `rows.reduce(...)` in an arrow-returning helper —
// that pattern made the production minifier MISCOMPILE this code once
// (`a[b.sector] = (a[b[field]] || 0) + 1`, crashing the prerender of "/").
// Verify with `npm run build`, not `npm run dev`.

/** "J&K" -> "Jammu & Kashmir"; everything else unchanged. */
export function stateDisplay(state) {
    return state === "J&K" ? "Jammu & Kashmir" : state;
}

/** /projects/state/[state] segment. Both "J&K" and "Jammu & Kashmir" -> "jammu-and-kashmir". */
export function stateSlug(state) {
    return stateDisplay(state || "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * /projects/brand/[brand] segment. Derived from the name ("Beauty & Beard" ->
 * "beauty-and-beard") — the same rule the brand documents' slugs follow.
 */
export function brandSlug(brand) {
    return (brand || "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * Minimum projects for a brand to get its own collection page. 1 = every brand
 * with a project has one (owner's call; the history is in docs/archive).
 * brandsWithCollectionPage(), brandHref(), generateStaticParams and the sitemap
 * all derive from it. The "See all N" link on a project page deliberately does
 * NOT go below 2.
 */
export const BRAND_COLLECTION_MIN = 1;

/** Where a brand tile points: its collection page, else its one project page, else /projects. */
export function brandHref(entry) {
    if (!entry) return "/projects";
    if (entry.count >= BRAND_COLLECTION_MIN) return `/projects/brand/${brandSlug(entry.brand)}`;
    const withPage = entry.items.find((p) => p.detailSlug);
    return withPage ? `/projects/${withPage.detailSlug}` : "/projects";
}

/** Spec §5 — format distribution for one brand, largest first, bar width as `pct` of the largest. */
export function formatBreakdown(items) {
    const counts = {};
    for (const p of items) {
        const key = p.fmt || p.subCategory || "Other";
        counts[key] = (counts[key] || 0) + 1;
    }
    const rows = Object.entries(counts)
        .map(([format, count]) => ({ format, count }))
        .sort((a, b) => b.count - a.count || a.format.localeCompare(b.format));
    const max = rows.length ? rows[0].count : 1;
    return rows.map((r) => ({ ...r, pct: Math.round((r.count / max) * 100) }));
}

/** Spec §6 — a brand's projects grouped by state, biggest state first, newest-first within. */
export function groupByState(items) {
    const map = new Map();
    for (const p of items) {
        const state = p.state || "Other";
        if (!map.has(state)) map.set(state, []);
        map.get(state).push(p);
    }
    return [...map.entries()]
        .map(([state, projects]) => ({ state: stateDisplay(state), projects }))
        .sort((a, b) => b.projects.length - a.projects.length || a.state.localeCompare(b.state));
}

/** The derivations that need the project list. `rows` is getProjectRows(). */
export function projectStats(rows) {
    function distinct(field) {
        const values = new Set();
        for (const p of rows) values.add(p[field]);
        return values.size;
    }
    function countBy(field) {
        const out = {};
        for (const p of rows) {
            const value = p[field];
            out[value] = (out[value] || 0) + 1;
        }
        return out;
    }

    function statesByCount() {
        const counts = countBy("state");
        return Object.entries(counts)
            .map(([state, count]) => ({ state: stateDisplay(state), count }))
            .sort((a, b) => b.count - a.count || a.state.localeCompare(b.state));
    }

    function brandsByCount() {
        const byBrand = new Map();
        for (const p of rows) {
            if (!p.brand) continue;
            if (!byBrand.has(p.brand)) byBrand.set(p.brand, []);
            byBrand.get(p.brand).push(p);
        }
        return [...byBrand.entries()]
            .map(([brand, items]) => ({
                brand,
                count: items.length,
                cities: new Set(items.map((p) => p.city)).size,
                states: new Set(items.map((p) => p.state)).size,
                items,
            }))
            .sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand));
    }

    return {
        PROJECT_STATS: {
            projects: rows.length,
            brands: distinct("brand"),
            cities: distinct("city"),
            states: distinct("state"),
        },
        /** Sector totals — { "Salon and studio": 180, ... } */
        SECTOR_COUNTS: countBy("sector"),
        statesByCount,
        stateBySlug: (slug) => statesByCount().find((s) => stateSlug(s.state) === slug) || null,
        /** City NAMES in one state, most projects first (no counts, on purpose). */
        citiesByState(state) {
            const target = stateDisplay(state);
            const counts = new Map();
            for (const p of rows) {
                if (stateDisplay(p.state) !== target) continue;
                counts.set(p.city, (counts.get(p.city) || 0) + 1);
            }
            return [...counts.entries()]
                .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
                .map(([city]) => city);
        },
        brandsByCount,
        brandBySlug: (slug) => brandsByCount().find((b) => brandSlug(b.brand) === slug) || null,
        brandsWithCollectionPage: () => brandsByCount().filter((b) => b.count >= BRAND_COLLECTION_MIN),
    };
}
