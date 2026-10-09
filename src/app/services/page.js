// /services — rebuilt in the site's editorial language.
//
// It was the last page still on the pre-redesign styling: a full-width tinted
// hero, boxed cards with icon chips, and a filled arrow button — none of which
// exists anywhere else now. This uses the same primitives as Home, /about and
// the brand pages: `.wrapx` gutters, `.sec`/`.band` hairline section breaks,
// `.secHead` headings, the `.link` underline, and photographs in `--r-card`
// frames.
//
// NO PER-SECTOR COUNTS. The page printed each sector's project total (a stat
// strip in the header and "N completed projects" on every row) until the owner
// removed them on 2026-09-24 — the exact salon / commercial / residential
// figures are not to be shown. Each row keeps its link to the portfolio,
// worded without a number. Don't reinstate either.
//
// The services are in Sanity (Studio → Services, since 2026-09-28) — the single
// source for these rows, the detail pages and the sitemap.

import Link from "next/link";
import { Check } from "lucide-react";

import ServiceReveal from "../components/ServiceReveal";
import { Eyebrow } from "../components/SectionHead";
import CmsImage from "../components/CmsImage";
import { getServices, getSiteSettings } from "../lib/content";

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

export default async function Services() {
    const [{ stats }, services] = await Promise.all([getSiteSettings(), getServices()]);
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
                    {/* The project total opened the second sentence until
                        2026-09-17, when the owner removed it site-wide. Cities
                        and states are typed in Site settings. The per-sector
                        stat strip that followed was removed on 2026-09-24 and
                        replaced by the one combined line below.
                        No numbers at all since 2026-10-01 (owner): the city /
                        state counts and the "1000+" line are text now; `stats`
                        is still loaded, not printed. */}
                    <p className="svpLede">
                        Three sectors, one set of site teams. Completed projects in
                        cities across India — from a single salon to a national rollout.
                    </p>

                    <p className="svpSpaces">
                        <span>
                            Salon, commercial and residential spaces, designed and
                            delivered end to end.
                        </span>
                    </p>
                </header>
            </div>

            {services.map((service, i) => {
                return (
                    <ServiceReveal key={service.slug}>
                        <section className="sec" data-tone={i % 2 === 0 ? "plain" : "tint"}>
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
                                            sizes="(max-width: 1000px) 100vw, 50vw"
                                            style={{ objectFit: "cover" }}
                                        />
                                    </div>

                                    <div className="svpTxt">
                                        <p className="svpTag">{service.tagline}</p>
                                        <h2>{service.title}</h2>
                                        <p className="svpDesc">{service.description}</p>

                                        <p className="svpCount">
                                            <Link href="/projects">See our completed projects</Link>
                                        </p>

                                        <ul className="svpFeatures">
                                            {service.features.map((item) => (
                                                <li key={item}>
                                                    <Check size={15} aria-hidden="true" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <p className="svpMore">
                                            <Link
                                                className="link"
                                                href={`/services/${service.slug}`}
                                            >
                                                Explore {service.title}
                                            </Link>
                                        </p>
                                    </div>
                                </div>
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
