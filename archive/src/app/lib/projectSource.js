// The ONE module that knows where project data comes from.
//
// Today it maps the local `data/projects.js` array into the shape the Sanity
// schema defines (execution plan v5 §12). When the Sanity project exists, only
// the two functions at the bottom of this file change — from "map the local
// array" to "run a GROQ query". Nothing that imports from here moves.
//
// Field names are camelCase on the app side; the GROQ projection will alias
// them from the schema's snake_case (`project_name` -> `projectName`).
//
// NOTE: the /projects/[id] pages read Sanity first (getProjectPage, at the
// bottom), with `data/projects.js` as the per-field text fallback. Everything
// else here — the list, brand and state pages — and `sitemap.js` still read the
// local files (owner, 2026-09-25: "keep them on local data for now").

import { projects as legacyProjects } from "./data/projects";
// The owner's 192-row list (scripts/data/projects-192.txt -> import-projects.js).
// This REPLACED data/projectRoster.js as the index source: the roster was 179
// rows transcribed from a screenshot, ~17 short and in a different order. The
// Home page already read projectsData, so the two pages disagreed on both the
// count and the ordering until this was rewired.
import { projectsData } from "./data/projectsData";
import { sanityImageBase } from "./cms/image";
import { cache } from "react";
import { sanityFetch } from "./cms/client";
import { PROJECT_BY_SLUG } from "./cms/queries";

// ── City -> state. §1 of the plan lists 16 states; the index shows a state tag
// and the homepage plans state bars, but `data/projects.js` only stores a free
// -text `location`. Longest key wins, so "Sector 43 Faridabad Haryana" matches
// "faridabad" rather than accidentally matching a shorter substring elsewhere.
const CITY_STATE = {
    gurugram: "Haryana", gurgaon: "Haryana", faridabad: "Haryana",
    delhi: "Delhi", "new delhi": "Delhi", saket: "Delhi",
    "malviya nagar": "Delhi", dwarka: "Delhi",
    noida: "Uttar Pradesh", ghaziabad: "Uttar Pradesh",
    indirapuram: "Uttar Pradesh", lucknow: "Uttar Pradesh",
    "gomti nagar": "Uttar Pradesh",
    dehradun: "Uttarakhand",
    ranchi: "Jharkhand", jhamshedpur: "Jharkhand", jamshedpur: "Jharkhand",
    ludhiana: "Punjab",
    patna: "Bihar", kankarbagh: "Bihar",
    indore: "Madhya Pradesh",
    ajmer: "Rajasthan",
};

function stateFromLocation(location = "") {
    const haystack = location.toLowerCase();
    let best = null;
    for (const [city, state] of Object.entries(CITY_STATE)) {
        if (haystack.includes(city) && (!best || city.length > best.key.length)) {
            best = { key: city, state };
        }
    }
    return best ? best.state : null;
}

// ── `category` -> the plan's sector / format split (§1, §10).
// Studios, academies and nail studios are salon-sector *formats*, not sectors.
const CATEGORY_MAP = {
    "Salon Interior": { sector: "salon", format: "salon" },
    "Studio Interior": { sector: "salon", format: "studio" },
    "Academy Interior": { sector: "salon", format: "academy" },
    "Commercial Interior": { sector: "commercial", format: "commercial" },
};

/**
 * Small, optimized URL for the index hover preview (~640px wide).
 * A static import's `.src` points at the ORIGINAL file (up to ~560 KB here),
 * so it must go through an optimizer or hovering a row downloads a full-size
 * photo.
 *
 * Both sources go through Next's own optimizer, first-party. A Sanity asset
 * used to go straight to cdn.sanity.io (free resizing on Vercel), but that
 * makes every visitor's browser contact a third party, which the privacy
 * policy says does not happen — so the owner chose first-party (2026-09-25).
 *
 * q=75 because Next 16 answers any quality not in next.config.mjs
 * `images.qualities` with a 400. This used q=70, and every hover preview on
 * /projects was a broken image until 2026-09-25.
 */
function previewUrl(image) {
    if (!image) return null;

    const src =
        sanityImageBase(image) || (typeof image === "string" ? image : image.src);
    if (!src) return null;
    return `/_next/image?url=${encodeURIComponent(src)}&w=640&q=75`;
}

function toRecord(p) {
    const mapped = CATEGORY_MAP[p.category] || { sector: "salon", format: "salon" };
    const location = (p.location || "").trim();
    return {
        slug: p.id,
        projectName: (p.title || "").trim(),
        brand: (p.client || "").trim(),
        sector: mapped.sector,
        subCategory: mapped.format,
        city: location,
        state: stateFromLocation(location),
        tier: null,
        heroImage: p.image || null,
        previewSrc: previewUrl(p.image),
        displayOrder: p.displayOrder ?? 0,
        placeholder: false,
    };
}

// ── Public API. Swap the bodies of these for GROQ when Sanity lands.

/**
 * Every project, index-ordered.
 *
 * `data/projectsData.js` (the owner's 192-row list) is the full roster and is
 * ALREADY stored newest-first — `listNo` counts down from 192, so Rawls Salon
 * is row 1 and Esskay Beauty Resources is row 192. `data/projects.js` supplies
 * photo, copy and a /projects/[id] page for the rows that have one; the rest
 * render as index-only text rows, per §16.
 */
export function getProjects() {
    const detailed = new Map(legacyProjects.map((p) => [p.id, toRecord(p)]));

    const rows = projectsData.map((entry) => {
        const rich = entry.detailSlug ? detailed.get(entry.detailSlug) : null;
        return {
            // A linkable row must be addressed by the DETAIL page's id, not by
            // the list-derived slug — that id is what generateStaticParams
            // builds. Unlinkable rows keep their own slug purely as a React key.
            slug: entry.detailSlug || entry.slug,
            projectName: entry.name,
            brand: entry.brand,
            sector: entry.sector,
            subCategory: entry.fmt,
            // `loc` is the owner's free-text location ("Vista Square Mall
            // Sec-82A Gurgaon"); `city`/`state` are the canonical forms used by
            // the derived counts. The index column wants the descriptive one,
            // so `city` carries it — `cityName` is the canonical value, which
            // the detail page shows as its own "City" spec row.
            city: entry.loc,
            cityName: entry.city,
            state: entry.state,
            tier: null,
            heroImage: rich ? rich.heroImage : null,
            previewSrc: rich ? rich.previewSrc : null,
            // Only rows backed by a real record get a link — never emit an <a>
            // to a page that generateStaticParams does not build.
            linkable: Boolean(rich),
            // listNo IS the owner's list position (1 = oldest, 192 = newest),
            // so sorting on it descending reproduces the requested order
            // exactly, independent of array order.
            displayOrder: entry.listNo,
            placeholder: false,
        };
    });

    // listNo descending — the owner's list read bottom-to-top.
    return rows.sort((a, b) => b.displayOrder - a.displayOrder);
}

/** Only records that have a real detail page — for generateStaticParams / sitemap. */
export function getPublishedProjects() {
    return getProjects().filter((p) => p.linkable);
}

export function getProject(slug) {
    return getPublishedProjects().find((p) => p.slug === slug) || null;
}

// ── /projects/[id]: Sanity first, data/projects.js text as the fallback ─────

/** The 34 pages. Which pages exist stays local until the list moves too. */
export function getProjectPageIds() {
    return legacyProjects.map((p) => p.id);
}

const text = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);
const hasImage = (image) => Boolean(image && image.url);

/**
 * One project page, in the shape data/projects.js has always had, so the page
 * and its JSON-LD read it unchanged.
 *
 * Sanity wins FIELD BY FIELD (owner, 2026-09-25): a filled Sanity field is
 * used, an empty one falls back to the local record — the title, the four
 * written sections and the main photo each on their own. A project that is
 * not published in Sanity (no document with this slug and status
 * "published") falls back whole, which is exactly today's page.
 *
 * The gallery and before images come ONLY from Sanity: no photos are kept in
 * the repo, and the page shows its "Photograph to be shot" state for a project
 * with none. Location and category stay local — the list's location ("Worldmark
 * Sector 65 Gurgaon") is not the page's ("Gurugram"), and it is in every title.
 *
 * If Sanity cannot be reached, sanityFetch throws and the build fails; it
 * never quietly publishes the local version (lib/cms/client.js).
 */
export const getProjectPage = cache(async (slug) => {
    const local = legacyProjects.find((p) => p.id === slug);
    if (!local) return null;
    const doc = await sanityFetch(PROJECT_BY_SLUG, { slug });

    const features = Array.isArray(doc?.features) ? doc.features.filter(text) : [];
    const gallery = Array.isArray(doc?.gallery) ? doc.gallery.filter(hasImage) : [];
    const beforeImages = Array.isArray(doc?.beforeImages) ? doc.beforeImages.filter(hasImage) : [];
    return {
        ...local,
        title: text(doc?.pageTitle) || local.title.trim(),
        desc: text(doc?.overview) || local.desc,
        challenge: text(doc?.challenge) || local.challenge,
        solution: text(doc?.solution) || local.solution,
        features: features.length ? features : local.features,
        image: hasImage(doc?.heroImage) ? doc.heroImage : local.image,
        gallery,
        beforeImages,
    };
});
