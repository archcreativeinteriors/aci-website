import Link from "next/link";
import ScrollReveal from "../components/ScrollReveal";
// The logo rows: the Sanity `clientLogos` singleton — see lib/content/clients.js.
import { getClientLogoRows, clientLogoAlt } from "../lib/content";

export const metadata = {
    title: "Our Clients",
    description:
        "The salons, spas, retail brands, restaurants and offices Arch Creative Interiors has designed interiors for across Delhi NCR and India.",
    alternates: { canonical: "/clients" },
    openGraph: {
        title: "Our Clients | Arch Creative Interiors",
        description:
            "Brands and businesses we've designed interiors for across Delhi NCR and India.",
        url: "/clients",
        images: ["/og-image-landscape.jpg"],
    },
};

// The CSS styles rows of 1-4 tiles; the CTA tile counts as one.
const TILES_PER_ROW_MAX = 4;

export default async function ClientsPage() {
    const logoRows = await getClientLogoRows();
    const logoCount = logoRows.flat().length;

    // The "You can be here" tile joins the last row rather than getting a row of
    // its own, so it reads as "…and you could be next" instead of a stray banner.
    // It widens that row by one — so if the last row is already full (4), the
    // tile takes a row of its own rather than making a 5-tile row the CSS
    // cannot lay out. (The local list's last row has 2; the Studio warns an
    // editor who makes it 4.)
    const last = logoRows.length - 1;
    const rows =
        logoRows[last].length < TILES_PER_ROW_MAX
            ? logoRows.map((row, i) => (i === last ? [...row, { cta: true }] : row))
            : [...logoRows, [{ cta: true }]];

    return (
        <main id="main-content" tabIndex={-1}>
            <ScrollReveal>
                <section className="clients-page">
                    <div className="clients-page-inner">

                        <header className="clients-page-header">
                            <span className="clients-eyebrow">Trusted By</span>
                            <h1>Our Clients</h1>
                            <div className="clients-rule" />
                            {/* No count (owner, 2026-10-01): this opened with
                                "{logoCount}+". */}
                            <p>
                                Salons, spas, retail brands, restaurants and offices
                                have trusted Arch Creative Interiors to design their spaces.
                            </p>
                        </header>

                        <ul className="clients-grid">
                            {rows.map((row, r) =>
                                row.map((logo, i) =>
                                    logo.cta ? (
                                        <li
                                            className="client-tile client-tile--cta"
                                            data-cols={row.length}
                                            key="cta"
                                        >
                                            <Link href="/contact">
                                                <strong>You can be here</strong>
                                                <span>Become a client &rarr;</span>
                                            </Link>
                                        </li>
                                    ) : (
                                        <li
                                            className={`client-tile${logo.wide ? " client-tile--wide" : ""}`}
                                            data-cols={row.length}
                                            // Position, not src: the same logo
                                            // could be placed twice in Sanity.
                                            key={`${r}-${i}`}
                                        >
                                            <span className="client-logo">
                                                <img
                                                    src={logo.src}
                                                    alt={clientLogoAlt(logo)}
                                                    width={logo.width}
                                                    height={logo.height}
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            </span>
                                        </li>
                                    )
                                )
                            )}
                        </ul>

                    </div>
                </section>
            </ScrollReveal>
        </main>
    );
}
