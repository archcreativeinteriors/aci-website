import Link from "next/link";
import { notFound } from "next/navigation";
import {
    ArrowLeft,
    Check,
} from "lucide-react";
import { BsArrowRight } from "react-icons/bs";
import ScrollReveal from "../../../app/components/ServiceReveal.jsx";
import JsonLd from "../../../app/components/JsonLd.jsx";
import Breadcrumbs from "../../../app/components/Breadcrumbs.jsx";
import { Eyebrow } from "../../../app/components/SectionHead.jsx";
import { breadcrumbJsonLd } from "../../../app/lib/jsonld.js";
import CmsImage from "../../../app/components/CmsImage.jsx";
import { getServices, getService, shareImageUrl } from "../../../app/lib/content/index.js";

export async function generateStaticParams() {
    return (await getServices()).map((service) => ({ slug: service.slug }));
}

// The Studio's Description is page copy (shown in full on the page) and runs
// 180–200 characters; search results cut a snippet near 160. The meta tag gets
// whole sentences from its start that fit, and the full text only when even
// the first sentence is longer (then search engines trim it themselves —
// better than a sentence cut mid-word here).
const META_MAX = 160;
function metaDescription(text = "") {
    const t = text.trim();
    if (t.length <= META_MAX) return t;
    let out = "";
    for (const s of t.match(/[^.!?]+[.!?]+(\s|$)/g) || []) {
        if ((out + s).trim().length > META_MAX) break;
        out += s;
    }
    return out.trim() || t;
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const service = await getService(slug);

    if (!service) {
        return { title: "Service Not Found" };
    }

    const description = metaDescription(service.description);

    return {
        title: `${service.title} — ${service.label}`,
        description,
        alternates: { canonical: `/services/${service.slug}` },
        openGraph: {
            title: service.title,
            description,
            url: `/services/${service.slug}`,
            images: [shareImageUrl(service.image)],
        },
    };
}

export default async function ServiceDetail({ params }) {

    const { slug } = await params;

    const service = await getService(slug);

    if (!service) {
        notFound();
    }

    const breadcrumbItems = [
        { name: "Home", path: "/" },
        { name: "Services", path: "/services" },
        { name: service.title, path: `/services/${service.slug}` },
    ];

    return (
        <main id="main-content" tabIndex={-1} className="service-detail-page">
            <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />

            {/* HERO */}

            <div className="service-detail-hero">

                <CmsImage
                    image={service.image}
                    alt={service.title}
                    fill
                    loading="eager"
                    sizes="100vw"
                    style={{ objectFit: "cover" }}
                />

                <div className="service-detail-overlay"></div>


                <div className="service-detail-content">

                    <div className="previous-btn-services">
                        <Link href="/services" className="back-btn">
                            <ArrowLeft size={18} />
                            Back to Services
                        </Link>
                    </div>

                    <span>{service.label}</span>

                    <h1>{service.title}</h1>

                    <p>{service.description}</p>

                </div>

            </div>

            <Breadcrumbs items={breadcrumbItems} />

            {/* BODY */}

            <div className="service-detail-wrapper">

                {/* FEATURES */}

                <ScrollReveal>
                    <div className="service-info-card">

                        <Eyebrow>Scope</Eyebrow>
                        <h2>What We Offer</h2>

                        <div className="service-features-grid">
                            {service.features.map((item, index) => (
                                <div className="detail-feature" key={index}>
                                    <Check size={18} />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>

                    </div>

                </ScrollReveal>
                {/* PROCESS */}

                <ScrollReveal>
                    <div className="service-process-card">

                        <Eyebrow>Process</Eyebrow>
                        <h2>Our Process</h2>

                        <div className="process-list">
                            {service.process.map((step, index) => (
                                <div className="process-item" key={index}>

                                    <div className="process-number">
                                        0{index + 1}
                                    </div>

                                    <div className="process-text">
                                        <h3>{step}</h3>
                                    </div>

                                </div>
                            ))}
                        </div>

                    </div>
                </ScrollReveal>

                {/* CTA */}

                <ScrollReveal>
                    <div className="service-cta-box">

                        <Eyebrow center>Get started</Eyebrow>
                        <h2>
                            Ready To Transform Your Space?
                        </h2>

                        <p>
                            Book a free consultation with our interior experts today.
                        </p>

                        <Link href="/contact" className="service-cta-btn">
                            Book Consultation
                            <BsArrowRight size={18} />
                        </Link>

                    </div>
                </ScrollReveal>

            </div>

        </main>
    );
}