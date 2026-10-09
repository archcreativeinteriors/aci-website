import { SITE_NAME } from "../lib/site";
import { getLegalPage } from "../lib/content";
import LegalBody from "../components/LegalBody";

export const metadata = {
    title: "Terms & Conditions",
    description: `Terms and conditions for using the ${SITE_NAME} website.`,
    alternates: { canonical: "/terms" },
    openGraph: {
        title: "Terms & Conditions | Arch Creative Interiors",
        description: `Terms and conditions for using the ${SITE_NAME} website.`,
        url: "/terms",
        images: ["/og-image-landscape.jpg"],
    },
    robots: { index: true, follow: true },
};

// THE TEXT IS IN SANITY (Studio → Legal pages → Terms & Conditions) since
// 2026-09-28; the version that was typed here is in
// archive/src/app/terms/page.before-phase6.js. {email}, {phone} and {siteName}
// in it are filled from Site settings.
//
// NOTE FOR THE SITE OWNER: a draft, not a substitute for legal review — have a
// lawyer or CA confirm this before relying on it. The clause worth pointing the
// reviewer at is "Client names and trademarks": the site names 66 client brands
// and reproduces 82 client logos; what is written is nominative use plus a
// removal route.
export default async function TermsPage() {
    const page = await getLegalPage("terms");
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
