"use client";

// Renders a Sanity-hosted image through next/image.
//
// FIRST-PARTY, on purpose (owner, 2026-09-25). The image goes through Next's
// own optimizer — the browser asks /_next/image on our domain, our server
// fetches the original from cdn.sanity.io — so a visitor's browser never
// contacts Sanity. That keeps the privacy policy's "images are served from our
// own website, no third party" true and keeps images outside the consent gate.
// Do NOT hand next/image a Sanity `loader` here: that would point the <img> at
// cdn.sanity.io directly. (next.config.mjs allows cdn.sanity.io/images/** in
// `remotePatterns` with NO query string, so pass the bare base URL.)
//
// It stays a client leaf only for continuity; it is still server-rendered, so
// the <img> is in the SSR HTML and costs nothing for SEO.

import Image from "next/image";
import { sanityImageBase, sanityImageDimensions } from "../lib/content/image";

export default function SanityImage({ image, alt, fill, width, height, ...props }) {
    const src = sanityImageBase(image);
    if (!src) return null;

    // Sanity stores a base64 LQIP on every asset. It is the drop-in replacement
    // for the blur placeholders we get free from static imports today — without
    // it, migrating an image off `public/` silently loses its placeholder.
    //
    // BOTH shapes are read on purpose. The projections in lib/content/queries.js
    // FLATTEN it (`"lqip": asset->metadata.lqip`), so a queried image is
    // `{ url, lqip, width, height, alt }` — reading only `asset.metadata.lqip`
    // resolved undefined for every one of them and fell back to
    // `placeholder="empty"`, silently, with a green build. The nested form is
    // what a raw document or a `asset->{...}` projection gives back.
    const lqip = image?.lqip ?? image?.asset?.metadata?.lqip;

    // Intrinsic size comes from the filename, so a non-`fill` image still
    // reserves the right box and contributes no CLS.
    const intrinsic = fill ? null : sanityImageDimensions(image);

    return (
        <Image
            src={src}
            alt={alt ?? ""}
            fill={fill}
            width={fill ? undefined : (width ?? intrinsic?.width)}
            height={fill ? undefined : (height ?? intrinsic?.height)}
            placeholder={lqip ? "blur" : "empty"}
            blurDataURL={lqip}
            {...props}
        />
    );
}
