// The ONE module that knows where the site-wide content comes from: contact
// details + headline numbers, the /about intro, testimonials, FAQs, blog posts,
// home selected projects and client logos. The same pattern as
// projectSource.js / heroSource.js / teamSource.js.
//
// Sanity first: once NEXT_PUBLIC_SANITY_PROJECT_ID is set, each getter runs its
// projection from lib/cms/queries.js. Until then — and whenever nothing usable
// has been published — it returns the local module in lib/data/, which is what
// the site renders today. Callers get ONE shape either way.
//
// FALLBACK RULES
//   siteSettings  all or nothing: a document missing any field falls back to
//                 the local settings as a whole, so NAP is never half Sanity,
//                 half local. (The Studio blocks publishing it incomplete.)
//   aboutPage     all or nothing too: no heading, photo or paragraph means the
//                 local intro block, never a Sanity heading over a local photo.
//   lists         an EMPTY result falls back to the local list, so connecting
//                 the project before anyone has typed content in does not blank
//                 a section. The consequence: unpublishing every FAQ brings the
//                 local FAQs back instead of hiding them — empty the local file
//                 too if that is ever the intent.
//
// `cache()` dedupes within one render: the layout, the footer, three floating
// buttons and a page can all ask for the settings and Sanity is queried once.

import { cache } from "react";
import { sanityFetch } from "./cms/client";
import {
    SITE_SETTINGS,
    TESTIMONIALS,
    FAQS,
    BLOG_POSTS,
    HOME_SELECTED_PROJECTS,
    CLIENT_LOGOS,
    ABOUT_PAGE,
} from "./cms/queries";
import { clientLogoRows as localLogoRows } from "./data/clientLogos";
import { toContact } from "./contact";
import { siteSettings as localSettings } from "./data/siteSettings";
import { testimonials as localTestimonials } from "./data/testimonials";
import { faqs as localFaqs } from "./data/faqs";
import { blogs as localBlogs } from "./data/blogs";
import { projects as detailProjects } from "./data/projects";
import { brandsByCount, selectedProjects as localSelection } from "./projectStats";
import { about as localAbout } from "./data/about";
import { selectedProjectsText } from "./data/selectedProjects";

const SETTINGS_FIELDS = ["email", "phone", "callPhone", "whatsappPhone", "spacesDelivered", "cities", "states"];

/**
 * { contact: { email, telephone, telephoneDisplay, callNumber,
 *              callNumberDisplay, whatsappNumber },
 *   stats:   { spacesDelivered, cities, states } }
 */
export const getSiteSettings = cache(async () => {
    const doc = await sanityFetch(SITE_SETTINGS);
    const complete = doc && SETTINGS_FIELDS.every((k) => doc[k] !== null && doc[k] !== undefined && doc[k] !== "");
    const s = complete ? doc : localSettings;
    return {
        contact: toContact(s),
        stats: {
            spacesDelivered: Number(s.spacesDelivered),
            cities: Number(s.cities),
            states: Number(s.states),
        },
    };
});

/** [{ name, role, text, rating? }] in display order. */
export const getTestimonials = cache(async () => {
    const docs = (await sanityFetch(TESTIMONIALS, {}, [])) || [];
    const rows = docs.filter((t) => t && t.name && t.text);
    if (rows.length === 0) return localTestimonials;
    return rows.map((t) => ({
        name: t.name,
        role: t.role || "",
        text: t.text,
        ...(t.rating ? { rating: t.rating } : {}),
    }));
});

/** [{ q, a }] in display order. */
export const getFaqs = cache(async () => {
    const docs = (await sanityFetch(FAQS, {}, [])) || [];
    const rows = docs.filter((f) => f && f.q && f.a);
    return rows.length === 0 ? localFaqs : rows;
});

// Placeholders the /about paragraphs may carry. Keep equal to TOKENS in
// sanity/schemas/aboutPage.js, which rejects any other.
const ABOUT_TOKENS = ["rolloutSpaces", "rolloutBrand", "rolloutStates"];

/**
 * The /about intro block:
 *   { heading, image, imageAlt, sectionHeading, paragraphs[] }
 * `image` is a static import (local) or { url, lqip, … } (Sanity) — render it
 * with components/CmsImage.jsx. The paragraphs come back with {rolloutSpaces} /
 * {rolloutBrand} / {rolloutStates} filled from the largest client rollout, so
 * those figures stay derived from the project list.
 */
export const getAboutIntro = cache(async () => {
    const doc = await sanityFetch(ABOUT_PAGE);
    const paragraphs = Array.isArray(doc?.paragraphs)
        ? doc.paragraphs.filter((p) => typeof p === "string" && p.trim())
        : [];
    const intro =
        doc && doc.heading && doc.sectionHeading && doc.image?.url && paragraphs.length > 0
            ? {
                  heading: doc.heading,
                  image: doc.image,
                  // Required in the Studio; this only guards a hand-edited document.
                  imageAlt: doc.image.alt || localAbout.imageAlt,
                  sectionHeading: doc.sectionHeading,
                  paragraphs,
              }
            : localAbout;

    const top = brandsByCount()[0];
    const values = { rolloutSpaces: top.count, rolloutBrand: top.brand, rolloutStates: top.states };
    const fill = (text) =>
        text.replace(/\{(\w+)\}/g, (match, key) =>
            ABOUT_TOKENS.includes(key) ? String(values[key]) : match
        );
    return { ...intro, paragraphs: intro.paragraphs.map(fill) };
});

// "2026-06-12" -> "June 12, 2026" — the local posts' format, which the pages
// print, the sitemap parses and articleJsonLd() anchors to midday UTC.
const LONG_DATE = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
});
const formatDate = (iso) => (iso ? LONG_DATE.format(new Date(`${iso}T00:00:00Z`)) : "");

/**
 * Every post: { id, title, image, date, author?, category, excerpt,
 * metaDescription?, relatedService?, content: [{ heading, paragraphs[] }] }.
 * `image` is a static import (local) or { url, lqip, … } (Sanity); render it
 * with components/CmsImage.jsx and get a URL with imageUrl() below.
 */
export const getBlogs = cache(async () => {
    const docs = (await sanityFetch(BLOG_POSTS, {}, [])) || [];
    const posts = docs.filter((b) => b && b.id && b.title && b.image?.url);
    if (posts.length === 0) return localBlogs;
    return posts.map((b) => ({
        id: b.id,
        title: b.title,
        image: b.image,
        date: formatDate(b.date),
        ...(b.author ? { author: b.author } : {}),
        category: b.category || "",
        excerpt: b.excerpt || "",
        ...(b.metaDescription ? { metaDescription: b.metaDescription } : {}),
        ...(b.relatedService ? { relatedService: b.relatedService } : {}),
        content: (b.content || []).map((s) => ({
            heading: s.heading || "",
            paragraphs: (s.paragraphs || []).filter(Boolean),
        })),
    }));
});

/** One post by its id (slug), or null. */
export async function getBlog(id) {
    return (await getBlogs()).find((b) => b.id === id) || null;
}

// ── home: selected projects ────────────────────────────────────────────────

const SELECTED_MIN = 3;
const SELECTED_MAX = 6;

/**
 * { eyebrow, heading, description,
 *   projects: [{ slug, name, format, sector, location, image }] }
 *
 * Sanity: the `homeSelectedProjects` singleton — references to project
 * documents, in the editor's order. A card survives only if its project is
 * PUBLISHED and has a detail page on this site; /projects/[id] is still built
 * from data/projects.js, so a slug outside that list would be a card linking to
 * a 404. Skipped cards are logged at build time. If fewer than three survive,
 * or the document is missing, the whole section falls back to the local one.
 *
 * Local: the six newest photographed projects (selectedProjects() in
 * lib/projectStats.js — list order, newest first) with photos from
 * data/projects.js. `image` may be null there, which the component renders as
 * the "Photograph to be shot" tile.
 */
export const getSelectedProjects = cache(async () => {
    const pages = new Map(detailProjects.map((p) => [p.id, p]));
    const doc = await sanityFetch(HOME_SELECTED_PROJECTS);

    if (doc && doc.heading && Array.isArray(doc.projects)) {
        const kept = [];
        const skipped = [];
        for (const p of doc.projects) {
            if (!p) skipped.push("(a reference to a deleted project)");
            else if (p.status !== "published") skipped.push(`${p.name || p.slug} — not published`);
            else if (!pages.has(p.slug)) skipped.push(`${p.name || p.slug} — no detail page on the site`);
            else kept.push(p);
        }
        if (skipped.length) {
            console.warn(`[Selected projects] skipped ${skipped.length}: ${skipped.join("; ")}`);
        }
        if (kept.length >= SELECTED_MIN) {
            return {
                eyebrow: doc.eyebrow || "",
                heading: doc.heading,
                description: doc.description || "",
                projects: kept.slice(0, SELECTED_MAX).map((p) => ({
                    slug: p.slug,
                    name: p.name,
                    format: p.format || "",
                    sector: p.sector || "",
                    location: p.location || "",
                    // The Sanity hero photo; a project without one keeps its
                    // local photograph rather than showing an empty tile.
                    image: p.image?.url ? p.image : pages.get(p.slug).image || null,
                })),
            };
        }
        console.warn(
            `[Selected projects] only ${kept.length} usable project(s) in Sanity (need ${SELECTED_MIN}) — showing the local selection.`
        );
    }

    return {
        ...selectedProjectsText,
        projects: localSelection(SELECTED_MAX).map((row) => ({
            slug: row.detailSlug,
            name: row.name,
            format: row.fmt,
            sector: row.sector,
            location: row.loc,
            image: pages.get(row.detailSlug)?.image || null,
        })),
    };
});

// ── client logos ───────────────────────────────────────────────────────────

// styles/clients-page.css styles rows of 1-4 tiles (data-cols 1-4); nothing wider.
const LOGOS_PER_ROW_MAX = 4;

/**
 * The /clients wall as ROWS: [[{ src, width, height, name, wide? }]].
 * Row length is layout — see sanity/schemas/clientLogos.js.
 *
 * Sanity: the `clientLogos` singleton. `src` is a FIRST-PARTY /_next/image URL
 * for the Sanity file (the page renders a plain <img>, exactly as for the local
 * files, so the URL carries its own size) — never a cdn.sanity.io URL, which
 * would make the visitor's browser contact Sanity (see components/SanityImage.jsx).
 * Logos without an image are dropped, empty rows
 * are dropped, and a row longer than the CSS can style is split — defensive
 * only, since the Studio already limits a row to 4. No logos at all falls back.
 *
 * Local: data/clientLogos.js, unchanged — `npm run logos:sharpen` keeps writing
 * its width/height there.
 */
export const getClientLogoRows = cache(async () => {
    const doc = await sanityFetch(CLIENT_LOGOS);
    const rows = [];
    for (const row of doc?.rows || []) {
        const logos = (row?.logos || [])
            .filter((l) => l && l.url && l.width && l.height)
            .map((l) => ({
                // w=828: a width from next.config.mjs deviceSizes, enough for a
                // tile at 2x. Today's logos are all ≤778px, so they are only
                // re-encoded, never enlarged. q=90, not 75: a PNG logo may be served
                // as lossy AVIF/WebP, and thin lettering is what degrades first.
                // Both values must be in next.config.mjs or the request is a 400.
                src: `/_next/image?url=${encodeURIComponent(l.url.split("?")[0])}&w=828&q=90`,
                width: l.width,
                height: l.height,
                // Required in the Studio; "Client" only guards against a
                // hand-edited document, so alt text is never built from a hash.
                name: l.name || "Client",
                ...(l.wide ? { wide: true } : {}),
            }));
        for (let i = 0; i < logos.length; i += LOGOS_PER_ROW_MAX) {
            rows.push(logos.slice(i, i + LOGOS_PER_ROW_MAX));
        }
    }
    return rows.length > 0 ? rows : localLogoRows;
});

/** A usable URL for either image shape — for OG images and JSON-LD. */
export function imageUrl(image) {
    if (!image) return null;
    return image.url || image.src || (typeof image === "string" ? image : null);
}
