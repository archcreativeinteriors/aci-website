// Home — composed to redesign brief §4.
//
// Eight sections, in this order. The order is the repositioning part of the job:
// coverage moves UP (national reach lands before the service list), the studio
// block moves DOWN (proof precedes self-description), testimonials sit last
// before the CTA.
//
// Sections removed from Home this pass, on the owner's call, to be rehoused:
//   HowWeWork, Team, FAQ  -> /studio (brief §4 Studio, items 3-5) — DONE, that
//                            page now exists. The FAQ content and its FAQPage
//                            schema both live there; the delivery stages and the
//                            team are rebuilt in the new design language, so
//                            HowWeWork.jsx / Team.jsx / FAQ.jsx are now unused.
//   Contact form          -> /contact (brief §4 Contact)
//   Achievements          -> folded into the hero stats row
//   Clients marquee       -> superseded by the brand wall
//   NewCollection, StudioLocation -> no slot in the brief; still to be placed.
// They are still in the repo (components/ untouched) — nothing was deleted.

import {
  getCoverImage,
  brandSlug,
  getSiteSettings,
  getTestimonials,
  getStats,
  getLocations,
  brandHref,
  BRAND_COLLECTION_MIN,
} from "./lib/content";

import HomeHero from "./components/home/HomeHero";
import SelectedProjects from "./components/home/SelectedProjects";
import WhereWeBuild from "./components/home/WhereWeBuild";
import BrandWall from "./components/home/BrandWall";
import WhatWeDo from "./components/home/WhatWeDo";
import StudioBlock from "./components/home/StudioBlock";
import HomeTestimonials from "./components/home/HomeTestimonials";
import CtaBand from "./components/home/CtaBand";

// Home had NO metadata export at all — it inherited layout.js's generic
// "Arch Creative Interiors" title and a one-line description, on the single
// most-linked page of the site.
//
// THE PROJECT TOTAL IS OUT OF BOTH DESCRIPTIONS (owner, 2026-09-17). It read
// "192 documented fit-outs across 16 states" / "192 documented projects". A
// snippet is the one place a removed number keeps showing up long after the
// page stops saying it — Google can serve a cached description for weeks.
// Since 2026-10-01 the city and state counts are out too (owner: no numbers
// anywhere), here and on the brand pages; `stats` is still loaded.
export async function generateMetadata() {
  const { stats } = await getSiteSettings();
  return {
    // Owner-approved 2026-10-28. Keeps "salon" (169 of 174 published projects),
    // "interior designers" (the search term) and "Delhi NCR" (the Gurugram
    // studio's local signal); "turnkey" is in the description and the hero.
    //
    // `absolute`, with the brand written ONCE: layout.js's title template
    // (" | Arch Creative Interiors") applies only to routes BELOW the root
    // layout, never to this page in the same segment — measured 2026-10-28,
    // the home title had been printing with no brand at all. Every other page
    // still gets the suffix from the template.
    title: { absolute: "Salon & Commercial Interior Designers, Delhi NCR | Arch Creative Interiors" },
    // No numbers (owner, 2026-10-01). Every sector named here is one the site
    // offers on /services.
    description: `Turnkey interior design from a Gurugram studio: salons, showrooms, restaurants, offices and homes across Delhi NCR and India, from design to handover.`,
    alternates: { canonical: "/" },
    openGraph: {
      title: "Arch Creative Interiors — Salon & Commercial Interior Designers",
      description: `Turnkey salon, commercial and residential interiors across India. A Delhi NCR studio delivering salon, retail, restaurant and residential fit-outs end to end.`,
      url: "/",
      images: ["/og-image-landscape.jpg"],
    },
  };
}

// Each brand's cover photograph (its newest photographed project), from
// lib/content/brandImages.js — the one place that decides whether a brand has
// photos. A plain map for BrandWall; brands with no photograph are simply
// absent and get BrandPlaceholder.
async function brandPreviews(brands) {
  const byBrand = {};
  for (const b of brands) {
    const cover = await getCoverImage(brandSlug(b.brand));
    if (cover) byBrand[b.brand] = cover;
  }
  return byBrand;
}

// How many testimonials the home page shows.
const TESTIMONIALS_SHOWN = 3;

// A brand's distinct city names, the city with the most projects first (ties
// alphabetical).
function cityNamesByProjects(items) {
  const counts = new Map();
  for (const p of items) if (p.city) counts.set(p.city, (counts.get(p.city) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([city]) => city);
}

// The brand wall and the map are Client Components (they react to hover), so
// their data is worked out here on the server and handed down as plain props.
async function brandWallData() {
  const stats = await getStats();
  return stats.brandsByCount().map((b) => ({
    brand: b.brand,
    count: b.count,
    cities: b.cities,
    states: b.states,
    // Most projects first (owner, 2026-10-01): the preview caption names the
    // first few of these instead of printing a city count.
    cityNames: cityNamesByProjects(b.items),
    href: brandHref(b),
    hasCollection: b.count >= BRAND_COLLECTION_MIN,
  }));
}

export default async function Home() {
  const [wall, locations] = await Promise.all([brandWallData(), getLocations()]);
  const previews = await brandPreviews(wall);
  // Brands WITH photographs first, each group keeping its order (largest
  // first), so the featured tile and the default preview always have a photo
  // (owner, 2026-10-01). Array.prototype.sort is stable.
  const brands = wall
    .map((b) => ({ ...b, hasPhotos: Boolean(previews[b.brand]) }))
    .sort((a, b) => Number(b.hasPhotos) - Number(a.hasPhotos));
  // ONE list feeds both the Review JSON-LD below and the cards in
  // <HomeTestimonials>, so the markup can never describe reviews the page does
  // not show. Sanity `testimonial` documents.
  const testimonials = (await getTestimonials()).slice(0, TESTIMONIALS_SHOWN);

  return (
    <main id="main-content" tabIndex={-1}>
      {/* The Organization node is emitted ONCE, in layout.js <head>, so it is
          already on this page. It used to be repeated here — same @id, so
          harmless, but two identical nodes in one document is noise. */}

      {/* FAQPage schema is deliberately NOT here any more: the <FAQ> section moved
          off Home this pass, and emitting FAQPage on a page with no visible
          questions is a Google structured-data policy violation. It now lives on
          /about, where the questions are actually rendered.

          No Review schema either (2026-10-09): each testimonial reviews this
          business itself, which Google's review-snippet policy excludes as
          "self-serving" — see the note on reviewJsonLd() in lib/jsonld.js. The
          testimonials are still rendered below. */}

      <HomeHero />
      <SelectedProjects />
      <WhereWeBuild {...locations} />
      <BrandWall brands={brands} previews={previews} />
      <WhatWeDo />
      <StudioBlock />
      <HomeTestimonials testimonials={testimonials} />
      <CtaBand />
    </main>
  );
}
