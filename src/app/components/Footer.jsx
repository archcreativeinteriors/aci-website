import Link from "next/link";
import MapEmbed from "./MapEmbed";
import { ConsentSettingsButton } from "./CookieConsent";
import Image from "next/image";
import { FaInstagram, FaFacebookF, FaLinkedin } from "react-icons/fa";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { SITE_NAME } from "../lib/site";
import { getSiteSettings } from "../lib/content";
import logoImg from "../../../public/aci-logo.png";

const FOOTER_LINKS = [
    { href: "/projects", label: "Projects" },
    { href: "/services", label: "Services" },
    // The only link to /costing on the site (2026-10-09: it had none, so it
    // was reachable from the sitemap alone).
    { href: "/costing", label: "Costing" },
    { href: "/about", label: "About" },
    { href: "/clients", label: "Clients" },
    { href: "/blogs", label: "Blog" },
    { href: "/contact", label: "Contact" },
];

export default async function Footer() {
    const { contact, business } = await getSiteSettings();
    const { address, openingHours } = business;
    // "Mon–Sat" from the canonical hours rather than a second hardcoded string —
    // the same array feeds the Organization JSON-LD, so the footer cannot claim
    // hours the schema contradicts.
    const dayRange = `${openingHours.days[0].slice(0, 3)}–${openingHours.days[
        openingHours.days.length - 1
    ].slice(0, 3)}`;
    return (
        <footer className="footer">
            <div className="footer-content">
                {/* Four columns on desktop. This was a single 900px centred
                    stack — seven links, three icons and the NAP in a narrow
                    ribbon with the full page width unused either side. */}
                <div className="footer-grid">
                    <div className="footer-brand">
                        {/* The mark is white ink on transparency, so it needs a
                            dark ground — it belongs on this blue, not on a
                            white section.

                            No width/height props: the static import supplies
                            the file's true 638x162 and .footer-logo sizes it
                            (44px tall). It had height={44}, which made Next
                            round the width attribute to 173 while the logo
                            renders 173.3-174.1px wide — at 125%+ display
                            scaling that is 174 and Next's dev check warned
                            "width or height modified, but not the other". */}
                        <Image
                            src={logoImg}
                            alt={SITE_NAME}
                            className="footer-logo"
                            sizes="180px"
                        />
                        <p className="footer-tagline">
                            Salon, spa, commercial and residential interiors, delivered
                            end to end — from site survey to handover.
                        </p>

                        <div className="footer-social">
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Instagram"
                                href="https://www.instagram.com/aciarchcreativeinteriors"
                            >
                                <FaInstagram />
                            </a>
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Facebook"
                                href="https://www.facebook.com/profile.php?id=61555127306429"
                            >
                                <FaFacebookF />
                            </a>
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="LinkedIn"
                                href="https://www.linkedin.com/company/aci-arch-creative-interiors"
                            >
                                <FaLinkedin />
                            </a>
                        </div>
                    </div>

                    <nav className="footer-col" aria-label="Footer">
                        <h2 className="footer-heading">Explore</h2>
                        <ul className="footer-links">
                            {FOOTER_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href}>{link.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="footer-col">
                        <h2 className="footer-heading">Studio</h2>
                        {/* NAP: address, phone and email all from Site settings
                            (getSiteSettings). Nothing here is hardcoded. */}
                        <ul className="footer-info">
                            <li>
                                <MapPin size={15} aria-hidden="true" />
                                <span>
                                    {address.streetAddress},<br />
                                    {address.addressLocality}, {address.addressRegion}{" "}
                                    {address.postalCode}
                                </span>
                            </li>
                            <li>
                                <Phone size={15} aria-hidden="true" />
                                <span className="footer-phones">
                                    {contact.callNumbers.map((n) => (
                                        <a key={n.tel} href={`tel:${n.tel}`}>
                                            {n.display}
                                        </a>
                                    ))}
                                </span>
                            </li>
                            <li>
                                <Mail size={15} aria-hidden="true" />
                                <a href={`mailto:${contact.email}`}>{contact.email}</a>
                            </li>
                            <li>
                                <Clock size={15} aria-hidden="true" />
                                <span>
                                    {dayRange} · {openingHours.opens}–{openingHours.closes}
                                </span>
                            </li>
                        </ul>
                    </div>

                    <div className="footer-col footer-mapcol">
                        <h2 className="footer-heading">Find us</h2>
                        {/* The map sits inside the same translucent panel the CTA
                            band uses for its contact card, so the two dark blocks
                            at the end of the page read as one system. */}
                        <div className="footer-mapcard">
                            <div className="footer-map">
                                {/* This is the map that put a Google request on all
                                    140 routes. loading="lazy" (Phase 9) only delayed
                                    it until the footer scrolled into view; MapEmbed
                                    stops it until the visitor agrees, and keeps the
                                    lazy attribute for when they have.
                                    A title is required — this iframe had none before
                                    Phase 9 and Lighthouse flagged it. */}
                                <MapEmbed
                                    title={`${SITE_NAME} studio location map`}
                                    compact
                                    embedUrl={business.mapsEmbedUrl}
                                    mapsUrl={business.mapsUrl}
                                />
                            </div>
                        </div>
                        <a
                            className="footer-directions"
                            href={business.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Get directions
                            <span aria-hidden="true">&rarr;</span>
                        </a>
                    </div>
                </div>

            </div>

            {/* Full-bleed darker strip, mirroring the header: the page opens with a
                --primary-dark topbar above a --primary nav and now closes with the
                same pair inverted. */}
            <div className="footer-bottom-bar">
                <div className="footer-bottom">
                    <p>© {new Date().getFullYear()} {SITE_NAME}</p>
                    <nav className="footer-legal" aria-label="Legal">
                        <Link href="/privacy-policy">Privacy Policy</Link>
                        <Link href="/terms">Terms &amp; Conditions</Link>
                        <ConsentSettingsButton />
                    </nav>
                </div>
            </div>
        </footer>
    );
}
