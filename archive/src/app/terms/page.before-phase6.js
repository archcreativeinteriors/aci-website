import { BUSINESS, SITE_NAME } from "../lib/site";
import { getSiteSettings } from "../lib/contentSource";

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

// NOTE FOR THE SITE OWNER: a draft, not a substitute for legal review — have a
// lawyer or CA confirm this before relying on it, especially if you run paid ad
// campaigns that require a terms page.
//
// The clause worth pointing the reviewer at is "Client names and trademarks".
// This site names 66 client brands and reproduces 82 client logos, which is the
// largest third-party-rights surface it has, and it had no clause at all until
// now. What is written is nominative use plus a removal route; whether that is
// sufficient for any given brand agreement is a question for the lawyer.
export default async function TermsPage() {
    const { contact } = await getSiteSettings();
    return (
        <main id="main-content" tabIndex={-1} className="legal-page">
            <div className="legal-page-inner">
                <h1>Terms & Conditions</h1>
                <p className="legal-updated">Last updated: September 2026</p>

                <p>
                    These terms govern your use of this website, operated by {SITE_NAME}. By using
                    this website, you agree to these terms.
                </p>

                <h2>Website content</h2>
                <p>
                    Project photography, descriptions, and pricing shown on this website are provided
                    for informational purposes. Completed project details (area, timeline, materials)
                    reflect that specific project and are not a guarantee of cost or outcome for a new
                    enquiry. A firm quotation is provided only after a site visit and requirement
                    discussion.
                </p>
                <p>
                    Summary figures shown on this website — such as the number of spaces delivered,
                    years in operation or projects documented — describe our cumulative experience
                    and are indicative rather than audited statements.
                </p>

                <h2>Enquiries and consultations</h2>
                <p>
                    Submitting the contact form or calling/WhatsApp-ing us does not create a binding
                    contract for design or execution services. Any engagement is governed by a
                    separate, signed agreement between you and {SITE_NAME}.
                </p>

                <h2>Intellectual property</h2>
                <p>
                    All text, images and design shown on this website are the property of{" "}
                    {SITE_NAME} or used with permission, and may not be reproduced without our
                    written consent.
                </p>

                {/* The site's largest third-party-rights surface by far: it names 66
                    client brands across /projects and the brand collection pages, and
                    reproduces 82 client logos on /clients. There was no clause covering
                    any of that. Nominative use to identify completed work is ordinarily
                    fine, but it should be stated, and there should be a removal route. */}
                <h2>Client names and trademarks</h2>
                <p>
                    This website names clients and reproduces their logos in order to identify work{" "}
                    {SITE_NAME} has completed. All such names, logos and marks remain the property of
                    their respective owners, and their appearance here does not imply any endorsement
                    of {SITE_NAME} by them, or any partnership beyond the work shown.
                </p>
                <p>
                    If you own one of these marks and would like your name, logo or project removed
                    from this website, write to {contact.email} and we will remove it.
                </p>

                <h2>Third-party links and embeds</h2>
                <p>
                    This website links to our social media profiles and embeds a Google Map. We are
                    not responsible for the content or privacy practices of those third-party
                    services.
                </p>

                <h2>Limitation of liability</h2>
                <p>
                    This website is provided "as is". While we take reasonable care to keep it
                    accurate and available, we do not guarantee uninterrupted access and are not
                    liable for losses arising from its use beyond what is required by applicable law.
                </p>

                <h2>Governing law</h2>
                <p>
                    These terms are governed by the laws of India, and any dispute is subject to the
                    jurisdiction of the courts in Gurugram, Haryana.
                </p>

                <h2>Changes to these terms</h2>
                <p>
                    We may update these terms from time to time. The "Last updated" date above
                    reflects the most recent revision, and continued use of the website after a
                    change means you accept the revised terms.
                </p>

                <h2>Contact</h2>
                <p>
                    Questions about these terms can be sent to {contact.email} or{" "}
                    {contact.telephoneDisplay}.
                </p>
            </div>
        </main>
    );
}
