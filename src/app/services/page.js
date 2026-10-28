// /services — rebuilt in the site's editorial language.
//
// It was the last page still on the pre-redesign styling: a full-width tinted
// hero, boxed cards with icon chips, and a filled arrow button — none of which
// exists anywhere else now. This uses the same primitives as Home, /about and
// the brand pages: `.wrapx` gutters, `.sec`/`.band` hairline section breaks,
// `.secHead` headings, the `.link` underline, and photographs in `--r-card`
// frames.
//
// ONE PAGE FOR ALL THREE SERVICES (owner, 2026-10-27). Each service used to
// link to its own /services/<slug> page; those pages were folded in here and
// their URLs redirect to the matching section (`#salon`, `#residential`,
// `#commercial` — next.config.mjs). So each section now carries what the detail
// page had — the features AND the process steps, in <ServiceTabs> — plus a
// strip of recent projects of that sector (switched off: SHOW_RECENT_WORK) and
// a "Customise your …" button that opens the
// contact form with the service already chosen (Contact.jsx reads `?type=`).
// The previous version is in archive/src/app/services/page.before-detailed-sections.js.
//
// NO PER-SECTOR COUNTS. The page printed each sector's project total until the
// owner removed them on 2026-09-24 — the exact salon / commercial / residential
// figures are not to be shown. Don't reinstate them.
//
// The services are in Sanity (Studio → Services, since 2026-09-28) — the single
// source for these sections; the projects come from getProjects(), the same
// records /projects lists. A sector with no published, photographed project
// (Residential, as of 2026-10-27) simply shows no project strip.

import Link from "next/link";
import { Building2, House, Scissors } from "lucide-react";

import ServiceReveal from "../components/ServiceReveal";
import ServiceTabs from "../components/ServiceTabs";
import ProjectCard from "../components/ProjectCard";
import { Eyebrow } from "../components/SectionHead";
import CmsImage from "../components/CmsImage";
import { getServices, getProjects } from "../lib/content";

export const metadata = {
    title: "Interior Design Services",
    description:
        "Salon, residential and commercial interior design services by Arch Creative Interiors, serving Delhi NCR with customised interiors and premium finishes.",
    alternates: {
        canonical: "/services",
    },
    openGraph: {
        title: "Interior Design Services | Arch Creative Interiors",
        description:
            "Luxury salon, residential and commercial interior design services across Delhi NCR and India.",
        url: "/services",
        images: ["/og-image-landscape.jpg"],
    },
};

// Per service slug: the project Sector it shows work from, the contact form's
// Project type, the button wording and the jump-bar icon. A service added in
// the Studio without an entry still gets a section — a generic button, no
// project strip, no icon.
const SERVICE_UI = {
    salon: { sector: "Salon and studio", type: "Salon", cta: "Customise your salon", work: "Recent salon work", Icon: Scissors },
    residential: { sector: "Residential", type: "Residential", cta: "Customise your home", work: "Recent homes", Icon: House },
    commercial: { sector: "Commercial", type: "Commercial", cta: "Customise your workspace", work: "Recent commercial work", Icon: Building2 },
};

const WORK_SHOWN = 4;

// The "Recent salon work" / "Recent commercial work" strips under each section
// are switched OFF (owner, 2026-10-27: "remove it currently"). Set to true to
// bring them back — the markup and styles are all still here. The projects are
// still looked up either way, because "See all projects" next to the button
// only shows for a sector that has work to see.
const SHOW_RECENT_WORK = false;

// The newest photographed projects with a page in this sector, one per brand
// (Salon would otherwise be four Geetanjali salons in a row).
function recentWork(projects, sector) {
    if (!sector) return [];
    const seen = new Set();
    const out = [];
    for (const p of projects) {
        if (p.sector !== sector || !p.linkable || !p.heroImage) continue;
        const key = p.brand || p.projectName;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(p);
        if (out.length === WORK_SHOWN) break;
    }
    return out;
}

export default async function Services() {
    const [services, projects] = await Promise.all([getServices(), getProjects()]);
    return (
        <main id="main-content" tabIndex={-1}>
            <div className="wrapx">
                <header className="svpHero">
                    <p className="svpKick">What we do</p>
                    <h1>
                        Interior design services,
                        <br />
                        delivered end to end.
                    </h1>
                    {/* No numbers (owner, 2026-09-17 / 2026-10-01): no project
                        total, no city / state counts, no per-sector figures. */}
                    <p className="svpLede">
                        Three sectors, one set of site teams. Completed projects in
                        cities across India — from a single salon to a national rollout.
                    </p>

                    {/* Jump bar — one pill per service, to its section below. */}
                    <nav className="svpJump" aria-label="Services on this page">
                        {services.map((s) => {
                            const Icon = SERVICE_UI[s.slug]?.Icon;
                            return (
                                <a key={s.slug} href={`#${s.slug}`} className="svpJumpLink">
                                    {Icon && <Icon size={16} strokeWidth={1.75} aria-hidden="true" />}
                                    <span>{s.title}</span>
                                </a>
                            );
                        })}
                    </nav>
                </header>
            </div>

            {services.map((service, i) => {
                const ui = SERVICE_UI[service.slug] || {};
                const work = recentWork(projects, ui.sector);
                const enquire = `/contact?type=${encodeURIComponent((ui.type || "").toLowerCase())}#contact-form`;
                return (
                    <ServiceReveal key={service.slug}>
                        <section
                            id={service.slug}
                            className="sec svpSec"
                            data-tone={i % 2 === 0 ? "plain" : "tint"}
                            aria-labelledby={`${service.slug}-title`}
                        >
                            <div className="wrapx">
                                {/* Alternating sides. `data-flip` rather than
                                    :nth-child so the order is set by position in
                                    the data, not by where the section lands in the
                                    DOM — adding a service cannot silently flip the
                                    ones after it. */}
                                <div className="svpRow" data-flip={i % 2 === 1 ? "1" : undefined}>
                                    <div className="svpImg">
                                        <CmsImage
                                            image={service.image}
                                            alt={`${service.title} by Arch Creative Interiors`}
                                            fill
                                            loading={i === 0 ? "eager" : undefined}
                                            sizes="(max-width: 1000px) 100vw, 50vw"
                                            style={{ objectFit: "cover" }}
                                        />
                                        {service.label && <span className="svpImgLabel">{service.label}</span>}
                                    </div>

                                    <div className="svpTxt">
                                        <p className="svpTag">{service.tagline}</p>
                                        <h2 id={`${service.slug}-title`}>{service.title}</h2>
                                        <p className="svpDesc">{service.description}</p>

                                        <ServiceTabs features={service.features} process={service.process} />

                                        <p className="svpActions">
                                            <Link href={enquire} className="bGlow">
                                                {ui.cta || `Enquire about ${service.title}`}
                                            </Link>
                                            {work.length > 0 && (
                                                <Link href="/projects" className="link">
                                                    See all projects
                                                </Link>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {SHOW_RECENT_WORK && work.length > 0 && (
                                    <div className="svpWork">
                                        <p className="svpWorkHead">{ui.work}</p>
                                        <ul className="pgrid svpWorkGrid" data-n={work.length}>
                                            {work.map((p) => (
                                                <li key={p.slug}>
                                                    <ProjectCard project={p} />
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </section>
                    </ServiceReveal>
                );
            })}

            <section className="sec" data-tone="tint">
                <div className="wrapx svpCta">
                    <Eyebrow center>Get advice</Eyebrow>
                    <h2>Not sure which one you need?</h2>
                    <p>
                        Send the floor plan and your opening date. We&apos;ll come back with a
                        programme and a number.
                    </p>
                    <p className="svpCtaActions">
                        <Link href="/contact" className="bGlow">
                            Start an enquiry
                        </Link>
                        <Link href="/projects" className="link">
                            See our work
                        </Link>
                    </p>
                </div>
            </section>
        </main>
    );
}
