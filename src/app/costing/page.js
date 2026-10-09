import { Fragment } from "react";
import CostingReveal from "../components/CostingReveal";
import { getCostingPage } from "../lib/content";

export const metadata = {
    title: "Interior Design Cost & Pricing",
    description:
        "Transparent interior design pricing from Arch Creative Interiors — ₹2,500–₹4,500 per sq. ft. inclusive of materials, modular work, finishing and execution.",
    alternates: { canonical: "/costing" },
    openGraph: {
        title: "Interior Design Project Costing | Arch Creative Interiors",
        description:
            "Transparent per-sq-ft interior design pricing inclusive of materials and complete execution.",
        url: "/costing",
        images: ["/og-image-landscape.jpg"],
    },
};

// The page's text is in Sanity (Studio → Costing page) since 2026-09-28; the
// version that was typed here is in archive/src/app/costing/page.before-phase6.js.
// The SEO description above repeats the price range — change it here too when
// the price in the Studio changes.
export default async function Costing() {
    const page = await getCostingPage();
    // A new line in the Studio's heading is a line break on the page.
    const headingLines = page.heading.split("\n");

    return (
        <main id="main-content" tabIndex={-1}>
        <CostingReveal>
            <section className="costing-page">

                <div className="costing-hero">

                    <span>{page.eyebrow}</span>

                    <h1>
                        {headingLines.map((line, i) =>
                            i < headingLines.length - 1 ? (
                                <Fragment key={i}>
                                    {`${line} `}
                                    <br />
                                </Fragment>
                            ) : (
                                line
                            )
                        )}
                    </h1>

                    <p>{page.intro}</p>

                </div>

                <div className="costing-card">

                    <div className="costing-price">

                        <h2>{page.price}</h2>

                        <span>{page.unit}</span>

                        <p>{page.note}</p>

                    </div>

                    <div className="costing-divider"></div>

                    <div className="costing-includes">

                        <h3>{page.includesHeading}</h3>

                        <div className="includes-grid">
                            {page.includes.map((item, index) => (
                                <div className="include-item" key={index}>
                                    <span>✔</span>
                                    <p>{item}</p>
                                </div>
                            ))}
                        </div>

                    </div>

                </div>

            </section>
        </CostingReveal>
        </main>
    );
}
