// Every total shown on the site, derived from data/projectsData.js.
//
// Redesign brief §7: "Brands, city counts, state counts and all bar charts are
// derived at render time from this array. Never hard-code a count that the data
// can compute — that is how the current site's numbers drifted apart."
//
// ── PROJECT_STATS.projects IS NO LONGER RENDERED ANYWHERE (owner, 2026-09-17) ─
// The project total contradicted the "1000+ spaces delivered" headline, which
// sat inches above it in the same block on both Home and /about. The owner kept
// the headline and removed the total site-wide. The export stays — it is still
// used by /projects to tell "unfiltered" from a real subset — but it must not
// reach the page.
//
// This is a copy decision, not a data one. Nothing else changed: cities, states,
// brands, per-state bar counts, per-brand counts and sector counts all still
// render and are still derived. Share-of-total percentages went too, because a
// percentage of the total encodes the total (104 ÷ 0.53 gives it back).
//
// So §7 still holds for everything it covers. If you are adding a surface that
// wants "how many projects", the answer is that the site does not say — and
// re-deriving it here to "stay consistent with the other tiles" reopens the
// exact conflict this removed.
//
// This is the only place totals are calculated. If a number appears in JSX, it
// comes from here. That is what makes brief §8's discrepancies unrepeatable:
// the demo said 43 cities and 181 salon projects; the data says 42 and 180, and
// the demo's Geetanjali page said 36 cities / 16 states against an actual 35/15.

import { projectsData } from "./data/projectsData";

// NOTE: these are deliberately plain functions with a for-loop, not
// `(field) => projectsData.reduce(...)`. The arrow-returning-reduce form made
// the production minifier MISCOMPILE this file: inlining countBy("sector") it
// substituted the parameter on the left of the assignment but not the right,
// emitting `a[b.sector] = (a[b[field]] || 0) + 1` with `field` undefined, which
// crashed the prerender of "/". Reading the field into a local once removes the
// pattern that triggered it. Verify with `npm run build`, not `npm run dev` —
// dev is unminified and the bug does not appear there.
function distinct(field) {
    const values = new Set();
    for (const p of projectsData) values.add(p[field]);
    return values.size;
}

function countBy(field) {
    const out = {};
    for (const p of projectsData) {
        const value = p[field];
        out[value] = (out[value] || 0) + 1;
    }
    return out;
}

// NOTE (owner, 2026-09-24): `cities` / `states` below are still DERIVED, but
// they are no longer what the site DISPLAYS as its headline numbers. The home
// and /about stats, the /services and /projects ledes and the home meta
// description read the TYPED values in Site settings (getSiteSettings() in
// lib/contentSource.js). Per-brand and per-state counts stay derived here.
export const PROJECT_STATS = {
    projects: projectsData.length,
    brands: distinct("brand"),
    cities: distinct("city"),
    states: distinct("state"),
};

/** Sector totals for the "What we do" cards — { "Salon and studio": 180, ... } */
export const SECTOR_COUNTS = countBy("sector");

/**
 * Display form of a stored state value. The dataset stores the short form.
 *
 * ONE definition, because the mapping used to be inlined in both
 * statesByCount() and groupByState(). Anything that compares a record's raw
 * `state` against a displayed one has to pass it through here first, or
 * "J&K" silently fails to match "Jammu & Kashmir" and the state page for it
 * renders zero projects while still building successfully.
 */
export function stateDisplay(state) {
    return state === "J&K" ? "Jammu & Kashmir" : state;
}

/** State totals, largest first — the "Where we build" bars. */
export function statesByCount() {
    const counts = countBy("state");
    return Object.entries(counts)
        .map(([state, count]) => ({ state: stateDisplay(state), count }))
        .sort((a, b) => b.count - a.count || a.state.localeCompare(b.state));
}

/**
 * URL slug for a state — the /projects/state/[state] segment.
 *
 * Same shape as brandSlug(), and idempotent across the display mapping: both
 * "J&K" and "Jammu & Kashmir" produce "jammu-and-kashmir", so it does not
 * matter which form a caller holds. Verified collision-free across all 16
 * states; re-check if states are added, because two colliding would silently
 * merge two collections into one page rather than erroring.
 */
export function stateSlug(state) {
    return stateDisplay(state || "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/** The statesByCount() entry for a slug, or null. */
export function stateBySlug(slug) {
    return statesByCount().find((s) => stateSlug(s.state) === slug) || null;
}

/**
 * The cities in one state, most projects first — the city lines under the
 * "Where we build" cards and chips.
 *
 * Returns NAMES ONLY, no counts, deliberately: per-state project numbers were
 * removed from that section on 2026-09-17 (see the header of this file), and
 * handing a count back here is how it would quietly return.
 *
 * Accepts either form of the state — raw ("J&K") or display ("Jammu &
 * Kashmir") — because both sides go through stateDisplay(). Comparing a stored
 * value against a displayed one directly matches 15 of 16 states and returns an
 * empty list for the other, with no error.
 */
export function citiesByState(state) {
    const target = stateDisplay(state);
    const counts = new Map();
    for (const p of projectsData) {
        if (stateDisplay(p.state) !== target) continue;
        counts.set(p.city, (counts.get(p.city) || 0) + 1);
    }
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([city]) => city);
}

/**
 * URL slug for a brand name — the /projects/brand/[brand] segment.
 *
 * Derived, never stored: brand names carry "&", apostrophes and spaces
 * ("Beauty & Beard", "Simrann's", "Mam's & Babe's"). Verified collision-free
 * across all 66 brands; re-check with the import script if brands are added,
 * because two brands colliding here would silently merge two collections into
 * one page rather than erroring.
 */
export function brandSlug(brand) {
    return (brand || "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/** The brandsByCount() entry for a slug, or null. */
export function brandBySlug(slug) {
    return brandsByCount().find((b) => brandSlug(b.brand) === slug) || null;
}

/** Brands with their project/city/state spread — the brand wall. */
export function brandsByCount() {
    const byBrand = new Map();
    for (const p of projectsData) {
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

/**
 * Minimum projects for a brand to get its own collection page.
 *
 * 1 = every brand has a page, so every tile on the home brand wall opens that
 * brand. This was 3 (spec section 23, "never create a nearly empty brand
 * collection page"), and the cost was measured on the BUILT home page: of 66
 * tiles only 7 reached a brand page, 10 jumped to a single project and 49
 * landed on the generic /projects index. Clicking Geetanjali worked; most of
 * the wall did nothing brand-specific. Owner's call to open all 66.
 *
 * Raising it again is this one line - brandsWithCollectionPage(), brandHref(),
 * generateStaticParams and sitemap.js all derive from it, and nothing anywhere
 * lists brand names. But see the "See all N" guard in projects/[id]/page.js,
 * which deliberately does NOT follow this constant below 2.
 */
export const BRAND_COLLECTION_MIN = 1;

export function brandsWithCollectionPage() {
    return brandsByCount().filter((b) => b.count >= BRAND_COLLECTION_MIN);
}

/**
 * Where a brand tile should point.
 *
 * At BRAND_COLLECTION_MIN = 1 this is always the brand's own collection page.
 * The fallbacks below are kept for the case where the threshold is raised
 * again: a brand under it goes to its one photographed project, or to the
 * projects index. Never return a brand URL that generateStaticParams does not
 * build - that failure mode is 59 links to a 404, not one.
 */
export function brandHref(entry) {
    if (!entry) return "/projects";
    if (entry.count >= BRAND_COLLECTION_MIN) {
        return `/projects/brand/${brandSlug(entry.brand)}`;
    }
    const withPage = entry.items.find((p) => p.detailSlug);
    return withPage ? `/projects/${withPage.detailSlug}` : "/projects";
}

/**
 * Spec §5 — format distribution for one brand, largest first, with the bar
 * width already worked out as `pct` (share of the LARGEST format, per the
 * spec's `count / maximumFormatCount * 100`, not of the total).
 */
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

/**
 * Spec §6 — group a brand's projects by state, biggest state first, each
 * group keeping the index's newest-first order.
 */
export function groupByState(items) {
    const map = new Map();
    for (const p of items) {
        const state = p.state || "Other";
        if (!map.has(state)) map.set(state, []);
        map.get(state).push(p);
    }
    return [...map.entries()]
        .map(([state, projects]) => ({ state: stateDisplay(state), projects }))
        .sort(
            (a, b) =>
                b.projects.length - a.projects.length ||
                a.state.localeCompare(b.state)
        );
}

/** The six Selected projects — the ones that actually have a photograph. */
export function selectedProjects(limit = 6) {
    return projectsData.filter((p) => p.detailSlug).slice(0, limit);
}
