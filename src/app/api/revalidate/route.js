// POST /api/revalidate — the Sanity webhook (owner, 2026-10-01).
//
// Sanity calls this when a document is created, updated or deleted. The
// request must carry a valid `sanity-webhook-signature` (HMAC-SHA256 of the
// body with SANITY_REVALIDATE_SECRET, checked by @sanity/webhook) made within
// the last 5 minutes; anything else is refused and changes nothing.
//
// What it refreshes: every page that read Sanity. All Sanity answers share
// one cache tag (lib/content/sanity.js — SANITY_CACHE_TAG explains why one);
// marking it stale with the "max" profile means each page is rebuilt in the
// background on its next visit — home, /projects, the brand / project / state
// pages (the OLD brand and state too, when a project moved or was deleted),
// sitemap.xml. Nothing is rebuilt all at once.
//
// Setup (webhook URL, events, projection, secret): docs/vercel-deploy.md.

import { revalidatePath, revalidateTag } from "next/cache";
import { decodeSignatureHeader, isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { SANITY_CACHE_TAG } from "../../lib/content/sanity";

// A signature older than this is refused, so a captured request cannot be
// replayed later.
const MAX_AGE_MS = 5 * 60 * 1000;

const refuse = (status, message) => Response.json({ revalidated: false, message }, { status });

export async function POST(request) {
    const secret = process.env.SANITY_REVALIDATE_SECRET;
    if (!secret) return refuse(500, "SANITY_REVALIDATE_SECRET is not set on the server.");

    const signature = request.headers.get(SIGNATURE_HEADER_NAME);
    if (!signature) return refuse(401, "Unsigned request.");

    // The signature covers the exact bytes Sanity sent, so read the raw body.
    const body = await request.text();

    let timestamp;
    try {
        ({ timestamp } = decodeSignatureHeader(signature));
    } catch {
        return refuse(401, "Malformed signature.");
    }
    if (Math.abs(Date.now() - timestamp) > MAX_AGE_MS) return refuse(401, "Signature too old.");
    if (!(await isValidSignature(body, signature, secret))) return refuse(401, "Invalid signature.");

    let doc = null;
    try {
        doc = JSON.parse(body);
    } catch {
        return refuse(400, "Body is not JSON.");
    }

    revalidateTag(SANITY_CACHE_TAG, "max");
    // The sitemap reads Sanity too (so the tag covers it); named as well, so it
    // is refreshed even if it was ever cached without the tag.
    revalidatePath("/sitemap.xml");

    return Response.json({ revalidated: true, type: doc?._type ?? null, id: doc?._id ?? null, now: Date.now() });
}
