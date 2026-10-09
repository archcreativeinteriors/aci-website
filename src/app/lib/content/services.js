// The service lines — /services, /services/[slug] and the sitemap.

import { cache } from "react";
import { sanityFetch, required } from "./sanity";
import { SERVICES } from "./queries";

/**
 * [{ slug, icon, title, tagline, label, image, description, features[], process[] }]
 * in /services order. `icon` is a key the pages map to a lucide-react icon.
 */
export const getServices = cache(async () =>
    required(await sanityFetch(SERVICES), "Services").map((s) => ({
        ...s,
        tagline: s.tagline || "",
        label: s.label || "",
        features: s.features || [],
        process: s.process || [],
    }))
);

/** One service by slug, or null. */
export async function getService(slug) {
    return (await getServices()).find((s) => s.slug === slug) || null;
}
