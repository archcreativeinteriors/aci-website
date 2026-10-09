// /projects/brand/[brand] — the Brand Collection Experience (spec §2–§9).
//
// §3 structure, in order: hero · statistics · state breakdown with all the
// brand's projects · CTA. Not a filtered list — "a grand presentation of the
// brand partnership". The "By format" section (§5) was removed on 2026-10-09
// (owner); its component and styles are in archive/src/app/.
//
// §23 THRESHOLD: generated only for brands with 3+ projects. "Never create a
// nearly empty brand collection page." That is 7 of 66 brands on the current
// 192 rows; the other 59 are linked straight to their project from the home
// brand wall (see components/home/BrandWall.jsx). The threshold is
// BRAND_COLLECTION_MIN in lib/content/stats.js and moves on its own as projects
// are added — nothing here lists brand names.
//
// §24: this page answers "what has ACI built for THIS brand?". /projects
// answers "what has ACI built across the whole portfolio?". They must not
// converge; that is why this is cards-by-state and /projects is the index.
//
// URLs stay under /projects (owner's call). §22 suggests /brands/{slug}; moving
// would change ~100 indexed URLs for no functional gain.

import { notFound } from "next/navigation";
import Link from "next/link";

import JsonLd from "../../../components/JsonLd";
import Breadcrumbs from "../../../components/Breadcrumbs";
import BrandHero from "../../../components/brand/BrandHero";
import BrandStateSection from "../../../components/brand/BrandStateSection";
import BrandCuratedNotice from "../../../components/brand/BrandCuratedNotice";
import { Eyebrow } from "../../../components/SectionHead";
import { breadcrumbJsonLd } from "../../../lib/jsonld";
import {
    getProjects,
    getStats,
    BRAND_COLLECTION_MIN,
    brandSlug,
    groupByState,
    shareImageUrl,
    getCoverImage,
    hasPhotos,
    isBrandIndexable,
} from "../../../lib/content";

export async function generateStaticParams() {
    return (await getStats()).brandsWithCollectionPage().map((b) => ({ brand: brandSlug(b.brand) }));
}

export async function generateMetadata({ params }) {
    // Next 16: params is a Promise.
    const { brand: slug } = await params;
    const brand = (await getStats()).brandBySlug(slug);
    if (!brand || brand.count < BRAND_COLLECTION_MIN) return {};

    // Same photo the page body uses for its hero: the brand's cover
    // (lib/content/brandImages.js). A shared link for Geetanjali should preview
    // a Geetanjali interior, not the generic site image. Falls back to the
    // landscape OG image for a brand with no photograph yet (§26).
    const ogImage = shareImageUrl(await getCoverImage(slug));
    // No photos AND no project page: nothing to show a search engine yet, so
    // noindex (and sitemap.js leaves it out) until a photo arrives (owner,
    // 2026-10-01). `follow` stays on — its links are fine.
    const indexable = await isBrandIndexable(slug);

    // No numbers (owner, 2026-10-01): no project, city or state counts. City
    // NAMES instead, most projects first — up to three, like the state pages.
    const cityTally = new Map();
    for (const p of brand.items) if (p.city) cityTally.set(p.city, (cityTally.get(p.city) || 0) + 1);
    const topCities = [...cityTally.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([c]) => c).slice(0, 3);
    const places =
        topCities.length > 1
            ? `, including ${topCities.slice(0, -1).join(", ")} and ${topCities.at(-1)}`
            : topCities.length === 1
              ? `, in ${topCities[0]}`
              : "";
    const description = `Interior projects delivered for ${brand.brand} by Arch Creative Interiors${places}.`;

    return {
        title: `${brand.brand} — project collection`,
        description,
        alternates: { canonical: `/projects/brand/${slug}` },
        ...(indexable ? {} : { robots: { index: false, follow: true } }),
        openGraph: {
            title: `${brand.brand} interior projects | Arch Creative Interiors`,
            description,
            url: `/projects/brand/${slug}`,
            images: [ogImage],
        },
    };
}

export default async function BrandPage({ params }) {
    const { brand: slug } = await params;
    const brand = (await getStats()).brandBySlug(slug);

    // A brand below the threshold has no page — 404 rather than render a
    // near-empty one (§23). generateStaticParams already excludes them; this
    // guards a hand-typed URL.
    // Threshold comes from the CONSTANT, never a literal. Both guards in this
    // file hardcoded 3 while brandHref()/generateStaticParams/sitemap.js all
    // derived from BRAND_COLLECTION_MIN, so lowering it built 66 pages and
    // linked 66 tiles at them while 59 still called notFound() -> every tile
    // below the old threshold opened a 404.
    if (!brand || brand.count < BRAND_COLLECTION_MIN) notFound();

    // Index records (they carry heroImage, linkable and the newest-first order)
    // filtered to this brand. §20: one canonical project source, filtered — no
    // separate copy for brand pages.
    const rows = (await getProjects()).filter((p) => p.brand === brand.brand);

    const groups = groupByState(rows);

    // `share` — Math.round(brand.count / PROJECT_STATS.projects * 100) — used to
    // be passed to BrandHero as a fourth stat, "53% Of our work". It went with
    // the project total on 2026-09-17: a share OF the total is the total, just
    // divided. 104 ÷ 0.53 hands the removed number straight back, and the label
    // asserts a knowable total besides. Removing the tile but keeping the
    // percentage would have left the number recoverable by arithmetic.

    // §3.1 wants "a strong project image". Use the brand's own cover photo
    // (lib/content/brandImages.js) rather than a stock shot; null if the brand
    // has no photograph yet, which BrandHero renders as BrandPlaceholder.
    const heroImage = await getCoverImage(slug);
    // No photographs at all: the project list (cards grouped by state) is not
    // shown — it would be a grid of placeholders — and BrandCuratedNotice
    // takes its place (owner, 2026-10-01). It links to the project page when
    // the brand has one.
    const photos = await hasPhotos(slug);
    const projectPage = rows.find((p) => p.linkable);

    const crumbs = [
        { name: "Home", path: "/" },
        { name: "Projects", path: "/projects" },
        { name: brand.brand, path: `/projects/brand/${slug}` },
    ];

    return (
        <main id="main-content" tabIndex={-1} className="brandPage">
            <JsonLd data={breadcrumbJsonLd(crumbs)} />

            <div className="wrapx">
                <Breadcrumbs items={crumbs} />
            </div>

            <div className="wrapx">
                <BrandHero brand={brand} image={heroImage} />
            </div>

            {photos ? (
                <BrandStateSection
                    brand={brand.brand}
                    groups={groups}
                    total={brand.count}
                />
            ) : (
                <BrandCuratedNotice
                    brand={brand.brand}
                    projectHref={projectPage ? `/projects/${projectPage.slug}` : null}
                />
            )}

            {/* §3 item 7 — CTA. */}
            <section className="sec" data-tone="plain">
                <div className="wrapx bcta">
                    <Eyebrow center>Start a project</Eyebrow>
                    <h2>Rolling out {brand.brand}, or a brand like it?</h2>
                    <p>
                        Send the site list and the fit-out manual. One site manager per
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
