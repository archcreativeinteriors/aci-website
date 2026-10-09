// The home hero's LCP photograph, art-directed: the portrait photo on a phone,
// the first wide slide from 768px up. A plain Server Component.
//
// WHY A <picture>, AND WHY THE SAME ONE TWICE (perf, 2026-09-29). HomeHero
// has two slots — the first slide (shown from 768px) and the mobile hero
// (shown below it) — and CSS hides one of them. A hidden <img> still
// downloads, so with two plain images every visit fetched BOTH photos: a
// phone paid 18 KB for the wide slide, a desktop 24 KB for the portrait, and
// on a phone that extra request raced the hero it was hiding behind.
// Rendering this identical <picture> in both slots makes each device resolve
// both to the SAME URL (same sources, same sizes, same screen), and the
// browser fetches a URL once. So each device downloads only its own photo.
// Keep the two slots' props identical except `alt` and `blurFrom`, or that
// guarantee is gone.
//
// PRIORITY: `fetchPriority="high"` + eager, and no preload link — Next 16
// deprecated `priority` (which only preloaded, at low priority) and its docs
// recommend fetchPriority for the LCP image. This is the ONLY image on the
// site with high priority; everything else loads normally.
//
// Images go through our own /_next/image (the default loader), never to
// cdn.sanity.io directly — the privacy policy says so (see SanityImage.jsx).

import { getImageProps } from "next/image";
import { sanityImageBase } from "../../lib/content/image";

// Below this width the portrait photo is shown. The same line as the header
// and as `.xheroImg` / `.xheroMob` in styles/home.css.
const MOBILE_MAX = 767;

export default function HeroPicture({ wide, portrait, alt, blurFrom }) {
    const common = {
        alt,
        fill: true,
        sizes: "100vw",
        loading: "eager",
        fetchPriority: "high",
    };
    const {
        props: { srcSet: portraitSrcSet },
    } = getImageProps({ ...common, src: sanityImageBase(portrait) });

    const lqip = blurFrom?.lqip ?? blurFrom?.asset?.metadata?.lqip;
    const { props } = getImageProps({
        ...common,
        src: sanityImageBase(wide),
        ...(lqip ? { placeholder: "blur", blurDataURL: lqip } : {}),
    });

    return (
        <picture>
            <source media={`(max-width: ${MOBILE_MAX}px)`} srcSet={portraitSrcSet} sizes="100vw" />
            {/* A plain <img>: getImageProps() supplies src, srcSet, alt and the
                fill styles, all pointing at /_next/image. */}
            <img {...props} style={{ ...props.style, objectFit: "cover" }} />
        </picture>
    );
}
