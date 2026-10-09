// One image from either source a lib/*Source.js module can return:
//
//   Sanity  { url, lqip, width, height, alt }  -> <SanityImage> (via /_next/image, LQIP blur)
//   local   static import                      -> <Image placeholder="blur">
//   local   "/images/…" path string            -> <Image>, no placeholder
//
// The caller decides `alt` (an editor's alt text, a composed one, or "" for a
// decorative image) and passes every other next/image prop straight through.
// Server Component; SanityImage is the client leaf, as everywhere else.

import Image from "next/image";
import SanityImage from "./SanityImage";

export default function CmsImage({ image, alt = "", ...props }) {
    if (!image) return null;

    if (image.url) return <SanityImage image={image} alt={alt} {...props} />;

    const blur = typeof image === "object" && image.blurDataURL ? { placeholder: "blur" } : {};
    return <Image src={image} alt={alt} {...blur} {...props} />;
}
