// /projects/state/[state] — every project in one state.
//
// Built so the "Where we build" bars on the home page have somewhere to go.
// Before this route they were plain text; linking them to /projects would have
// pointed 16 different labels at one unfiltered page, which is the dead-control
// problem Phase 16.1 records on the brand tiles.
//
// Modelled on /projects/brand/[brand]: same SSG pattern, same ProjectGrid, one
// canonical project source filtered — never a second copy of the data.
//
// NO THRESHOLD, unlike the brand pages. BRAND_COLLECTION_MIN exists because 59
// of 66 brands would make near-empty pages; here every one of the 16 states is
// reachable from a bar on the home page, so all 16 must resolve. Six states
// have a single project and that is fine — the page still answers "what have
// you built in Assam?" honestly.
//
// URLs stay under /projects, consistent with the brand pages (Phase 21 owner
// decision: moving them would change ~100 indexed URLs for no functional gain).

import { notFound } from "next/navigation";
import Link from "next/link";

import JsonLd from "../../../components/JsonLd";
import Breadcrumbs from "../../../components/Breadcrumbs";
import ProjectGrid from "../../../components/ProjectGrid";
import SectionHead, { Eyebrow } from "../../../components/SectionHead";
import { breadcrumbJsonLd } from "../../../lib/jsonld";
import { getProjects, getStats, stateDisplay, stateSlug, shareImageUrl } from "../../../lib/content";

export async function generateStaticParams() {
    return (await getStats()).statesByCount().map((s) => ({ state: stateSlug(s.state) }));
}

/**
 * Records for one state.
 *
 * getProjects() carries the RAW stored value ("J&K"), while every entry from
 * statesByCount() is already in display form ("Jammu & Kashmir"). Comparing
 * them directly matches 13 of 16 states and silently renders an empty page for
 * the other one, with a green build — so both sides go through stateDisplay().
 */
async function rowsForState(displayName) {
    return (await getProjects()).filter((p) => stateDisplay(p.state) === displayName);
}

export async function generateMetadata({ params }) {
    // Next 16: params is a Promise.
    const { state: slug } = await params;
    const entry = (await getStats()).stateBySlug(slug);
    if (!entry) return {};

    const rows = await rowsForState(entry.state);
    const cities = [...new Set(rows.map((p) => p.cityName).filter(Boolean))];

    // The state's newest photographed project, so a shared link previews real
    // work from that state rather than the generic site image. Same derivation
    // the page body uses for nothing else — the grid shows them all — but it
    // keeps the card honest.
    const ogImage = shareImageUrl(rows.find((p) => p.heroImage)?.heroImage);

    // NO NUMBERS. The page itself stopped printing its project and city counts
    // (owner, 2026-09-17), and a description asserting "61 interior projects"
    // above a page that states no total is the same inconsistency the site-wide
    // project-total removal was about. Named cities carry the local-search value
    // the count used to, and are a fact rather than a figure.
    const description =
        `Interior design and fit-out projects delivered in ${entry.state} by ` +
        `Arch Creative Interiors` +
        (cities.length ? `, including ${cities.slice(0, 3).join(", ")}.` : ".");

    return {
        title: `Interior projects in ${entry.state}`,
        description,
        alternates: { canonical: `/projects/state/${slug}` },
        openGraph: {
            title: `${entry.state} interior projects | Arch Creative Interiors`,
            description,
            url: `/projects/state/${slug}`,
            images: [ogImage],
        },
    };
}

export default async function StatePage({ params }) {
    const { state: slug } = await params;
    const entry = (await getStats()).stateBySlug(slug);

    // Guards a hand-typed URL; generateStaticParams already builds only the 16.
    if (!entry) notFound();

    const rows = await rowsForState(entry.state);
    const cities = [...new Set(rows.map((p) => p.cityName).filter(Boolean))];

    // A `share` line — "· 32% of everything we have built" — followed the city
    // count until 2026-09-17. It went with the site-wide project total: the
    // percentage IS the total divided (61 ÷ 0.32 gives it back), and the wording
    // asserts a total the site no longer states. The state's own project and
    // city counts stay; those were never in scope.

    // NO BRANDS SECTION HERE (owner, 2026-09-17). "The brand(s) we build for
    // here" was removed from all 16 state pages, and the derivation behind it
    // went with it rather than being left computing a list nothing renders.
    //
    // It had already lost its bar chart and its per-brand counts earlier the
    // same day; what was left was a heading over a run of brand names, which on
    // a single-brand state read as a whole section announcing one word.
    // The brands are still reachable — every card in the grid below names its
    // own, and the 7 brands with collection pages have their own routes.

    const crumbs = [
        { name: "Home", path: "/" },
        { name: "Projects", path: "/projects" },
        { name: entry.state, path: `/projects/state/${slug}` },
    ];

    return (
        <main id="main-content" tabIndex={-1} className="brandPage">
            <JsonLd data={breadcrumbJsonLd(crumbs)} />

            <div className="wrapx">
                <Breadcrumbs items={crumbs} />
            </div>

            {/* ONE header, not two (owner, 2026-09-17). This was a title block
                ("Delhi" + the city line) and then a second full section headed
                "Every project in {state}" above the grid — two stacked headings
                naming the same state, with a hairline and ~200px of whitespace
                between them, and the second one telling you nothing the first
                had not.

                The city list is the header's own `subtitle`, stacked under the
                state name: the state, its cities and the work are one block now.
                NOT `description` — that slot is right-aligned by space-between,
                which looks deliberate beside "Haryana" and six cities and leaves
                "Odisha"'s single city stranded at the far end of a 1280px row.
                `.covCopy` is no longer used on this page; it survives for
                StudioBlock (see CLAUDE.md).

                The `band` hairline went with the merged section. It was the only
                rule between the title and the grid, and with one section there
                is nothing left for it to separate. */}
            <section className="sec" data-tone="tint">
                <div className="wrapx">
                    <SectionHead
                        as="h1"
                        eyebrow="Where we build"
                        subtitle={cities.length > 0 ? cities.join(" · ") : undefined}
                    >
                        {entry.state}
                    </SectionHead>
                    <ProjectGrid projects={rows} />
                </div>
            </section>

            <section className="sec" data-tone="plain">
                <div className="wrapx bcta">
                    <Eyebrow center>Start a project</Eyebrow>
                    <h2>Planning a fit-out in {entry.state}?</h2>
                    <p>
                        Send the site details and the brand standard. One site manager per
                        project, from strip-out to opening day.
                    </p>
                    <p className="bctaActions">
                        <Link href="/contact" className="bGlow">
                            Start an enquiry
                        </Link>
                        <Link href="/projects" className="link">
                            All projects
                        </Link>
                    </p>
                </div>
            </section>
        </main>
    );
}
