// The "Where we build" section's states and cities — DERIVED from the Sanity
// projects (Phase 6; this was lib/data/locations.js). The map geometry and the
// city coordinates are code, in lib/map/.
//
// Owner's call (2026-09-17): real locations only, derived — no hand-written
// city list. A service area the business cannot evidence is a local-SEO
// liability and a false claim.

import { cache } from "react";
import { getStats } from "./projects";
import { stateSlug } from "./stats";
import { CITY_COORDS, citySlug, stateKey } from "../map/geo";
import { CITY_POINTS } from "../map/indiaMap";

/** How many states get a column (the 4x2 grid), and cities per state. */
const STATES_SHOWN = 8;
const CITIES_PER_STATE = 2;

/**
 * Everything the section renders, computed on the server and handed to the
 * client component as plain data:
 *   regions        the 8 columns: { state, slug, href, cities: [{ name, slug, href, point }] }
 *   mappedCities   every plotted city, flattened — the map's dots
 *   remainingStates the states past the 8 columns — "Also delivering in …"
 *                  (without this line 8 state pages lose every internal link)
 *   projectStateKeys every state with a project, normalised — what the map tints
 */
export const getLocations = cache(async () => {
    const stats = await getStats();
    const states = stats.statesByCount();

    const regions = states.slice(0, STATES_SHOWN).map((s) => {
        const href = `/projects/state/${stateSlug(s.state)}`;
        return {
            state: s.state,
            slug: stateSlug(s.state),
            href,
            cities: stats
                .citiesByState(s.state)
                .filter((c) => CITY_COORDS[c])
                .slice(0, CITIES_PER_STATE)
                .map((city) => {
                    const slug = citySlug(city);
                    // Pre-projected with the state outlines — never compute here.
                    return { name: city, slug, href, point: CITY_POINTS[slug] || null };
                }),
        };
    });

    return {
        regions,
        mappedCities: regions.flatMap((r) => r.cities.map((c) => ({ ...c, state: r.state }))).filter((c) => c.point),
        remainingStates: states.slice(STATES_SHOWN).map((s) => ({
            state: s.state,
            slug: stateSlug(s.state),
            href: `/projects/state/${stateSlug(s.state)}`,
            key: stateKey(s.state),
        })),
        projectStateKeys: states.map((s) => stateKey(s.state)),
    };
});
