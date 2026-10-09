// Sanity image CDN — URL builder + a next/image loader.
//
// ── 2026-09-25: images the VISITOR loads are first-party ─────────────────────
// The owner chose to serve Sanity images through our own /_next/image, so a
// visitor's browser never contacts cdn.sanity.io and the privacy policy's "no
// third party for images" stays true. components/SanityImage.jsx therefore
// no longer uses sanityImageLoader(); the client logo wall and the project
// hover preview build /_next/image URLs too. sanityImageLoader() is now only
// for URLs that CRAWLERS fetch, never a browser: the /about og:image. Do not
// put it back on an <img>. The reasoning below is the original, Vercel-cost
// case for the direct CDN — worth re-weighing only together with the privacy
// policy and lib/consent.js if the site moves to Vercel.
//
// Why a custom loader at all: on Vercel, every distinct (image, width, format)
// that goes through the DEFAULT loader is a billed Image Transformation. At the
// planned ~1,500 project photos x ~4 widths that is ~6,000 transformations just
// to warm the cache once, before any real traffic. Sanity's CDN does the same
// resizing as part of the plan we are already paying nothing for, so we point
// next/image at it and Vercel optimizes nothing.
//
// IMPORTANT: this is deliberately NOT wired up as `images.loaderFile` in
// next.config.mjs. That setting is global and would also be handed the
// `/_next/static/media/...` paths of our 47 statically-imported images
// (projects.js, blogs.js, services.js, about/page.js), producing broken URLs.
// Use it per-instance via <SanityImage>, so local and Sanity images coexist
// for as long as the migration takes.

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export const SANITY_CDN_HOST = "cdn.sanity.io";

/**
 * Turn a Sanity asset reference into its CDN base URL (no query string).
 *
 * A ref looks like `image-Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000-jpg`, which maps to
 * `https://cdn.sanity.io/images/<project>/<dataset>/<id>-<w>x<h>.<ext>`.
 * The dimensions are part of the filename, so the URL is content-addressed —
 * re-uploading an edited photo yields a new URL, which is what lets us cache
 * these at the edge indefinitely.
 */
export function assetRefToUrl(ref) {
    if (typeof ref !== "string" || !ref.startsWith("image-")) return null;

    const [, id, dimensions, extension] = ref.split("-");
    if (!id || !dimensions || !extension) return null;

    if (!PROJECT_ID) {
        throw new Error(
            "NEXT_PUBLIC_SANITY_PROJECT_ID is not set — cannot build a Sanity image URL."
        );
    }

    return `https://${SANITY_CDN_HOST}/images/${PROJECT_ID}/${DATASET}/${id}-${dimensions}.${extension}`;
}

/**
 * Accepts whatever shape the GROQ query returned and gives back the base URL:
 *   - a resolved url string (`asset->{url}`)
 *   - `{ asset: { url } }`
 *   - `{ asset: { _ref } }` (an unresolved reference)
 */
export function sanityImageBase(source) {
    if (!source) return null;
    if (typeof source === "string") {
        return source.startsWith("http") ? source.split("?")[0] : assetRefToUrl(source);
    }
    const asset = source.asset || source;
    if (asset.url) return asset.url.split("?")[0];
    if (asset._ref) return assetRefToUrl(asset._ref);
    return null;
}

/**
 * next/image loader. `src` is the base CDN URL from sanityImageBase().
 * `auto=format` content-negotiates AVIF/WebP, which is what the
 * `images.formats` setting in next.config.mjs buys us for local images.
 */
export function sanityImageLoader({ src, width, quality }) {
    const params = new URLSearchParams({
        w: String(width),
        q: String(quality || 75),
        auto: "format",
        fit: "max",
    });
    return `${src}?${params}`;
}

/**
 * Intrinsic dimensions — no extra query needed.
 *
 * Prefers the explicit width/height the projections in lib/cms/queries.js ask for
 * (`asset->metadata.dimensions`), and falls back to parsing them out of the
 * filename, which works because Sanity asset URLs are content-addressed and
 * carry `-<w>x<h>` before the extension. Either way next/image can reserve the
 * box, which is what keeps 192 cards from shifting on load.
 */
export function sanityImageDimensions(source) {
    if (source && Number(source.width) > 0 && Number(source.height) > 0) {
        return { width: Number(source.width), height: Number(source.height) };
    }
    const base = sanityImageBase(source);
    const match = base && base.match(/-(\d+)x(\d+)\.\w+$/);
    if (!match) return null;
    return { width: Number(match[1]), height: Number(match[2]) };
}
