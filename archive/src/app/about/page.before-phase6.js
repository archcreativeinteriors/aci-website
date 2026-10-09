// /about — the single company page. Was two: /about (155 words) and /studio
// (350), which repeated the founder's name, both of his paragraphs and his
// quote word for word, and competed with each other in search. /studio now 308s
// here (next.config.mjs) and this page carries everything.
//
// /about survived rather than /studio because it is the conventional name, it
// is the one in the navbar, and it has the existing search authority. The
// CONTENT is the studio page's — which is the brief §4 "Studio" content; the
// brief was written assuming no /about existed in this shape.
//
// Order: who we are · founder · how a project runs · the team · common
// questions · CTA. Company first, practice second, objections last, then ask.
//
// The `embedded` prop is gone. It existed so the old home page could render
// this route as a section; the Home rebuild dropped that, leaving the
// Heading/SubHeading/Wrapper machinery with no caller.

import Link from "next/link";

import ScrollReveal from "../components/ScrollReveal";
import AboutReveal from "../components/AboutReveal";
import JsonLd from "../components/JsonLd";
import CmsImage from "../components/CmsImage";
import { faqJsonLd } from "../lib/jsonld";
import { BUSINESS } from "../lib/site";
import { getAboutIntro, getFaqs, getSiteSettings } from "../lib/contentSource";
import { sanityImageLoader } from "../lib/cms/image";
import StatCounter from "../components/StatCounter";
import SectionHead, { Eyebrow } from "../components/SectionHead";
import PersonPhoto from "../components/PersonPhoto";
import { getFounder, getTeam } from "../lib/teamSource";

// The share image follows the intro photo: the Sanity one (sized for social
// cards) once an editor sets it, else the local file in public/.
export async function generateMetadata() {
    const { image } = await getAboutIntro();
    return {
        title: "About Us",
        description:
            "The studio behind Arch Creative Interiors — the founder, the team, how a fit-out runs from survey to handover, and the questions clients ask first.",
        alternates: { canonical: "/about" },
        openGraph: {
            title: "About | Arch Creative Interiors",
            description:
                "Twenty years of salon, spa, commercial and residential interiors. The founder, the team, and how a project runs.",
            url: "/about",
            images: [
                image?.url
                    ? sanityImageLoader({ src: image.url, width: 1200, quality: 80 })
                    : "/images/about-2.jpg",
            ],
        },
    };
}

// Salon-fit-out specific on purpose: the mall/landlord approval step and "one
// site manager throughout" are the two things clients ask about, and neither
// appears in the generic process copy in components/HowWeWork.jsx.
const STAGES = [
    ["Stage 1", "Survey", "Site measure, services audit, landlord and mall constraints recorded."],
    ["Stage 2", "Drawings", "Layout, elevations and the brand's fit-out manual reconciled."],
    ["Stage 3", "Approvals", "Mall or society sign-off, material samples, costing frozen."],
    ["Stage 4", "Execution", "Civil, electrical, plumbing, joinery. One site manager throughout."],
    ["Stage 5", "Handover", "Snag list closed, warranties issued, staff walked through."],
];

export default async function About() {
    // The founder and the team — Sanity once connected, lib/data/team.js until
    // then. See lib/teamSource.js.
    // FAQs and the headline numbers — Site settings / faq documents, else the
    // local modules. The intro block (heading, photo, paragraphs) — the About
    // page document, else lib/data/about.js. See lib/contentSource.js.
    const [intro, founder, team, faqs, { stats }] = await Promise.all([
        getAboutIntro(),
        getFounder(),
        getTeam(),
        getFaqs(),
        getSiteSettings(),
    ]);

    const office = `${BUSINESS.shortAddress.split(",")[0]}, ${BUSINESS.address.addressLocality}`;

    return (
        <main id="main-content" tabIndex={-1}>
            {/* FAQPage schema follows the questions. It was on Home, then on
                /studio; it belongs wherever they are actually rendered, and
                emitting it on a page without them is a policy violation. */}
            <JsonLd data={faqJsonLd(faqs)} />

            <AboutReveal>
                <section className="about" data-tone="tint">
                    <div className="about-top">
                        {/* Was a bare grey <span> with no rule. Left alone it sat
                            directly above the blue "ABOUT US" eyebrow a few
                            hundred pixels below and read as a different kind of
                            label — which is the inconsistency this change set
                            out to remove. */}
                        <Eyebrow center>About Arch Creative Interiors</Eyebrow>
                        <h1>{intro.heading}</h1>
                    </div>

                    <div className="about-grid">
                        <div className="about-image">
                            {/* CmsImage: the local static import keeps its blur
                                placeholder, a Sanity photo gets its LQIP. */}
                            <CmsImage
                                image={intro.image}
                                alt={intro.imageAlt}
                                fill
                                draggable={false}
                                priority
                                sizes="(max-width:768px) 100vw, 50vw"
                                style={{ objectFit: "cover" }}
                            />
                        </div>

                        <div className="about-content">
                            {/* The decorative `.about-line` div that sat here is
                                gone: the eyebrow below now draws its own 64px
                                rule, so the block rendered two stacked lines a
                                few pixels apart. */}
                            <Eyebrow>About us</Eyebrow>
                            <h2>{intro.sectionHeading}</h2>

                            {/* The first paragraph is the studio's origin story,
                                moved here from the home studio block. Its rollout
                                figures ("a 104-space … across 15 states") are
                                placeholders filled from the project list by
                                getAboutIntro() — §7, derive rather than type. */}
                            {intro.paragraphs.map((para, i) => (
                                <p key={i}>{para}</p>
                            ))}
                        </div>
                    </div>

                    <ScrollReveal>
                        {/* The same THREE figures as the home hero, so the two
                            pages cannot disagree — keep them in step. A fourth
                            tile, "{PROJECT_STATS.projects} Documented", sat
                            second until 2026-09-17; the owner removed the
                            project total site-wide because it contradicted the
                            1000+ claim standing right beside it. All three
                            figures are typed in Site settings (owner, 2026-09-24).

                            `.about-stats` is an explicit column count, unlike
                            the home hero's flex row — it was repeat(4, 1fr) and
                            is now repeat(3, 1fr). If a tile is ever added or
                            removed, about.css has to move with it. */}
                        <div className="about-stats">
                            <div className="stat">
                                <h3><StatCounter value={stats.spacesDelivered} suffix="+" /></h3>
                                <span>Spaces delivered</span>
                            </div>

                            <div className="stat">
                                <h3><StatCounter value={stats.cities} /></h3>
                                <span>Cities</span>
                            </div>

                            <div className="stat">
                                <h3><StatCounter value={stats.states} /></h3>
                                <span>States</span>
                            </div>
                        </div>
                    </ScrollReveal>
                </section>
            </AboutReveal>

            {/* ── founder ───────────────────────────────────────────────────
                One founder block on the site now. components/Founder.jsx held a
                second copy of this same name, copy and quote and is no longer
                rendered anywhere. */}
            <section className="sec" data-tone="plain">
                <div className="wrapx">
                    <SectionHead eyebrow="Leadership">Founder</SectionHead>
                    <div className="studio">
                        <div className="studioImg">
                            <PersonPhoto
                                photo={founder.photo}
                                name={founder.name}
                                designation={founder.designation}
                                sizes="(max-width: 1000px) 100vw, 360px"
                            />
                        </div>
                        <div>
                            <div className="sdName">{founder.name}</div>
                            <div className="sdRole">{founder.designation}</div>
                            {founder.bio.map((para) => (
                                <p className="sdPara" key={para}>
                                    {para}
                                </p>
                            ))}
                            {founder.quote && (
                                <blockquote className="sdQuote">
                                    <span className="sdQuoteMark">In his words</span>
                                    {`“${founder.quote}”`}
                                </blockquote>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── how a project runs ───────────────────────────────────────── */}
            <section className="sec" data-tone="tint">
                <div className="wrapx">
                    <SectionHead
                        eyebrow="Process"
                        description="Most salon fit-outs complete in eight to twelve weeks."
                    >
                        How a project runs
                    </SectionHead>
                    <div className="sdSteps">
                        {STAGES.map(([stage, title, desc]) => (
                            <div className="sdStep" key={stage}>
                                <div className="sdStepN">{stage}</div>
                                <h3>{title}</h3>
                                <p>{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── the team ─────────────────────────────────────────────────── */}
            <section className="sec" data-tone="plain">
                <div className="wrapx">
                    <SectionHead
                        eyebrow="People"
                        description={`Designers, project managers and site supervisors, working out of ${office}.`}
                    >
                        The team
                    </SectionHead>
                    <div className="sdGrid4">
                        {team.map((member) => (
                            <div key={member.name}>
                                <div className="frame">
                                    <PersonPhoto
                                        photo={member.photo}
                                        name={member.name}
                                        designation={member.designation}
                                        sizes="(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 24vw"
                                    />
                                </div>
                                <span className="cap">{member.name}</span>
                                <span className="capSub">{member.designation}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── common questions ─────────────────────────────────────────── */}
            <section className="sec" data-tone="tint">
                <div className="wrapx">
                    <SectionHead eyebrow="FAQ">Common questions</SectionHead>
                    {/* <details>, not a JS accordion. The demo's version hides
                        every answer behind a click handler, which would break the
                        no-JS rule AND make the FAQPage schema above assert
                        content the HTML does not contain. */}
                    <div className="sdFaqList">
                        {faqs.map((item, i) => (
                            <details
                                className="sdFaq"
                                key={item.q}
                                // Native one-open-at-a-time. No state, no
                                // handler — and an older browser that ignores
                                // it just allows several open at once.
                                name="about-faq"
                                open={i === 0}
                            >
                                <summary className="sdFaqQ">
                                    <span className="sdFaqIcon" aria-hidden="true" />
                                    {item.q}
                                    <span className="sdFaqChev" aria-hidden="true" />
                                </summary>
                                <div className="sdFaqA">{item.a}</div>
                            </details>
                        ))}
                    </div>
                    <p className="sdFaqFoot">
                        {/* The shared CTA button, not a text link - same
                            primitive /services and the brand pages close with. */}
                        <Link className="bGlow" href="/contact">
                            Start an enquiry
                        </Link>
                    </p>
                </div>
            </section>
        </main>
    );
}
