// Location data for the "Where we build" section — states, their cities, and
// the map dot each city maps to.
//
// ── ONE ARRAY, EVERYTHING ELSE DERIVED ───────────────────────────────────────
// Add or remove a location by editing CITY_COORDS below and nothing else. The
// state list, the ordering, and which cities appear under which state all come
// from lib/data/projectsData.js at render time. CLAUDE.md §7: never hard-code a
// count or a list the data can compute.
//
// ── WHY THERE IS NO HAND-WRITTEN CITY LIST ───────────────────────────────────
// The brief this was built from asked for Manesar, Udaipur, Mumbai, Bengaluru
// and Hyderabad, under states including Karnataka and Telangana. The firm has
// no project in any of those cities, and Karnataka and Telangana are not among
// the 16 states it works in at all. Owner's call (2026-09-17): real locations
// only, derived. A service area the business cannot evidence is a local-SEO
// liability and a false claim on the most-linked page of the site.
//
// The same brief filed Chandigarh under Punjab. In the data Chandigarh is its
// own union territory, and Punjab's cities are Mohali, Ludhiana, Amritsar,
// Zirakpur and Patiala. Deriving avoids that whole class of error.

import { statesByCount, stateSlug, citiesByState } from "../projectStats";
import { CITY_POINTS, STATE_PATHS } from "./indiaMap";

/**
 * Latitude / longitude per city, and the GATE on what appears.
 *
 * A city is shown only if it has an entry here, because every city in this
 * section carries a dot on the map and a dot needs a coordinate. That makes
 * this one map the single place to edit: add "Ghaziabad": [28.6692, 77.4538]
 * and Ghaziabad joins the Uttar Pradesh column and the map together.
 *
 * Keys are the city names EXACTLY as data/projectsData.js spells them — the
 * owner's own spelling, variants included ("Gurgaon", not "Gurugram";
 * "Jhamshedpur", not "Jamshedpur"). A key that does not match a real city is
 * simply never used, silently, so check the spelling against the data.
 *
 * Coordinates are public geographic fact, not business data — they say where
 * the city is, never that we have a project there. The project claim comes
 * from projectsData.js, which is why a city with a coordinate but no project
 * still cannot appear.
 */
const CITY_COORDS = {
    Gurgaon: [28.4595, 77.0266],
    Faridabad: [28.4089, 77.3178],
    "New Delhi": [28.6139, 77.209],
    Noida: [28.5355, 77.391],
    Lucknow: [26.8467, 80.9462],
    Dehradun: [30.3165, 78.0322],
    Haldwani: [29.2183, 79.513],
    Jaipur: [26.9124, 75.7873],
    Alwar: [27.553, 76.6346],
    Ranchi: [23.3441, 85.3096],
    Dhanbad: [23.7957, 86.4304],
    Amritsar: [31.634, 74.8723],
    Ludhiana: [30.901, 75.8573],
    Patna: [25.5941, 85.1376],
};

/** How many states get a column. Eight fills the 4x2 grid the design wants. */
const STATES_SHOWN = 8;

/** Cities per state. Two keeps every column the same height. */
const CITIES_PER_STATE = 2;

export function citySlug(city) {
    return city
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * The states and cities the section renders.
 *
 * `href` defaults to the state's own collection page, NOT "#". The brief asked
 * for "#" as a placeholder, but 14 placeholder anchors on the home page is 14
 * dead controls — the failure this project has hit before (Phase 16.1, the
 * brand tiles). /projects/state/[state] already exists for all 16 states, is
 * static and is in the sitemap, so every city link goes somewhere real today.
 * Pass a per-city `href` in CITY_COORDS' place if city pages are ever built.
 */
export function regions() {
    return statesByCount()
        .slice(0, STATES_SHOWN)
        .map((s) => {
            const href = `/projects/state/${stateSlug(s.state)}`;
            return {
                state: s.state,
                slug: stateSlug(s.state),
                href,
                cities: citiesByState(s.state)
                    .filter((c) => CITY_COORDS[c])
                    .slice(0, CITIES_PER_STATE)
                    .map((city) => {
                        const slug = citySlug(city);
                        return {
                            name: city,
                            slug,
                            href,
                            // Pre-projected in the generated map module, through
                            // the same Mercator fit as the state outlines — the
                            // only reason the dot lands on the right patch of
                            // ground. Never compute this here.
                            point: CITY_POINTS[slug] || null,
                        };
                    }),
            };
        });
}

/** Every plotted city, flattened — the map's dot list. */
export function mappedCities() {
    return regions()
        .flatMap((r) => r.cities.map((c) => ({ ...c, state: r.state })))
        .filter((c) => c.point);
}

/**
 * The states NOT given a column — everything past STATES_SHOWN.
 *
 * These exist so the section can still link them. The grid shows 8 of 16
 * states; the previous design linked all 16, and dropping to 8 orphaned the
 * other 8 state pages from every internal link on the site. They stayed in the
 * sitemap and kept returning 200, so nothing broke visibly — a full crawl fell
 * from 131 reachable pages to 123, which is the only way it showed up.
 *
 * Whatever the section's layout does, SOMETHING here has to link these.
 */
/**
 * Normalised key for matching a state name across two vocabularies.
 *
 * The project data says "J&K"; statesByCount() displays "Jammu & Kashmir"; the
 * map (Natural Earth) says "Jammu and Kashmir". All three have to collapse to
 * one key or the map tints 15 of 16 states and the missing one looks like a
 * gap in coverage rather than a string mismatch — with a green build.
 */
export function stateKey(name) {
    return (name || "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "");
}

/** Internal alias, so the call sites below read as they always did. */
const normState = stateKey;

/**
 * Normalised names of every state with a project — what the map tints.
 *
 * All 16, not just the 8 with a column. The point of the tint is national
 * coverage: 14 dots on an otherwise blank map understates where the firm works,
 * which is the same problem the bar chart had when it showed "Odisha 1".
 *
 * Note this deliberately does NOT include Ladakh. The J&K projects are in
 * Udhampur, Jammu and Srinagar — all in Jammu and Kashmir proper. Natural Earth
 * splits Ladakh out as its own unit, correctly, and tinting it would claim work
 * in a territory the firm has none in.
 */
export function projectStateKeys() {
    return new Set(statesByCount().map((s) => normState(s.state)));
}

/** True if a map feature's name is a state the firm has projects in. */
export function isProjectState(mapName) {
    return projectStateKeys().has(normState(mapName));
}

/**
 * Centre points for states too SMALL to show a fill highlight.
 *
 * Highlighting a state by filling its polygon works for Madhya Pradesh. It does
 * not work for Chandigarh, which is 4.4 x 3.4 user units — about 2 x 2 px at the
 * map's 560px render width. This was rasterised and looked at, not reasoned
 * about: at a 2.2 stroke the highlight is an invisible speck, and at a 5 stroke
 * it is still an invisible speck. A heavier stroke cannot fix a 2px shape, so
 * these states get a ring drawn around them instead — the same locator mark the
 * city dots already use, so it needs no new visual vocabulary.
 *
 * The centre is the bounding-box centre of the ALREADY-PROJECTED path data, not
 * a fresh projection of a lat/long. That distinction matters here: STATE_PATHS
 * and CITY_POINTS are one generated output, and a second projection written by
 * hand would drift away from them the next time the map is regenerated. Reading
 * the paths themselves cannot drift, because it has nothing of its own to drift
 * from.
 *
 * 25 user units (~14px rendered) is the cut-off. It catches Chandigarh today,
 * and Delhi (~18 units) if STATES_SHOWN ever changes and Delhi loses its column.
 */
const SMALL_STATE_MAX = 25;

export const smallStateMarkers = (() => {
    const out = {};
    for (const s of STATE_PATHS) {
        const pts = [...s.d.matchAll(/(-?[\d.]+)\s+(-?[\d.]+)/g)];
        if (!pts.length) continue;
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        for (const m of pts) {
            const x = +m[1];
            const y = +m[2];
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
        if (Math.max(maxX - minX, maxY - minY) > SMALL_STATE_MAX) continue;
        out[stateKey(s.name)] = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
    }
    return out;
})();

export function remainingStates() {
    return statesByCount()
        .slice(STATES_SHOWN)
        .map((s) => ({
            state: s.state,
            slug: stateSlug(s.state),
            href: `/projects/state/${stateSlug(s.state)}`,
            // The normalised name, so hovering one of these links can find its
            // own polygon on the map. It MUST be the same normalisation the
            // tint uses — the three vocabularies ("J&K" / "Jammu & Kashmir" /
            // "Jammu and Kashmir") are exactly why this is a function and not a
            // string comparison.
            key: stateKey(s.state),
        }));
}
