// The read client for the Sanity content lake.
//
// Pairs with lib/cms/queries.js (the GROQ projections) and lib/cms/image.js (the
// image CDN loader). Those two were written first and describe WHAT to fetch
// and how to render it; this is the thing that actually runs a query.
//
// ── the fallback is the point ────────────────────────────────────────────────
// `isSanityConfigured()` exists so the site keeps building with an empty
// NEXT_PUBLIC_SANITY_PROJECT_ID. projectSource.js branches on it: no project id
// means keep reading data/projectsData.js exactly as today. That is what lets
// the migration happen one surface at a time instead of as a cutover, and it
// means a missing env var on the VPS degrades to "the site builds from local
// data" rather than "the build fails" or, worse, "59 pages render empty".
//
// ── credentials ──────────────────────────────────────────────────────────────
// NO TOKEN IS READ HERE, deliberately. The dataset is public, so reads are
// unauthenticated — which is also what lets cdn.sanity.io serve the images
// unsigned (lib/cms/image.js depends on that). The only token in this project
// is SANITY_WRITE_TOKEN, used by sanity/scripts/import.js and never by the app.
// If a read token ever becomes necessary it must NOT carry a NEXT_PUBLIC_
// prefix; that would inline it into the client bundle.

import { createClient } from "@sanity/client";

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

// Pinned, not floating. GROQ behaviour is versioned by date; "v1"/undefined
// tracks the newest API and would let a Sanity release change query results
// under a build that nobody touched.
const API_VERSION = "2024-01-01";

/**
 * True once a project id is set. Every consumer must check this before calling
 * sanityFetch — see the header.
 */
export function isSanityConfigured() {
    return Boolean(PROJECT_ID);
}

let client = null;

function getClient() {
    if (!PROJECT_ID) {
        throw new Error(
            "NEXT_PUBLIC_SANITY_PROJECT_ID is not set. Guard the call with " +
                "isSanityConfigured() — the site is designed to fall back to the " +
                "local data modules, not to fail."
        );
    }
    if (!client) {
        client = createClient({
            projectId: PROJECT_ID,
            dataset: DATASET,
            apiVersion: API_VERSION,
            // false, because every query here runs at BUILD time for a static
            // page. The CDN is the cheaper, cached path for request-time reads;
            // at build time it only buys the chance of prerendering content the
            // editor already replaced. There is no per-request traffic to save.
            useCdn: false,
            perspective: "published",
        });
    }
    return client;
}

/**
 * Run one of the projections from lib/cms/queries.js.
 *
 * Returns `fallback` (default null) when Sanity is not configured, so a caller
 * can write the swap as a single line without a try/catch around every query.
 *
 * When Sanity IS configured but cannot be reached, this THROWS, and the build
 * fails (owner, 2026-09-25): project photos live only in Sanity, so a build
 * that carried on would publish pages without them. The message says so in
 * plain words, because it is what the person running the deploy will read.
 */
export async function sanityFetch(query, params = {}, fallback = null) {
    if (!isSanityConfigured()) return fallback;
    try {
        return await getClient().fetch(query, params);
    } catch (error) {
        throw new Error(
            `Sanity could not be reached (${error.message}). The build was stopped on ` +
                "purpose so no page is published without its content and photos. " +
                "Check the connection and run the build again.",
            { cause: error }
        );
    }
}

export { PROJECT_ID as SANITY_PROJECT_ID, DATASET as SANITY_DATASET };
