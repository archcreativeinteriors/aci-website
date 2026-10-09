import ConsentedAnalytics from "./components/ConsentedAnalytics"
import CookieConsent from "./components/CookieConsent"
import { Geist, Newsreader } from "next/font/google";
import { SITE_URL } from "./lib/site";
import { organizationJsonLd } from "./lib/jsonld";
import { getSiteSettings, getStats } from "./lib/content";
import JsonLd from "./components/JsonLd";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import "./styles/home.css";
import "./styles/studio-page.css";
import Navbar from "./components/Navbar";
import "./styles/navbar.css"
import "./styles/whatsapp-btn.css"
import "./styles/about.css"
import "./styles/clients-page.css"
import "./styles/contact.css"
import "./styles/footer.css"
import "./styles/projects.css"
import "./styles/costing.css"
import "./styles/services-all.css"
import "./styles/service-detail.css"
import "./styles/project-cards.css";
import "./styles/brand-page.css";
import "./styles/project-detail.css"
import "./styles/call-button.css"
import "./styles/email-button.css"
import "./styles/scroll-top.css"
import "./styles/studio-location.css"
import "./styles/blogs.css"
import "./styles/blog-details.css"
import "./styles/not-found.css"
import "./styles/breadcrumbs.css"
import "./styles/legal.css"
import "./styles/stat-counter.css"
import "./styles/button-glow.css"
import "./styles/cookie-consent.css"
// Loading shimmer for the photo viewer and the /projects hover preview only.
// Remove this line (or the folder) to switch it off — see its README.
import "./components/ImageSkeleton/image-skeleton.css"
import WhatsAppButton from "./components/whatsappButton";
import Footer from "./components/Footer";
import CallButton from "./components/CallButton";
import EmailButton from "./components/EmailButton";
import ScrollTop from "./components/ScrollTop";
// ── TWO FAMILIES, AND A BUG THEY REPLACED ───────────────────────────────────
// Newsreader (serif) for HEADINGS ONLY, h1-h6 site-wide, plus the city names
// and map labels in the "Where we build" section, which are set as display type
// by design. Geist (sans) for everything else — body copy, nav, labels, forms,
// buttons, the 192-row project index.
//
// It was briefly Newsreader on absolutely everything (owner's call, reversed
// same day). A serif at 14-15px down a 192-row index and across the legal pages
// is materially harder to read than a sans, which is why "headings only" is the
// better split and is where it landed.
//
// **The bug this uncovered, which is the part worth remembering:** globals.css
// set `font-family: "Poppins", sans-serif` on the universal selector and
// **Poppins was never loaded** — that one declaration was its only mention in
// the repo, no <link>, no next/font call. So every page fell through to generic
// `sans-serif` and the site rendered in the browser default, Arial on Windows.
// Meanwhile Geist and Geist_Mono WERE loaded here, shipped on all 131 routes,
// and between them were named by exactly one CSS rule. Geist is back because it
// is now actually used; Geist_Mono is gone, because nothing is monospaced.
//
// If a family is ever added here, check a CSS rule names it. That is the exact
// check both Poppins and Geist failed, in opposite directions.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Weights match what the stylesheets ask of headings (500/600/700, plus 400 for
// the large display heading in "Where we build"). Load fewer and the browser
// synthesises the rest, which on a serif smears the stems.
// `display: "swap"` so a slow fetch shows the fallback serif rather than
// invisible text; Next self-hosts these, so there is no runtime Google request.
//
// KEEP IT PRELOADED. `preload: false` was tried and measured (2026-09-29,
// phone throttling, median of 5): hero LCP got WORSE (2188 -> 2412 ms) and the
// hero heading visibly swapped from the fallback serif to Newsreader ~0.9 s
// after first paint. Preloaded, it arrives before first paint and never swaps.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});


export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Arch Creative Interiors",
    template: "%s | Arch Creative Interiors",
  },
  description:
    "Professional interior design company specializing in salon, spa, commercial and residential interiors.",
  // ONLY `card` is set, deliberately, and this was VERIFIED in the built HTML
  // rather than assumed: Next fills twitter:title / twitter:description /
  // twitter:image from each ROUTE's own metadata, so every page gets a
  // large-image card carrying its own copy and its own picture. Measured —
  // the Geetanjali brand page emits its own hero photograph and
  // "104 interior projects delivered for Geetanjali…", not this file's values.
  //
  // Do NOT add title/description/images here. Metadata merges per top-level
  // key, so a generic pair at the root would replace that per-page derivation
  // on all 14 routes and every share would read "Arch Creative Interiors".
  twitter: {
    card: "summary_large_image",
  },
}
export default async function RootLayout({ children }) {
  // Site settings (Sanity). Fetched here for the two consumers that cannot
  // fetch for themselves: the Organization JSON-LD and the Navbar, which is a
  // Client Component. The footer and the floating buttons read the same
  // cached result directly.
  const [{ contact, business }, stats] = await Promise.all([getSiteSettings(), getStats()]);

  return (
    <html lang="en-IN" data-scroll-behavior="smooth" className={`${geistSans.variable} ${newsreader.variable}`}>
      <head>
        <meta name="google-site-verification" content="2f8KCtrY4celrCm9Z_Wcccm-Jf5ZVOUCSwhMuzHqbgo" />
        <JsonLd data={organizationJsonLd(contact, business, stats.statesByCount())} />
      </head>
      <body>
        {/* First focusable element on every page, so a keyboard or screen-reader
            user can jump past the fixed header and the six nav links straight to
            the content. Every route renders exactly one <main id="main-content">
            (verified in Phase 8.2 and re-checked here), which is the target. */}
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        {/* Analytics and the Google Maps embeds are the only third-party
            requests this site makes; both are gated on the consent banner.
            See lib/consent.js for what was measured. */}
        <ConsentedAnalytics />
        <Navbar contact={contact} business={business} />
        {children}
        <EmailButton />
        <CallButton />
        <WhatsAppButton />
        <Footer />
        <CookieConsent />
        <ToastContainer
          position="top-center"
          autoClose={3000}
          theme="light"
          toastStyle={{
            width: "min(380px, 92vw)",
            borderRadius: "14px",
            fontSize: "16px",
            marginTop: "64px"
          }}
        />
        <ScrollTop />
      </body>
    </html>
  );
}
