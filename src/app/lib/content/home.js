// Home-page content: the hero and the "What we do" cards. (Selected projects
// are in projects.js; testimonials in people.js.)

import { cache } from "react";
import { sanityFetch, required } from "./sanity";
import { HOME_HERO, HOME_PAGE } from "./queries";
import { getStats } from "./projects";

const SLIDE_COUNT = 4;

/**
 * { eyebrow, heading, paragraph, slides: [{ image, alt }] x4, mobileImage: { image, alt } }
 *
 * The paragraph's {rolloutSpaces} / {rolloutStates} are filled from the
 * largest client rollout (derived — CLAUDE.md: never write a number down).
 * Keep that list equal to TOKENS in sanity/schemas/homeHero.js.
 */
export const getHomeHero = cache(async () => {
    const doc = required(await sanityFetch(HOME_HERO), "Home hero");
    const slides = (doc.slides || []).filter((s) => s && s.url);
    required(doc.heading, "Home hero → heading");
    required(doc.paragraph, "Home hero → paragraph");
    if (slides.length !== SLIDE_COUNT) required(null, `Home hero → exactly ${SLIDE_COUNT} slides (it has ${slides.length})`);
    required(doc.mobileImage?.url, "Home hero → mobile image");

    // The first slide and the mobile photo are the LCP images and are
    // announced; a blank alt borrows the other's, then a generic description.
    const mainAlt = slides[0].alt || doc.mobileImage.alt || "Interior by Arch Creative Interiors";

    const top = (await getStats()).brandsByCount()[0];
    const values = { rolloutSpaces: top.count, rolloutStates: top.states };
    // No numbers on the site (owner, 2026-10-01). The Sanity text reads
    // "…to a {rolloutSpaces}-space national rollout across {rolloutStates}
    // states."; the "N-space " and " across N states" are dropped here, in
    // code, so the Sanity document is untouched: "…to a national rollout."
    // Once the text is edited in Sanity these lines simply have nothing to match.
    const paragraph = doc.paragraph
        .replace(/\{rolloutSpaces\}-space\s+/g, "")
        .replace(/\s+across \{rolloutStates\} states/g, "")
        .replace(/\{(\w+)\}/g, (match, key) => (key in values ? String(values[key]) : match));

    return {
        eyebrow: doc.eyebrow || "",
        heading: doc.heading,
        paragraph,
        slides: slides.map((s, i) => ({ image: s, alt: i === 0 ? mainAlt : "" })),
        mobileImage: { image: doc.mobileImage, alt: doc.mobileImage.alt || mainAlt },
    };
});

/** { whatWeDo: [{ title, body, sector, href }] } — the "Home page" document. */
export const getHomePage = cache(async () => {
    const doc = required(await sanityFetch(HOME_PAGE), "Home page (What we do)");
    required(doc.whatWeDo, "Home page → What we do cards");
    return { whatWeDo: doc.whatWeDo };
});
