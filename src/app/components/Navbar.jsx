"use client";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { MapPin, Phone, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import logoImg from "../../../public/aci-logo.png"

// Blogs is deliberately NOT here — it lives in the footer only (FOOTER_LINKS),
// on the owner's instruction. It keeps its footer link and sitemap entry, so
// the "every top-level route is reachable from the footer" invariant holds.
const NAV_LINKS = [
    { href: "/", label: "Home", match: (p) => p === "/" },
    { href: "/projects", label: "Projects", match: (p) => p.startsWith("/projects") },
    { href: "/services", label: "Services", match: (p) => p.startsWith("/services") },
    { href: "/about", label: "About", match: (p) => p === "/about" },
    { href: "/clients", label: "Clients", match: (p) => p === "/clients" },
    { href: "/contact", label: "Contact", match: (p) => p === "/contact" },
];

// `contact` (email + primary phone) and `business` (short address, maps link),
// both from Site settings, are passed in by the root layout: this is a Client
// Component, so it cannot fetch from Sanity itself.
export default function Navbar({ contact, business }) {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Close the mobile menu on client-side navigation.
    useEffect(() => {
        setMenuOpen(false);
    }, [pathname]);

    // One decoration on the desktop link row, pure enhancement: an underline
    // that slides between links and rests on the current page. The pointer-
    // following light that used to sit alongside it was removed on 2026-09-22
    // (owner) — the underline is the whole hover affordance now. It gates
    // nothing: with no JS the nav is exactly as it was and the static .active
    // underline still shows (CSS drops it only once this effect adds
    // .has-pill).
    const navLinksRef = useRef(null);

    useEffect(() => {
        const el = navLinksRef.current;
        if (!el) return;

        /* ---- the travelling underline ---------------------------------- */
        // Measured against the <ul>, not offsetLeft: each <li> is positioned,
        // so an <a>'s offsetParent is its own <li> and offsetLeft would be ~0
        // for every link.
        const place = (target) => {
            if (!target) return;
            const a = el.getBoundingClientRect();
            const b = target.getBoundingClientRect();
            el.style.setProperty("--pill-x", `${b.left - a.left}px`);
            el.style.setProperty("--pill-w", `${b.width}px`);
        };
        const activeLink = () => el.querySelector("a.active");
        const rest = () => place(activeLink());

        rest();
        // Added AFTER the first measurement, so the underline fades in where it
        // belongs instead of sliding in from x=0 on every page load.
        el.classList.add("has-pill");

        const onOver = (e) => {
            const a = e.target.closest("a");
            if (a && el.contains(a)) place(a);
        };

        // Re-measure on layout change: the row re-flows at the 1200px tighten
        // block, and web fonts land after first paint.
        const ro = new ResizeObserver(rest);
        ro.observe(el);

        el.addEventListener("pointerover", onOver);

        // The underline slides back to the current page's link when the
        // pointer leaves the row.
        const onLeave = () => rest();
        el.addEventListener("mouseleave", onLeave);

        return () => {
            ro.disconnect();
            el.removeEventListener("pointerover", onOver);
            el.removeEventListener("mouseleave", onLeave);
        };
        // pathname: the active link changes on navigation, so the underline has
        // to be re-measured onto its new home.
    }, [pathname]);

    const closeMenu = () => setMenuOpen(false);

    return (
        <>
            {/* Always visible (desktop) — every page's top padding is bumped by
                its 32px height, see styles/navbar.css. */}
            <div className="topbar">
                <div className="topbar-inner">
                    <a
                        href={business.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="topbar-item"
                    >
                        <MapPin size={13} />
                        <span>{business.shortAddress}</span>
                    </a>
                    {/* Both call numbers, each its own tel: link (lib/contact.js). */}
                    <span className="topbar-item topbar-phones">
                        <Phone size={13} />
                        {contact.callNumbers.map((n, i) => (
                            <Fragment key={n.tel}>
                                {i > 0 && <span className="topbar-sep" aria-hidden="true">·</span>}
                                <a href={`tel:${n.tel}`}>{n.display}</a>
                            </Fragment>
                        ))}
                    </span>
                    <a href={`mailto:${contact.email}`} className="topbar-item">
                        <Mail size={13} />
                        <span>{contact.email}</span>
                    </a>
                </div>
            </div>

        <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>

            {/* No-JS fallback: this checkbox drives `.mobile-menu` via CSS
                (`.nav-toggle:checked ~ .mobile-menu`). React keeps it in sync so
                the icon swap + close-on-navigate still work once JS loads. */}
            <input
                type="checkbox"
                id="nav-toggle"
                className="nav-toggle"
                aria-label="Toggle navigation menu"
                checked={menuOpen}
                onChange={(e) => setMenuOpen(e.target.checked)}
            />

            <div className="nav-inner">

                <Link href="/" className="logo" onClick={closeMenu}>
                    <Image
                        src={logoImg}
                        alt="Arch Creative Interiors"
                        width={180}
                        height={60}
                        loading="eager"
                    />
                </Link>

                <ul className="nav-links" ref={navLinksRef}>
                    {NAV_LINKS.map((link) => (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                className={link.match(pathname) ? "active" : ""}
                            >
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>


                <div className="nav-right">
                    <Link href="/contact" className="cta">
                        <span>Get Free Consultation</span>
                    </Link>

                    <label htmlFor="nav-toggle" className="menu-icon" aria-hidden="true">
                        <span className="menu-bar"></span>
                        <span className="menu-bar"></span>
                        <span className="menu-bar"></span>
                    </label>
                </div>
            </div>


            <div className="mobile-menu">
                {NAV_LINKS.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={link.match(pathname) ? "active" : ""}
                        onClick={closeMenu}
                    >
                        {link.label}
                    </Link>
                ))}
            </div>

        </nav>
        </>
    );
}
