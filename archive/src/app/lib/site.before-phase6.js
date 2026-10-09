// Central site config. Canonical host is the www subdomain — every canonical
// URL, OG tag, sitemap entry and the bare-domain redirect derive from this.
// If the canonical host ever changes, change it here and in next.config.mjs.
export const SITE_URL = "https://www.archcreativeinteriors.com";

export const SITE_NAME = "Arch Creative Interiors";

export const SITE_DESCRIPTION =
  "Luxury salon, spa, commercial and residential interior designers in Delhi NCR and across India with 20+ years of experience.";

// Canonical Name / Address. Everything that shows NAP — Footer, Navbar topbar,
// /contact, StudioLocation, privacy-policy, and the Organization JSON-LD
// (src/app/lib/jsonld.js) — reads the address from here. Nothing hardcodes an
// address anywhere else. This MUST match the Google Business Profile exactly
// (local SEO ranks on NAP consistency).
//
// The EMAIL and PHONE NUMBERS are not here any more (2026-09-24). They are
// editable in Sanity (Site settings) and read through getSiteSettings() in
// lib/contentSource.js, with lib/data/siteSettings.js as the local fallback —
// every format of each number is derived in lib/contact.js. Read them from
// there; do not re-add them here.
//
// The 0124 landline was REMOVED on the owner's instruction (2026-09-16),
// reversing the 2026-09 decision to keep it as a secondary line. It was never
// in the Organization JSON-LD.
export const BUSINESS = {
  address: {
    streetAddress: "3, First Floor, V-1/3, DLF Phase 3, Sector 24",
    addressLocality: "Gurugram",
    addressRegion: "Haryana",
    postalCode: "122002",
    addressCountry: "IN",
  },
  // Compact form for tight spaces (navbar topbar). Full address lives above.
  shortAddress: "DLF Phase 3, Gurugram",
  mapsUrl: "https://maps.google.com/?q=Arch+Creative+Interiors+Gurugram",
  // The Google Maps <iframe> src. Defined here because TWO components embed it
  // now — StudioLocation (the /contact section) and the site-wide Footer. Both
  // load it lazily; it is a third-party request, so never drop loading="lazy".
  mapsEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3506.519555167248!2d77.10371397537536!3d28.494012190357743!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d193a55555557%3A0x9cda0a0e35708c63!2sArch%20Creative%20Interiors!5e0!3m2!1sen!2sin!4v1780638459049!5m2!1sen!2sin",
  geo: { latitude: 28.494012, longitude: 77.103714 },
  areaServed: ["Delhi NCR", "Gurugram", "Noida", "New Delhi", "India"],
  priceRange: "₹₹₹",
  sameAs: [
    "https://www.instagram.com/aciarchcreativeinteriors",
    "https://www.facebook.com/profile.php?id=61555127306429",
    "https://www.linkedin.com/company/aci-arch-creative-interiors",
  ],
  openingHours: {
    days: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    opens: "09:30",
    closes: "18:30",
  },
};
