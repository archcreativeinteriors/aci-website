import CostingReveal from "../components/CostingReveal";

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

export default function Costing() {
    const includes = [
        "Design Consultation & Planning",
        "2D Layout & 3D Visualization",
        "Material Procurement",
        "Modular Work & Carpentry",
        "False Ceiling & Lighting",
        "Electrical & Plumbing (as required)",
        "Painting & Finishing",
        "Project Supervision & Execution",
    ];


    return (
        <main id="main-content" tabIndex={-1}>
        <CostingReveal>
            <section className="costing-page">

                <div className="costing-hero">

                    <span>Transparent Pricing</span>

                    <h1>
                        Interior Design <br />
                        Project Costing
                    </h1>

                    <p>
                        At Arch Creative Interiors, we provide transparent and
                        competitive pricing tailored to your requirements,
                        lifestyle, and budget expectations.
                    </p>

                </div>

                <div className="costing-card">

                    <div className="costing-price">

                        <h2>₹2,500 – ₹4,500</h2>

                        <span>Per Sq. Ft.</span>

                        <p>
                            Inclusive of materials and complete execution.
                        </p>

                    </div>

                    <div className="costing-divider"></div>

                    <div className="costing-includes">

                        <h3>What’s Included</h3>

                        <div className="includes-grid">
                            {includes.map((item, index) => (
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