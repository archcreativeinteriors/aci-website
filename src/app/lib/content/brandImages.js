// A brand's photographs — the ONE place that decides whether a brand "has
// photos" (owner, 2026-10-01).
//
// SANITY IS THE ONLY SOURCE (owner, 2026-09-25 / 2026-10-01). Nothing here
// reads the filesystem, so it works the same in a local build, on Vercel and
// after an on-demand revalidation: add a photo in the Studio (or with
// `npm run photos:upload`), publish, and every caller below updates on its own.
//
// A brand's photos are the main photographs of its projects that the site can
// SHOW: a project with a published page and a main photo (getProjects() only
// carries `heroImage` for those). Newest project first, one entry per image
// asset. The cover is the newest — the same photo the home preview has always
// used. Never another brand's photo: a brand with none gets BrandPlaceholder.
//
// Everything is keyed by brandSlug() — the slug in /projects/brand/[slug].

import { cache } from "react";
import { getProjects } from "./projects";
import { brandSlug } from "./stats";

/** Map brandSlug -> { images: [Sanity image, newest first], hasPage } for every brand. */
const getBrandPhotoIndex = cache(async () => {
    const index = new Map();
    for (const p of await getProjects()) {
        if (!p.brand) continue;
        const slug = brandSlug(p.brand);
        if (!index.has(slug)) index.set(slug, { images: [], seen: new Set(), hasPage: false });
        const entry = index.get(slug);
        if (p.linkable) entry.hasPage = true;
        const url = p.heroImage?.url;
        if (url && !entry.seen.has(url)) {
            entry.seen.add(url);
            entry.images.push(p.heroImage);
        }
    }
    return index;
});

/** The brand's photographs, newest project first ([] when it has none). */
export async function getBrandImages(slug) {
    return (await getBrandPhotoIndex()).get(slug)?.images ?? [];
}

/** Whether the site has at least one photograph to show for the brand. */
export async function hasPhotos(slug) {
    return (await getBrandImages(slug)).length > 0;
}

/** The brand's cover photograph (its newest), or null. */
export async function getCoverImage(slug) {
    return (await getBrandImages(slug))[0] ?? null;
}

/**
 * Whether the brand page should be indexed and listed in sitemap.xml: it has
 * photographs, or at least one project page. A brand with neither is a page
 * with nothing on it yet — noindex until a photo arrives (owner, 2026-10-01).
 */
export async function isBrandIndexable(slug) {
    const entry = (await getBrandPhotoIndex()).get(slug);
    return Boolean(entry && (entry.images.length > 0 || entry.hasPage));
}
