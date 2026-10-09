// Page content: /about (intro, process stages, FAQs), /costing and the two
// legal pages.

import { cache } from "react";
import { SITE_NAME } from "../site";
import { sanityFetch, required } from "./sanity";
import { ABOUT_PAGE, FAQS, COSTING_PAGE, LEGAL_PAGE } from "./queries";
import { getStats } from "./projects";
import { getSiteSettings } from "./settings";

// Placeholders the /about paragraphs may carry — keep equal to TOKENS in
// sanity/schemas/aboutPage.js, which rejects any other.
const ABOUT_TOKENS = ["rolloutSpaces", "rolloutBrand", "rolloutStates"];

/**
 * The /about page document:
 *   { heading, image, imageAlt, sectionHeading, paragraphs[], processStages: [{ label, title, text }] }
 * The paragraphs come back with {rolloutSpaces} / {rolloutBrand} /
 * {rolloutStates} filled from the largest client rollout (derived).
 */
export const getAboutPage = cache(async () => {
    const doc = required(await sanityFetch(ABOUT_PAGE), "About page");
    const paragraphs = (doc.paragraphs || []).filter((p) => typeof p === "string" && p.trim());
    required(doc.heading, "About page → page heading");
    required(doc.image?.url, "About page → photograph");
    required(doc.sectionHeading, "About page → heading beside the photo");
    required(paragraphs, "About page → paragraphs");
    required(doc.processStages, "About page → how a project runs (stages)");

    const top = (await getStats()).brandsByCount()[0];
    const values = { rolloutSpaces: top.count, rolloutBrand: top.brand, rolloutStates: top.states };
    // No numbers on the site (owner, 2026-10-01). The Sanity text reads
    // "…runs a {rolloutSpaces}-space {rolloutBrand} rollout across
    // {rolloutStates} states: …"; the count becomes "nationwide" and the state
    // count is dropped here, in code, so the Sanity document is untouched:
    // "…runs a nationwide Geetanjali rollout: …".
    const fill = (t) =>
        t
            .replace(/\{rolloutSpaces\}-space\b/g, "nationwide")
            .replace(/\s+across \{rolloutStates\} states/g, "")
            .replace(/\{(\w+)\}/g, (match, key) => (ABOUT_TOKENS.includes(key) ? String(values[key]) : match));

    return {
        heading: doc.heading,
        image: doc.image,
        imageAlt: doc.image.alt || "",
        sectionHeading: doc.sectionHeading,
        paragraphs: paragraphs.map(fill),
        processStages: doc.processStages,
    };
});

/** [{ q, a }] in display order — /about and its FAQPage JSON-LD. */
export const getFaqs = cache(async () => ((await sanityFetch(FAQS)) || []).filter((f) => f && f.q && f.a));

/** /costing: { eyebrow, heading, intro, price, unit, note, includesHeading, includes[] } */
export const getCostingPage = cache(async () => {
    const doc = required(await sanityFetch(COSTING_PAGE), "Costing page");
    for (const f of ["heading", "intro", "price", "unit", "includes"]) required(doc[f], `Costing page → ${f}`);
    return { ...doc, eyebrow: doc.eyebrow || "", note: doc.note || "", includesHeading: doc.includesHeading || "" };
});

/**
 * /privacy-policy or /terms: { title, lastUpdated, body }. The body's
 * {email} {phone} {address} {siteName} are filled from Site settings here, so
 * a legal page can never show an old number.
 */
export const getLegalPage = cache(async (slug) => {
    const doc = required(await sanityFetch(LEGAL_PAGE, { slug }), `Legal page "${slug}"`);
    required(doc.body, `Legal page "${slug}" → text`);
    const { contact, business } = await getSiteSettings();
    const a = business.address;
    const values = {
        email: contact.email,
        // Both call numbers: "+91 95992 99980 or +91 98111 41227".
        phone: contact.callNumbers.map((n) => n.display).join(" or "),
        address: `${a.streetAddress}, ${a.addressLocality}, ${a.addressRegion} ${a.postalCode}`,
        siteName: SITE_NAME,
    };
    const fill = (t) => t.replace(/\{(\w+)\}/g, (match, key) => (key in values ? values[key] : match));
    return {
        title: doc.title,
        lastUpdated: doc.lastUpdated,
        body: doc.body.map((block) =>
            block._type === "block"
                ? { ...block, children: (block.children || []).map((c) => ({ ...c, text: fill(c.text || "") })) }
                : block
        ),
    };
});
