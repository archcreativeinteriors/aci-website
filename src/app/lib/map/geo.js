// Geography for the "Where we build" map — code, not content (Phase 6,
// 2026-09-28: split out of lib/data/locations.js). Which states and cities
// the map SHOWS comes from the Sanity projects (lib/content/locations.js);
// this file only knows where places are. Safe to import in the browser.

import { STATE_PATHS } from "./indiaMap";

/**
 * Latitude / longitude per city — and the GATE on which cities the map shows:
 * a city appears only if it has an entry here AND a project there. Keys are
 * the city names EXACTLY as the projects spell them ("Gurgaon", not
 * "Gurugram"; "Jhamshedpur"). A key that matches no project is simply unused.
 * Coordinates are public geographic fact, not a claim of work.
 */
export const CITY_COORDS = {
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

export function citySlug(city) {
    return city
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * Normalised key for matching a state across three vocabularies: the projects
 * say "J&K", the site displays "Jammu & Kashmir", the map (Natural Earth) says
 * "Jammu and Kashmir". All three collapse to one key, or the map tints 15 of
 * 16 states with a green build.
 */
export function stateKey(name) {
    return (name || "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "");
}

/**
 * Centre points for states too SMALL to show a fill highlight (Chandigarh is
 * ~2x2 px at the map's render width) — they get a ring instead. Read from the
 * already-projected STATE_PATHS so it can never drift from the outlines.
 * 25 user units (~14px rendered) is the cut-off.
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
