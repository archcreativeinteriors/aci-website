// The ONE module that knows where the home hero comes from — the hero
// equivalent of projectSource.js / teamSource.js.
//
// Sanity first: once NEXT_PUBLIC_SANITY_PROJECT_ID is set, this runs HOME_HERO
// from lib/cms/queries.js against the `homeHero` singleton. Until then — and
// whenever that document is missing or incomplete — it returns
// lib/data/hero.js, which is what the site renders today.
//
// ALL OR NOTHING, on purpose. A half-filled Sanity document (say, a new heading
// but only two photographs) falls back to the local hero as a whole rather than
// mixing the two: the cross-fade needs exactly four slides, and a Sanity
// heading over local photographs would be a combination nobody approved. The
// Studio's validation blocks publishing such a document anyway; this is the
// second line of defence.
//
// Shape returned either way:
//   { eyebrow, heading, paragraph, slides: [{ image, alt }] x4, mobileImage: { image, alt } }
// where `image` is a static import (local) or a { url, lqip, … } object
// (Sanity) — components/CmsImage.jsx renders both.

import { sanityFetch } from "./cms/client";
import { HOME_HERO } from "./cms/queries";
import { hero as localHero } from "./data/hero";
import { brandsByCount } from "./projectStats";

const SLIDE_COUNT = 4;

/**
 * Fill {rolloutSpaces} / {rolloutStates} from the project data. Keep this list
 * equal to TOKENS in sanity/schemas/homeHero.js, which rejects any other.
 *
 * CLAUDE.md: derive, never write a number down. This sentence read "a 99-space
 * rollout across sixteen states" — the demo dataset's figure — until it was
 * derived; /about derives the same sentence from brandsByCount()[0].
 */
function fillTokens(text) {
    const top = brandsByCount()[0];
    const values = { rolloutSpaces: top.count, rolloutStates: top.states };
    return (text || "").replace(/\{(\w+)\}/g, (match, key) =>
        key in values ? String(values[key]) : match
    );
}

function fromSanity(doc) {
    const slides = Array.isArray(doc?.slides) ? doc.slides.filter((s) => s && s.url) : [];
    if (!doc || !doc.heading || !doc.paragraph || slides.length !== SLIDE_COUNT || !doc.mobileImage?.url) {
        return null;
    }
    // The first slide and the mobile photo are the LCP images and are
    // announced; an editor who left one alt blank gets the other's, then a
    // generic description, rather than an unlabelled hero.
    const mainAlt =
        slides[0].alt || doc.mobileImage.alt || "Interior by Arch Creative Interiors";
    return {
        eyebrow: doc.eyebrow || "",
        heading: doc.heading,
        paragraph: doc.paragraph,
        slides: slides.map((s, i) => ({ image: s, alt: i === 0 ? mainAlt : "" })),
        mobileImage: { image: doc.mobileImage, alt: doc.mobileImage.alt || mainAlt },
    };
}

/** The home hero, with its paragraph's placeholders filled in. */
export async function getHomeHero() {
    const hero = fromSanity(await sanityFetch(HOME_HERO)) || localHero;
    return { ...hero, paragraph: fillTokens(hero.paragraph) };
}
