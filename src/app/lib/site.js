// Central site config. Canonical host is the www subdomain — every canonical
// URL, OG tag, sitemap entry and the bare-domain redirect derive from this.
// If the canonical host ever changes, change it here and in next.config.mjs.
export const SITE_URL = "https://www.archcreativeinteriors.com";

export const SITE_NAME = "Arch Creative Interiors";

export const SITE_DESCRIPTION =
  "Luxury salon, spa, commercial and residential interior designers in Delhi NCR and across India with 20+ years of experience.";

// The studio's address, opening hours, maps and social links are NOT here any
// more (Phase 6, 2026-09-28): they are in Sanity → Site settings, read through
// getSiteSettings().business (lib/content/settings.js), like the email and
// phone numbers before them. The old BUSINESS block is in
// archive/src/app/lib/site.before-phase6.js. This file is configuration only.
