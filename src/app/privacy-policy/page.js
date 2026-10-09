import { SITE_NAME } from "../lib/site";
import { getLegalPage } from "../lib/content";
import LegalBody from "../components/LegalBody";

export const metadata = {
    title: "Privacy Policy",
    description: `How ${SITE_NAME} collects, uses and protects your personal information.`,
    alternates: { canonical: "/privacy-policy" },
    openGraph: {
        title: "Privacy Policy | Arch Creative Interiors",
        description: `How ${SITE_NAME} collects, uses and protects your personal information.`,
        url: "/privacy-policy",
        images: ["/og-image-landscape.jpg"],
    },
    robots: { index: true, follow: true },
};

// THE TEXT IS IN SANITY (Studio → Legal pages → Privacy Policy) since
// 2026-09-28; the version that was typed here is in
// archive/src/app/privacy-policy/page.before-phase6.js. {email}, {phone},
// {address} and {siteName} in it are filled from Site settings.
//
// NOTE FOR THE SITE OWNER: a plain-language draft built from what this codebase
// actually does (the contact form, Resend, Vercel Analytics, the embedded Google
// Map). Still NOT a substitute for legal review — have a lawyer or CA confirm it
// before relying on it, especially before running paid ads.
//
// TWO THINGS THE OWNER MUST SETTLE, both still open in the text:
//   1. The Grievance Officer's NAME (DPDP expects a named individual; the role,
//      channel and response window are written). Never invented here.
//   2. The 24-month retention period — a concrete commitment, so the business
//      has to actually keep it. Change the number if that is wrong.
//
// THE COOKIES SECTION DESCRIBES A REAL MECHANISM — keep it in step with
// components/CookieConsent.jsx and lib/consent.js: no Google Maps embed and no
// Vercel Analytics load until the banner is accepted, and images (Sanity's
// included) are served from our own /_next/image. If that ever changes, the
// text in the Studio changes with it.
export default async function PrivacyPolicyPage() {
    const page = await getLegalPage("privacy-policy");
    return (
        <main id="main-content" tabIndex={-1} className="legal-page">
            <div className="legal-page-inner">
                <h1>{page.title}</h1>
                <p className="legal-updated">Last updated: {page.lastUpdated}</p>
                <LegalBody blocks={page.body} />
            </div>
        </main>
    );
}
