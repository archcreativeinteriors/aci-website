// The /clients logo wall — the "Client logos" document, in rows.

import { cache } from "react";
import { sanityFetch, required } from "./sanity";
import { CLIENT_LOGOS } from "./queries";

// styles/clients-page.css styles rows of 1-4 tiles (data-cols 1-4); nothing wider.
const LOGOS_PER_ROW_MAX = 4;

/**
 * [[{ src, width, height, name, wide? }]] — rows are layout (see
 * sanity/schemas/clientLogos.js). `src` is a FIRST-PARTY /_next/image URL:
 * the page renders a plain <img>, and a cdn.sanity.io URL would make the
 * visitor's browser contact Sanity (components/SanityImage.jsx).
 * w=828 is one of next.config.mjs deviceSizes; q=90 keeps thin lettering
 * sharp. Both must be allowed in next.config.mjs or the request is a 400.
 */
export const getClientLogoRows = cache(async () => {
    const doc = required(await sanityFetch(CLIENT_LOGOS), "Client logos");
    const rows = [];
    for (const row of doc.rows || []) {
        const logos = (row?.logos || [])
            .filter((l) => l && l.url && l.width && l.height)
            .map((l) => ({
                src: `/_next/image?url=${encodeURIComponent(l.url.split("?")[0])}&w=828&q=90`,
                width: l.width,
                height: l.height,
                name: l.name || "Client",
                ...(l.wide ? { wide: true } : {}),
            }));
        // Defensive only — the Studio already limits a row to 4.
        for (let i = 0; i < logos.length; i += LOGOS_PER_ROW_MAX) rows.push(logos.slice(i, i + LOGOS_PER_ROW_MAX));
    }
    return required(rows, "Client logos → at least one logo");
});

/** Alt text for a logo: its name as read off the artwork. */
export function clientLogoAlt(logo) {
    return `${logo.name} logo`;
}
