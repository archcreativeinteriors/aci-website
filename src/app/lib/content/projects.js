// Projects — the index, brand and state pages, the map, the brand wall, the
// home "Selected projects" and every /projects/[id] page. All from Sanity
// (Phase 6, 2026-09-28); data/projects.js and data/projectsData.js are in
// /archive.
//
// A project is a ROW on /projects whatever its Status, and gets its own PAGE
// (and a link, a preview photo, a place in the sitemap) when its Status field
// is "published" — the same rule the Studio's Status dropdown describes.

import { cache } from "react";
import { sanityFetch, required } from "./sanity";
import { PROJECT_ROWS, PROJECT_BY_SLUG, HOME_SELECTED_PROJECTS } from "./queries";
import { previewUrl } from "./image";
import { projectStats } from "./stats";

/**
 * Every project, newest first (list number descending), in the shape the
 * derivations in stats.js use:
 *   { listNo, slug, name, brand, loc, city, state, fmt, sector, detailSlug, heroImage }
 * `detailSlug` is the page's slug when the project has a page, else null.
 */
export const getProjectRows = cache(async () => {
    const docs = required(await sanityFetch(PROJECT_ROWS), "the project list (Project documents)");
    return docs.map((d) => ({
        listNo: d.listNo,
        slug: d.slug,
        name: d.name,
        brand: d.brand,
        loc: d.loc,
        city: d.city,
        state: d.state,
        fmt: d.fmt,
        sector: d.sector,
        detailSlug: d.status === "published" && d.slug ? d.slug : null,
        heroImage: d.heroImage?.url ? d.heroImage : null,
    }));
});

/** The derived totals (brands, states, sectors…) — see stats.js. */
export const getStats = cache(async () => projectStats(await getProjectRows()));

/**
 * Every project as an index record, newest first — /projects, the brand and
 * state pages, the home brand wall's previews.
 */
export const getProjects = cache(async () => {
    const rows = await getProjectRows();
    return rows
        .map((entry) => {
            const linkable = Boolean(entry.detailSlug);
            return {
                // A linkable row is addressed by its PAGE's slug, which is what
                // generateStaticParams builds; the others keep theirs as a key.
                slug: entry.detailSlug || entry.slug,
                projectName: entry.name,
                brand: entry.brand,
                sector: entry.sector,
                subCategory: entry.fmt,
                // `loc` is the owner's free text ("Vista Square Mall Sec-82A
                // Gurgaon"); `cityName` is the canonical city.
                city: entry.loc,
                cityName: entry.city,
                state: entry.state,
                tier: null,
                heroImage: linkable ? entry.heroImage : null,
                previewSrc: linkable ? previewUrl(entry.heroImage) : null,
                // Only rows with a page get a link — never an <a> to a page
                // generateStaticParams does not build.
                linkable,
                displayOrder: entry.listNo,
                placeholder: false,
            };
        })
        .sort((a, b) => b.displayOrder - a.displayOrder);
});

/** Only records with a page. */
export async function getPublishedProjects() {
    return (await getProjects()).filter((p) => p.linkable);
}

/** The index record for one page slug, or null. */
export async function getProject(slug) {
    return (await getPublishedProjects()).find((p) => p.slug === slug) || null;
}

/** The slugs of every project page — generateStaticParams and the sitemap. */
export async function getProjectPageIds() {
    return (await getProjectRows()).filter((r) => r.detailSlug).map((r) => r.detailSlug);
}

// The "category" a project page names in its share title and JSON-LD, derived
// from its Format (owner, 2026-09-28 — it used to be typed per page, and had
// gone stale on the one page whose format changed).
const CATEGORY = {
    Salon: "Salon Interior",
    "Nail studio": "Salon Interior",
    Spa: "Salon Interior",
    Studio: "Studio Interior",
    Academy: "Academy Interior",
    Restaurant: "Commercial Interior",
    Retail: "Commercial Interior",
    Estate: "Residential Interior",
};
const categoryOf = (doc) =>
    CATEGORY[doc.subCategory] ||
    (doc.sector === "Commercial" ? "Commercial Interior" : doc.sector === "Residential" ? "Residential Interior" : "Salon Interior");

const text = (v) => (typeof v === "string" && v.trim() ? v.trim() : "");
const hasImage = (image) => Boolean(image && image.url);
// Page titles and locations are typed in the Studio, and a few read
// "Vasant Vihar,New Delhi" or "Alwar  Rajasthan". They become the H1, the
// <title>, the breadcrumb and the JSON-LD name, so the spacing is evened out
// here: one space after every comma, none before, no double spaces. Wording
// and spelling are left exactly as typed.
const tidy = (v) => text(v).replace(/\s*,\s*/g, ", ").replace(/\s{2,}/g, " ");

// LAST-RESORT TEXT (owner, 2026-10-08). Every project's four text fields are
// written once and stored in Sanity (`npm run projects:content`, which fills
// only empty fields). If one is still empty — a project added in the Studio
// before the script has been run on it — the page shows a short line built from
// that project's own facts instead of leaving the section out. Never generated
// per visit by anything but this, and never written back to Sanity.
const FALLBACK_FEATURES = ["Functional Space Planning", "Considered Lighting", "Durable, Easy-Care Finishes", "Clear Client Journey", "Turnkey Delivery"];
function fallbackCopy(doc, location) {
    const kind = (doc.subCategory || "").toLowerCase() || "interior design";
    const brand = doc.brand || text(doc.name) || "the client";
    const where = location ? ` in ${location}` : "";
    return {
        desc: `${/^[aeiou]/i.test(kind) ? "An" : "A"} ${kind} interior for ${brand}${where}, designed and delivered by Arch Creative Interiors with a focus on function, visual coherence and the experience of everyone who uses it.`,
        challenge: `The central challenge was planning a space that works smoothly every day while expressing ${brand}'s identity clearly.`,
        solution: `We developed the layout, lighting and finishes together as one turnkey project, from the first drawings to handover.`,
        features: FALLBACK_FEATURES,
    };
}

/**
 * One project page, or null when there is no published project with that slug:
 *   { id, title, location, category, client, desc, challenge, solution,
 *     features[], image, gallery[], beforeImages[] }
 * desc / challenge / solution / features are never empty: an empty Sanity
 * field gets the last-resort line from fallbackCopy() above.
 */
export const getProjectPage = cache(async (slug) => {
    const doc = await sanityFetch(PROJECT_BY_SLUG, { slug });
    if (!doc) return null;
    const location = tidy(doc.pageLocation) || tidy(doc.location);
    const features = Array.isArray(doc.features) ? doc.features.filter(text) : [];
    const fallback = fallbackCopy(doc, location);
    return {
        id: doc.slug,
        title: tidy(doc.pageTitle) || tidy(doc.name),
        location,
        category: categoryOf(doc),
        client: doc.brand || "",
        desc: text(doc.overview) || fallback.desc,
        challenge: text(doc.challenge) || fallback.challenge,
        solution: text(doc.solution) || fallback.solution,
        features: features.length ? features : fallback.features,
        image: hasImage(doc.heroImage) ? doc.heroImage : null,
        gallery: Array.isArray(doc.gallery) ? doc.gallery.filter(hasImage) : [],
        beforeImages: Array.isArray(doc.beforeImages) ? doc.beforeImages.filter(hasImage) : [],
    };
});

// ── home: selected projects ─────────────────────────────────────────────────

const SELECTED_MIN = 3;
const SELECTED_MAX = 6;

/**
 * { eyebrow, heading, description, projects: [{ slug, name, format, sector, location, image }] }
 * — the `homeSelectedProjects` singleton, in the editor's order. A card whose
 * project has no page (Status not "published", or deleted) is skipped and
 * reported at build time.
 */
export const getSelectedProjects = cache(async () => {
    const doc = required(await sanityFetch(HOME_SELECTED_PROJECTS), 'Selected projects (home) — the "Selected projects" document');
    required(doc.heading, "Selected projects: the heading");

    const kept = [];
    const skipped = [];
    for (const p of doc.projects || []) {
        if (!p) skipped.push("(a reference to a deleted project)");
        else if (p.status !== "published") skipped.push(`${p.name || p.slug} — its Status is not "published", so it has no page`);
        else kept.push(p);
    }
    if (skipped.length) console.warn(`[Selected projects] skipped ${skipped.length}: ${skipped.join("; ")}`);
    if (kept.length < SELECTED_MIN) {
        console.warn(`[Selected projects] only ${kept.length} usable project(s); the section is designed for ${SELECTED_MIN}–${SELECTED_MAX}.`);
    }

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
            image: hasImage(p.image) ? p.image : null,
        })),
    };
});
