// Brief §3.2 — full-bleed photo, three-stop gradient, kicker / H1 / sub /
// two buttons / stats row.
//
// A plain Server Component on purpose. The previous hero carried a JS-gated
// slideshow and splash loader that twice left the page blank or headless on a
// slow connection (CLAUDE.md Phase 10.11 / 10.13c). Nothing here needs a bundle:
// no opacity:0 waiting on a class, no interval, no loader state.
//
// NUMBERS (owner's call, 2026-09-17): the headline keeps the 1000+ claim and
// the PROJECT TOTAL IS GONE FROM THE WHOLE SITE. It used to sit in the stats row
// below as "192 Documented", two inches under an h1 saying 1000+ — one block,
// two figures five times apart. Only one of them could survive and the owner
// kept the headline.
//
// So: do not re-add a project count here, and do not "restore" the derived one
// for consistency with the other tiles. The rollout sentence stays derived.
//
// NO NUMBERS AT ALL (owner, 2026-10-01): the stats row's "1000+ Spaces
// delivered · 42 Cities · 16 States" became three text facts, each taken from
// copy the site already states (hero paragraph, eyebrow, "What we do"). The
// typed figures (spaces / cities / states, Site settings) are still loaded;
// they are just not printed. The h1's "1000+" is Sanity text the owner will
// reword.

import Link from "next/link";
import { getHomeHero, getSiteSettings } from "../../lib/content";
import CmsImage from "../CmsImage";
import HeroPicture from "./HeroPicture";

// CONTENT (photographs, kicker, heading, paragraph) comes from
// getHomeHero() (lib/content/home.js) — the Sanity `homeHero` singleton.
// The buttons and the stats row's three facts stay here.
//
// Cross-fade slideshow, driven ENTIRELY by CSS (see `.xheroSlide` /
// `@keyframes heroCross` in styles/home.css). There is no interval, no state
// and no "use client" — this component stays a Server Component.
//
// That constraint is not stylistic. The old Hero.jsx ran this on a setInterval
// gated behind the first image's onLoad, which never fires on a cache hit, so
// the slideshow froze on slide 1 and the splash loader never cleared
// (CLAUDE.md Phase 10.13). A CSS animation cannot fail that way — it needs no
// bundle, so there is nothing to stall.
//
// Order matters: the FIRST entry is the LCP image. Only it (and the mobile
// hero, which is the same <HeroPicture>) gets high priority; loading four
// full-bleed photographs eagerly would make the hero slower, not richer. The
// rest are decorative repeats of the same subject, so they are
// alt="" + aria-hidden rather than announced four times. The CSS is timed for
// EXACTLY four slides; the Sanity schema enforces that count.
export default async function HomeHero() {
    // The paragraph's rollout figures are already filled in (lib/content/home.js
    // derives them from brandsByCount()[0], never from typed numbers).
    const [hero, { stats: numbers }] = await Promise.all([getHomeHero(), getSiteSettings()]);

    // Three text facts, no figures (see the header). `numbers` is unused now.
    // `.xheroStats` is flex-wrap, so the tiles wrap without touching CSS.
    const stats = [
        { n: "Turnkey", l: "Design to handover" },
        { n: "Pan-India", l: "Site teams nationwide" },
        { n: "Since 2005", l: "One Delhi studio" },
    ];

    return (
        <header className="xhero">
            <div className="xheroImg">
                {hero.slides.map((slide, i) => (
                    <div
                        className="xheroSlide"
                        key={i}
                        aria-hidden={i > 0 ? "true" : undefined}
                    >
                        {i === 0 ? (
                            // The LCP photo: see HeroPicture for why this slot
                            // and the mobile one render the same <picture>.
                            <HeroPicture
                                wide={slide.image}
                                portrait={hero.mobileImage.image}
                                alt={slide.alt || ""}
                                blurFrom={slide.image}
                            />
                        ) : (
                            // Lazy (the default): on a phone .xheroImg is
                            // display:none, so these are never fetched there.
                            <CmsImage
                                image={slide.image}
                                alt=""
                                fill
                                sizes="(max-width: 767px) 1px, 100vw"
                                style={{ objectFit: "cover" }}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Mobile hero. The four landscape slides crop to a useless
                vertical strip on a phone (CLAUDE.md Phase 10.13), so below
                768px .xheroImg is hidden entirely and this single portrait
                photograph takes over. 768px is the same line the header uses.

                THIS IS THE LCP ELEMENT ON A PHONE, so it must never be lazy —
                left lazy, Lighthouse mobile scored 73 with a 5.4s LCP and
                flagged lcp-lazy-loaded. It is the same <HeroPicture> as the
                first slide (only alt and blur differ), which is what makes each
                device download just one of the two photos. */}
            <div className="xheroMob">
                <HeroPicture
                    wide={hero.slides[0].image}
                    portrait={hero.mobileImage.image}
                    alt={hero.mobileImage.alt || ""}
                    blurFrom={hero.mobileImage.image}
                />
            </div>

            <div className="wrapx xheroIn">
                {hero.eyebrow && <p className="xheroKick">{hero.eyebrow}</p>}

                <h1>{hero.heading}</h1>

                <p className="xheroSub">{hero.paragraph}</p>

                <div className="xheroBtns">
                    <Link href="/contact" className="bWhite">
                        Get free consultation
                    </Link>
                    <Link href="/projects" className="bGhost">
                        View projects
                    </Link>
                </div>

                <dl className="xheroStats">
                    {stats.map((s) => (
                        <div className="hs" key={s.l}>
                            <dt className="hsN">
                                {s.n}
                            </dt>
                            <dd className="hsL">{s.l}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </header>
    );
}
