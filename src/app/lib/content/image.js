// Sanity image URLs — the helpers every image from Sanity goes through.
// (Moved from lib/cms/image.js in Phase 6, 2026-09-28.)
//
// ── images the VISITOR loads are first-party (owner, 2026-09-25) ────────────
// Sanity images reach the browser through our own /_next/image, so a visitor
// never contacts cdn.sanity.io and the privacy policy's "no third party for
// images" stays true. components/SanityImage.jsx passes the BASE URL to
// next/image; previewUrl() and the client logo wall build /_next/image URLs.
//
// sanityImageLoader() / shareImageUrl() are only for URLs that CRAWLERS fetch
// (og:image, JSON-LD) — never put one on an <img>.

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export const SANITY_CDN_HOST = "cdn.sanity.io";

/**
 * A Sanity asset reference -> its CDN base URL (no query string).
 * `image-Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000-jpg` maps to
 * `https://cdn.sanity.io/images/<project>/<dataset>/<id>-<w>x<h>.<ext>` — the
 * URL is content-addressed, so an edited photo gets a new one.
 */
export function assetRefToUrl(ref) {
    if (typeof ref !== "string" || !ref.startsWith("image-")) return null;

    const [, id, dimensions, extension] = ref.split("-");
    if (!id || !dimensions || !extension) return null;

    if (!PROJECT_ID) {
        throw new Error("NEXT_PUBLIC_SANITY_PROJECT_ID is not set — cannot build a Sanity image URL.");
    }

    return `https://${SANITY_CDN_HOST}/images/${PROJECT_ID}/${DATASET}/${id}-${dimensions}.${extension}`;
}

/**
 * The base URL from whatever shape a query returned:
 * a url string, `{ url }`, `{ asset: { url } }` or `{ asset: { _ref } }`.
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

/** A sized cdn.sanity.io URL. For crawler-facing URLs only (see the header). */
export function sanityImageLoader({ src, width, quality }) {
    const params = new URLSearchParams({
        w: String(width),
        q: String(quality || 75),
        auto: "format",
        fit: "max",
    });
    return `${src}?${params}`;
}

/** The og:image / JSON-LD URL for a Sanity image, or `fallback` when there is none. */
export function shareImageUrl(image, fallback = "/og-image-landscape.jpg") {
    const base = sanityImageBase(image);
    return base ? sanityImageLoader({ src: base, width: 1200, quality: 80 }) : fallback;
}

/**
 * Small first-party URL for the /projects hover preview (~640px wide).
 * q=75: Next 16 answers any quality not in next.config.mjs `images.qualities`
 * with a 400.
 */
export function previewUrl(image) {
    const base = sanityImageBase(image);
    return base ? `/_next/image?url=${encodeURIComponent(base)}&w=640&q=75` : null;
}

/**
 * Full-size, first-party URLs for the photo viewer on /projects/[id]
 * (components/PhotoLightbox.jsx), or null when the image has no URL.
 * `src` (1920 wide) is also the plain link target, so a visitor without JS
 * still opens the full photo. Every width must be in next.config.mjs
 * `deviceSizes` and the quality in `images.qualities`, or Next answers 400.
 * The optimizer never enlarges, so a smaller original is served as it is.
 */
const ZOOM_WIDTHS = [1080, 1920, 2048];

export function zoomPhoto(image, alt = "") {
    const base = sanityImageBase(image);
    if (!base) return null;
    const at = (w) => `/_next/image?url=${encodeURIComponent(base)}&w=${w}&q=75`;
    const size = sanityImageDimensions(image);
    return {
        src: at(1920),
        srcSet: ZOOM_WIDTHS.map((w) => `${at(w)} ${w}w`).join(", "),
        alt,
        width: size?.width ?? null,
        height: size?.height ?? null,
    };
}

/**
 * Intrinsic dimensions: the width/height the queries ask for
 * (`asset->metadata.dimensions`), else parsed from the content-addressed file
 * name (`-<w>x<h>.<ext>`). Either way next/image can reserve the box.
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
