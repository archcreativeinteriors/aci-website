import { createHash } from "node:crypto";

// ── Maintenance mode (owner, 2026-10-07) ─────────────────────────────────────
// MAINTENANCE_MODE=1 at BUILD time sends every page to /maintenance
// (src/app/maintenance/route.js), which answers 503 + Retry-After. Unset, the
// rewrite below does not exist at all — no Proxy, no per-request cost. On
// Vercel: set the variable, redeploy; remove it, redeploy. Never rewritten:
// /_next and other /_ paths, /api (the Sanity webhook and the contact form keep
// working), /maintenance itself, and any file with an extension (logo, icons,
// robots.txt, sitemap.xml). docs/vercel-deploy.md → "Maintenance mode".
const MAINTENANCE = process.env.MAINTENANCE_MODE === "1";
// With MAINTENANCE_BYPASS_SECRET set, /api/maintenance-bypass?key=<secret>
// gives the owner a cookie that skips the rewrite. Cookie name and hash recipe
// must match src/app/api/maintenance-bypass/route.js.
const BYPASS = process.env.MAINTENANCE_BYPASS_SECRET
  ? [{ type: "cookie", key: "aci-maintenance-bypass", value: createHash("sha256").update(process.env.MAINTENANCE_BYPASS_SECRET).digest("hex") }]
  : undefined;
const maintenanceRewrites = MAINTENANCE
  ? ["/", "/:path((?!_|api/|maintenance$)(?!.*\\.[A-Za-z0-9]+$).*)"].map((source) => ({
      source,
      destination: "/maintenance",
      ...(BYPASS ? { missing: BYPASS } : {}),
    }))
  : [];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // `npm run build:safe` (scripts/safe-build.js) builds into .next-a / .next-b
  // in turn and `npm start` serves the last one that SUCCEEDED, because
  // `next build` empties its folder first — building into the live .next, a
  // failed build leaves the VPS's `next start` without its pages. Unset (a
  // plain `npm run build` / `next start`), this is Next's default.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    // Sanity's CDN hosts the project photography (see lib/cms/image.js).
    // Without this, next/image blocks the remote host entirely.
    // Sanity images are fetched by OUR server and served first-party from
    // /_next/image (components/SanityImage.jsx) — visitors never contact Sanity.
    // A URL object sets `search: ""`, so only query-less base URLs match.
    remotePatterns: [new URL("https://cdn.sanity.io/images/**")],
    // Next 16 rejects any `q` not listed here with a 400. 75 is the default for
    // every image; 90 is for client logos, whose fine lettering softens at 75.
    // A hand-built /_next/image URL must use one of these.
    qualities: [75, 90],
    // AVIF first — typically 20-30% smaller than WebP at the same quality,
    // which directly shrinks the LCP image's bytes. Falls back to WebP, then
    // the original format, per the browser's Accept header.
    formats: ["image/avif", "image/webp"],
    // Next's default deviceSizes start at 640px. 360/420 give common phone
    // widths a closer srcset candidate.
    //
    // MEASURED, because the obvious rationale is wrong: this does NOT fix
    // Lighthouse's "properly size images" (180 KB on Home mobile, identical
    // before and after). A 412px viewport at DPR ~1.75 needs ~721px, so the
    // browser picks w=750 either way and never reaches the new entries. What it
    // does buy is real but modest — Home mobile 840 -> 818 KB, desktop
    // 1246 -> 1214 KB, mobile perf 76 -> 80 — mostly for DPR-1 and
    // in-between-width devices.
    //
    // Every `sizes` attribute in the codebase was checked against its CSS grid
    // at every breakpoint and they are all correct; the residual "oversized"
    // number is the audit comparing delivered pixels to the CSS box without
    // full DPR credit, not a bug to chase. The actual fix for image weight is
    // the Sanity CDN migration.
    deviceSizes: [360, 420, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  async redirects() {
    return [
      // Canonicalize the bare domain to the www host (see src/app/lib/site.js).
      {
        source: "/:path*",
        has: [{ type: "host", value: "archcreativeinteriors.com" }],
        destination: "https://www.archcreativeinteriors.com/:path*",
        permanent: true,
      },
      // /studio was merged into /about. The two pages repeated the founder's
      // name, both of his paragraphs and his quote word for word and competed
      // in search; /about kept the URL because it is the conventional name, the
      // one in the navbar, and the one with existing authority.
      // permanent: true -> 308, so the merge is not read as a temporary move.
      {
        source: "/studio",
        destination: "/about",
        permanent: true,
      },
      // Project URLs of the PREVIOUS site (the nginx deployment live until this
      // one replaces it — crawled 2026-10-09) whose slug changed in Sanity.
      // Each is matched on the old page's own H1, Location and copy, and where
      // two new pages fitted, on its photograph. The other 17 old project URLs
      // kept their slug and need nothing. Tweak's old page ("New delhi") fits
      // three Tweak projects equally, so it goes to the brand page that lists
      // all three. Never remove these: they carry the old pages' search history.
      ...[
        ["geetanjali-salon-gurugram", "/projects/geetanjali-salon-felix-plaza-sector-82-gurugram"],
        ["hakim-ali-salon", "/projects/hakim-ali-salon-high-street-apollo-indore-madhya-pradesh"],
        ["peluqueria-salon-lucknow", "/projects/peluqueria-salon-emaar-gomti-nagar-green-lucknow"],
        ["aloevera-salon-noida", "/projects/aloevera-salon-sector-50-noida"],
        ["toni-and-guy", "/projects/toni-and-guy-indrapuram-habitat-center-ghaziabad"],
        ["madonna-salon", "/projects/madonna-salon-greenfield-colony-sector-43-faridabad"],
        ["eesha-salon", "/projects/eesha-salon-sector-66-gurugram"],
        ["geetanjali-salon-jharkhand", "/projects/geetanjali-salon-jhamshedpur-jharkhand"],
        ["geetanjali-salon-vensejmall", "/projects/geetanjali-studio-vensejmall-Sector-57-Gurgaon"],
        ["geetanjali-salon-vasant-vihar", "/projects/geetanjali-salon-vasant-vihar-new-delhi"],
        ["punjabi-restaurant-gurugram", "/projects/punjabi-restaurant-m3m-ifc-sector66-gurugram"],
        ["tweak-salon", "/projects/brand/tweak"],
        ["geetanjali-salon-malviya-nagar", "/projects/geetanjali-salon-shivalik-malviya-nagar-new-delhi"],
        ["geetanjali-salon-faridabad", "/projects/geetanjali-salon-mall-of-faridabad"],
        ["dopulence-salon", "/projects/dopulence-salon-kankarbagh-patna-bihar"],
        ["geetanjali-studio-ajmer", "/projects/geetanjali-studio-ajmer-rajasthan"],
        ["geetanjali-studio-rajendra-nagar", "/projects/geetanjali-studio-rajendra-nagar-dehradun"],
      ].map(([from, destination]) => ({ source: `/projects/${from}`, destination, permanent: true })),
    ];
  },
  async rewrites() {
    return { beforeFiles: maintenanceRewrites, afterFiles: [], fallback: [] };
  },
};

export default nextConfig;
