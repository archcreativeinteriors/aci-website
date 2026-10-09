// The ONLY place the site talks to Sanity (Phase 6, 2026-09-28).
//
// Every page and component gets its content through the getters in this
// folder (lib/content/index.js); none of them imports a local content file or
// calls Sanity directly. There is no local fallback any more: Sanity is the
// single source, and a build that cannot get its content STOPS with a message
// saying what is missing, rather than publishing a page without it.
//
// ── reads ────────────────────────────────────────────────────────────────────
// Published documents only (`perspective: "published"`), never drafts: what an
// editor has not published does not reach the site. No token: the dataset is
// public, so reads are unauthenticated and nothing secret can end up in a page.
// The write token (SANITY_WRITE_TOKEN) is used only by scripts, never here;
// it must never get a NEXT_PUBLIC_ prefix, which would put it in the browser.
//
// useCdn: false — every query runs at BUILD time for a static page; the CDN
// would only add the chance of building from an answer older than the edit.

import { createClient } from "@sanity/client";

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

// Pinned, not floating: GROQ behaviour is versioned by date, and a floating
// version would let a Sanity release change query results under a build that
// nobody touched.
const API_VERSION = "2024-01-01";

let client = null;

function getClient() {
    if (!PROJECT_ID) {
        throw new Error(
            "NEXT_PUBLIC_SANITY_PROJECT_ID is not set. All of the site's content comes from Sanity " +
                "— set NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET in .env.local " +
                "(or the server's environment) and build again."
        );
    }
    if (!client) {
        client = createClient({
            projectId: PROJECT_ID,
            dataset: DATASET,
            apiVersion: API_VERSION,
            useCdn: false,
            perspective: "published",
        });
    }
    return client;
}

// ── freshness (owner, 2026-10-01) ────────────────────────────────────────────
// Every answer is cached by Next under the tag "sanity". A published change in
// Sanity calls the webhook route app/api/revalidate, which marks that tag
// stale: each page that used Sanity is rebuilt in the background on its next
// visit (stale-while-revalidate). ONE broad tag, on purpose: the project list
// feeds almost every page (the layout's JSON-LD included), and a brand rename
// or a project moving brand / state changes pages the edited document does not
// name — refreshing everything that read Sanity can never miss one.
// REVALIDATE_SECONDS is the fallback if a webhook call is ever missed.
export const SANITY_CACHE_TAG = "sanity";
// `npm run dev` only: 0 = read Sanity fresh on every page load, so a Studio
// edit shows on a plain refresh. There is no webhook on localhost, and the
// dev server keeps its fetch cache ON DISK, so with 3600 here an edit stayed
// invisible for up to an hour, even across restarts (owner, 2026-10-07: "99980
// is in Sanity but the site shows 99979"). `next build` / `next start` and
// Vercel are NODE_ENV=production and keep the hour + the webhook unchanged.
const REVALIDATE_SECONDS = process.env.NODE_ENV === "development" ? 0 : 3600;

/**
 * Run one of the queries in lib/content/queries.js.
 *
 * If Sanity cannot be reached this THROWS and the build fails (owner,
 * 2026-09-25): a build that carried on would publish pages without their
 * content. The message is written for whoever runs the deploy. (During a
 * background revalidation the same error just keeps the previous page.)
 */
export async function sanityFetch(query, params = {}) {
    const c = getClient();
    try {
        return await c.fetch(query, params, {
            next: { tags: [SANITY_CACHE_TAG], revalidate: REVALIDATE_SECONDS },
        });
    } catch (error) {
        throw new Error(
            `Sanity could not be reached (${error.message}). The build was stopped on ` +
                "purpose so no page is published without its content and photos. " +
                "Check the connection and run the build again.",
            { cause: error }
        );
    }
}

/**
 * Stop the build when a document the site cannot do without is missing or
 * incomplete — with the Studio's name for it, so the fix is obvious.
 */
export function required(value, what) {
    if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
        throw new Error(
            `Sanity: ${what} is missing or incomplete. Fill it in and publish it in the Studio, then build again.`
        );
    }
    return value;
}

export { PROJECT_ID as SANITY_PROJECT_ID, DATASET as SANITY_DATASET };
