import { BUSINESS, SITE_NAME } from "../lib/site";
import { getSiteSettings } from "../lib/contentSource";

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

// NOTE FOR THE SITE OWNER: a plain-language draft built from what this codebase
// actually does (the contact form, Resend, Vercel Analytics, the embedded Google
// Map). Still NOT a substitute for legal review — have a lawyer or CA confirm it
// before relying on it, especially before running paid ads, which require a
// reachable policy.
//
// TWO THINGS THE OWNER MUST SETTLE, both marked inline below:
//   1. The Grievance Officer's NAME. The role, channel and response window are
//      written; the name is left open deliberately, because assigning a legal
//      role to a named person is not a drafting decision.
//   2. The 24-month retention period. It is written as a concrete commitment
//      rather than "as long as necessary" — which is what DPDP expects — so the
//      business has to actually keep it. Change the number if that is wrong.
//
// THE COOKIES SECTION DESCRIBES A REAL MECHANISM — keep them in step. As of
// 2026-09-22 the site ships a consent banner (components/CookieConsent.jsx) and
// neither the Google Maps embeds nor Vercel Analytics load until it is
// accepted; the one cookie set is the record of that choice. That was measured,
// not assumed: see the net-log figures at the top of lib/consent.js. If an
// analytics tool that sets its own cookies is ever added, or if images are ever
// served to the browser from a third-party CDN, this section, lib/consent.js and
// the banner copy all change together. Sanity images do NOT count: they are
// fetched by our server and served from our own /_next/image (2026-09-25), which
// is what keeps "images are served from our own website" true.
export default async function PrivacyPolicyPage() {
    const { contact } = await getSiteSettings();
    return (
        <main id="main-content" tabIndex={-1} className="legal-page">
            <div className="legal-page-inner">
                <h1>Privacy Policy</h1>
                <p className="legal-updated">Last updated: September 2026</p>

                <p>
                    {SITE_NAME} ("we", "us", "our") respects your privacy. This policy explains what
                    information we collect through this website, why we collect it, and how you can
                    contact us about it.
                </p>

                <h2>Information we collect</h2>
                <p>
                    When you submit our contact / consultation form, we collect the details you
                    provide: your name, email address, phone number and project type. We do not
                    require you to create an account, and we do not collect payment information on
                    this website.
                </p>
                <p>
                    We use Vercel Analytics to understand anonymized, aggregate traffic to this
                    website (pages visited, general location, device type). This does not identify
                    you personally.
                </p>

                <h2>How we use your information</h2>
                <p>We use the information you submit only to:</p>
                <ul>
                    <li>Respond to your enquiry and provide a consultation or quote</li>
                    <li>Get in touch by phone, email or WhatsApp about your project</li>
                    <li>Understand and improve how visitors use this website</li>
                </ul>
                <p>We do not sell your personal information to third parties.</p>

                <h2>Who we share it with</h2>
                <p>
                    Form submissions are delivered to our team by email via Resend, our transactional
                    email provider. This website can also show a Google Map — in the footer of every
                    page and on our contact page — which is subject to Google's own privacy policy.
                    It does not load, and Google receives nothing, unless you agree to it or press
                    the button to load it; see "Cookies, third-party content and your choice" below.
                </p>

                <h2>Data retention</h2>
                {/* CONCRETE PERIOD, NOT "as long as necessary". The DPDP Act expects a
                    stated retention limit, and the vague form is the single most common
                    reason a policy fails review. 24 months from last contact is the
                    default written here — THE OWNER MUST CONFIRM OR CHANGE IT, because
                    it is a commitment the business has to keep, not a drafting choice. */}
                <p>
                    We retain enquiry details — your name, contact details and the message you sent —
                    for <strong>24 months from our last contact with you</strong>, so that we can
                    answer follow-up questions and keep ordinary business records. After that period
                    they are deleted or anonymized. Where a project proceeds, the associated records
                    are kept for as long as required under applicable tax and company law.
                </p>
                <p>
                    You can ask us to delete your enquiry sooner at any time, using the contact
                    details below.
                </p>

                <h2>Your rights</h2>
                <p>
                    Under India's Digital Personal Data Protection Act, you have the right to access,
                    correct, or request erasure of your personal data, and to withdraw consent at any
                    time. To exercise any of these rights, or to raise a grievance about how your data
                    has been handled, contact us using the details below.
                </p>

                <h2>Cookies, third-party content and your choice</h2>
                <p>
                    This website sets no advertising cookies and does not track you across other
                    websites. We sell nothing to data brokers and we build no profile of you.
                </p>
                <p>
                    Two things on this site are loaded from Google rather than from us: the{" "}
                    <strong>map</strong> of our studio, and our <strong>visitor statistics</strong>.
                    Loading either one sends your IP address and browser details to Google, who
                    handle it under their own privacy policy. Because that happens before you have
                    asked for a map, we do not load either until you tell us to.
                </p>
                <p>
                    The first time you visit, a short banner asks you to Accept or Decline.
                    Declining is a single click and costs you nothing on this site — the studio
                    address, the directions link, the photographs and the enquiry form all work
                    exactly the same. You can change your answer at any time using the{" "}
                    <strong>Cookie settings</strong> link at the foot of any page, and you can load
                    the map just once, without agreeing to anything, using the button shown in its
                    place.
                </p>
                <p>
                    <strong>The only cookie this site sets is the record of that choice.</strong>{" "}
                    It stores nothing but the word you chose, lasts 180 days, and is read only by
                    this website. Everything else the site needs in order to work is held in your
                    browser for the length of your visit and is never sent anywhere.
                </p>
                <p>
                    Photographs and other images on this site are served from our own website, not
                    from an outside picture service, so viewing them involves no third party and
                    needs no consent.
                </p>

                <h2>Contact us / Grievance Officer</h2>
                {/* The DPDP Act requires a reachable Grievance Officer and expects a NAMED
                    individual. The role, the channel and the response window are stated
                    here; the NAME IS DELIBERATELY NOT INVENTED — assigning a legal role to
                    a real person is the owner's decision, not a drafting one. Add the name
                    below before this page is relied on, and tell the lawyer reviewing it
                    that this is the one field left open on purpose. */}
                <p>
                    For any question about this policy, to exercise your rights, or to raise a
                    grievance about how your personal data has been handled, contact the Grievance
                    Officer at {SITE_NAME}. We aim to acknowledge every grievance within 7 working
                    days and to resolve it within 30 days of receipt.
                </p>
                <ul>
                    <li>Email: {contact.email}</li>
                    <li>Phone: {contact.telephoneDisplay}</li>
                    <li>
                        Address: {BUSINESS.address.streetAddress}, {BUSINESS.address.addressLocality},{" "}
                        {BUSINESS.address.addressRegion} {BUSINESS.address.postalCode}
                    </li>
                </ul>

                <h2>Changes to this policy</h2>
                <p>
                    We may update this policy from time to time. The "Last updated" date above
                    reflects the most recent revision.
                </p>
            </div>
        </main>
    );
}
