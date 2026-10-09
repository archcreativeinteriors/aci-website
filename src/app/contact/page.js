import Contact from "../components/Contact";
import StudioLocation from "../components/StudioLocation";
import { Eyebrow } from "../components/SectionHead";
import { getSiteSettings } from "../lib/content";

export const metadata = {
    title: "Contact Us",
    description:
        "Contact Arch Creative Interiors for a free interior design consultation. Call, WhatsApp, email or visit our Gurugram studio.",
    alternates: { canonical: "/contact" },
    openGraph: {
        title: "Contact Arch Creative Interiors",
        description:
            "Get in touch for a free salon, commercial or residential interior design consultation.",
        url: "/contact",
        images: ["/og-image-landscape.jpg"],
    },
};


// The hours are derived (see ContactPage), so this page cannot claim hours the
// schema contradicts. It was the hardcoded string "Monday–Saturday, 9:30 AM – 6:30 PM".
//
// The footer prints 24h ("Mon–Sat · 09:30–18:30"); this page has always used
// the long friendly form, so only the VALUES move to the data — the
// presentation stays as it was.
const to12h = (t) => {
    const [h, m] = t.split(":").map(Number);
    const suffix = h < 12 ? "AM" : "PM";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
};

export default async function ContactPage() {
    // Address and hours from Site settings — the same values Footer.jsx,
    // CtaBand.jsx and the Organization JSON-LD read.
    const { contact, business } = await getSiteSettings();
    const addr = business.address;
    const { openingHours } = business;
    const dayRange = `${openingHours.days[0]}–${
        openingHours.days[openingHours.days.length - 1]
    }`;
    const hoursLine = `${dayRange}, ${to12h(openingHours.opens)} – ${to12h(
        openingHours.closes
    )}`;
    return (
        <main id="main-content" tabIndex={-1} className="contact-page">

            <header className="contact-hero">
                <Eyebrow center>Get In Touch</Eyebrow>
                <h1>Let&rsquo;s Design Your Space</h1>
                <p>
                    Call, WhatsApp or send your details below — we typically respond within
                    one working day with a free consultation.
                </p>
            </header>

            <div className="contact-layout">

                <aside className="contact-info">
                    <div className="contact-info-item">
                        <span className="contact-info-label">Call</span>
                        {/* Both call numbers (lib/contact.js), one per line. */}
                        {contact.callNumbers.map((n) => (
                            <a key={n.tel} href={`tel:${n.tel}`}>{n.display}</a>
                        ))}
                    </div>

                    <div className="contact-info-item">
                        <span className="contact-info-label">WhatsApp</span>
                        <a
                            href={`https://wa.me/${contact.whatsappNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Message us on WhatsApp
                        </a>
                    </div>

                    <div className="contact-info-item">
                        <span className="contact-info-label">Email</span>
                        <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    </div>

                    <div className="contact-info-item">
                        <span className="contact-info-label">Studio</span>
                        <a href={business.mapsUrl} target="_blank" rel="noopener noreferrer">
                            {addr.streetAddress},<br />
                            {addr.addressLocality}, {addr.addressRegion} {addr.postalCode}
                        </a>
                    </div>

                    <div className="contact-info-item">
                        <span className="contact-info-label">Hours</span>
                        <span>{hoursLine}</span>
                    </div>
                </aside>

                <Contact />

            </div>

            <StudioLocation />

        </main>
    );
}
