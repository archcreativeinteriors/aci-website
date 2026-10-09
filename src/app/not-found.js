// The 404 page (owner, 2026-10-07: "attractive, nice and enhanced"). The
// previous version — a plain "404" and a row of text links — is in
// archive/src/app/not-found.before-redesign.js.
//
// It renders for ANY unknown URL, and for every notFound() a detail page calls
// (a project, brand, state, service or blog slug that does not exist). Next
// answers with HTTP 404 and adds <meta name="robots" content="noindex"> itself,
// so a mistyped URL never ends up in search results.
//
// Server Component, no JS: every link works without it. The illustration is an
// architect's elevation of an arched doorway — the brand's own shape — drawn
// inline, so nothing extra loads. No animation that runs by itself: the site
// keeps those to the home hero (button-glow.css); hover only.
//
// Phone and email come from Site settings, like every other NAP on the site.

import { Fragment } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Images, Mail, MessagesSquare, Phone, Sofa } from "lucide-react";
import { getSiteSettings } from "./lib/content";

export const metadata = {
    title: "Page Not Found",
    description:
        "This page could not be found. Browse our salon, commercial and residential interior design work, or get in touch with the studio.",
};

const ROOMS = [
    { href: "/projects", icon: Images, title: "Projects", text: "Salons, studios and spaces we have delivered" },
    { href: "/services", icon: Sofa, title: "Services", text: "Salon, commercial and residential interiors" },
    { href: "/about", icon: Building2, title: "About the studio", text: "Who we are and how a project runs" },
    { href: "/contact", icon: MessagesSquare, title: "Contact", text: "Book a free consultation" },
];

export default async function NotFound() {
    const { contact } = await getSiteSettings();

    return (
        <main id="main-content" tabIndex={-1} className="nf">
            <div className="nf-inner">
                <svg className="nf-art" viewBox="0 0 320 250" aria-hidden="true" focusable="false">
                    {/* faint plan grid */}
                    <g className="nf-grid">
                        {[40, 80, 120, 160, 200].map((y) => <line key={`h${y}`} x1="0" y1={y} x2="320" y2={y} />)}
                        {[40, 80, 120, 160, 200, 240, 280].map((x) => <line key={`v${x}`} x1={x} y1="0" x2={x} y2="230" />)}
                    </g>
                    {/* the doorway: outer arch, inner moulding, threshold */}
                    <path className="nf-arch" d="M86 222 V112 A74 74 0 0 1 234 112 V222" />
                    <path className="nf-arch nf-arch--inner" d="M100 222 V114 A60 60 0 0 1 220 114 V222" />
                    <path className="nf-fill" d="M100 222 V114 A60 60 0 0 1 220 114 V222 Z" />
                    <line className="nf-floor" x1="40" y1="222" x2="280" y2="222" />
                    {/* dimension line across the opening, as on a drawing */}
                    <g className="nf-dim">
                        <line x1="100" y1="236" x2="220" y2="236" />
                        <line x1="100" y1="231" x2="100" y2="241" />
                        <line x1="220" y1="231" x2="220" y2="241" />
                    </g>
                    <text className="nf-code" x="160" y="182" textAnchor="middle">404</text>
                </svg>

                <p className="nf-kick">Error 404 · Page not found</p>
                <h1>This room isn&rsquo;t on the plan.</h1>
                <p className="nf-text">
                    The page you were looking for may have moved, been renamed, or never existed.
                    Let&rsquo;s get you somewhere worth stepping into.
                </p>

                <div className="nf-btns">
                    <Link href="/" className="bGlow">Back to home</Link>
                    <Link href="/projects" className="nf-ghost">
                        See our projects
                        <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
                    </Link>
                </div>

                <nav className="nf-rooms" aria-label="Popular pages">
                    {ROOMS.map(({ href, icon: Icon, title, text }) => (
                        <Link key={href} href={href} className="nf-room">
                            <span className="nf-roomIcon" aria-hidden="true">
                                <Icon size={20} strokeWidth={1.75} />
                            </span>
                            <span className="nf-roomTitle">{title}</span>
                            <span className="nf-roomText">{text}</span>
                            <ArrowRight className="nf-roomArrow" size={16} strokeWidth={2} aria-hidden="true" />
                        </Link>
                    ))}
                </nav>

                <p className="nf-help">
                    Followed a link here? Tell us and we&rsquo;ll fix it:{" "}
                    {contact.callNumbers.map((n) => (
                        <Fragment key={n.tel}>
                            <a href={`tel:${n.tel}`}>
                                <Phone size={14} strokeWidth={2} aria-hidden="true" />
                                {n.display}
                            </a>
                            <span className="nf-sep" aria-hidden="true">·</span>
                        </Fragment>
                    ))}
                    <a href={`mailto:${contact.email}`}>
                        <Mail size={14} strokeWidth={2} aria-hidden="true" />
                        {contact.email}
                    </a>
                </p>
            </div>
        </main>
    );
}
