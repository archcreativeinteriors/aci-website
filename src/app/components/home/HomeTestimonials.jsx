// Brief §4 Home item 7 / §3.8 — three testimonials.
// The list is passed in by app/page.js — already cut to the ones shown — so the
// cards and the page's Review JSON-LD are the same records. It comes from
// getTestimonials() (lib/content/people.js): Sanity `testimonial` documents in
// their `order`.
//
// STARS come from each record's `rating` field, not a hardcoded five — drop the
// field from a row and that card shows no stars. They are presentation only:
// lib/jsonld.js reviewJsonLd() still emits no `reviewRating`, because a rating
// a business declares about itself on its own site is ineligible for review
// rich results and marking it up invites a manual action. See the note at the
// top of the data file.

import { Star } from "lucide-react";
import SectionHead from "../SectionHead";

const MAX_STARS = 5;

function Rating({ value }) {
    if (!value) return null;
    const filled = Math.max(0, Math.min(MAX_STARS, Math.round(value)));

    return (
        // One label for the whole row; the glyphs themselves are decorative, so
        // a screen reader hears "Rated 5 out of 5" rather than "star" five times.
        <div
            className="qStars"
            role="img"
            aria-label={`Rated ${filled} out of ${MAX_STARS}`}
        >
            {Array.from({ length: MAX_STARS }, (_, i) => (
                <Star
                    key={i}
                    size={16}
                    aria-hidden="true"
                    className={i < filled ? "qStar qStar--on" : "qStar"}
                    fill={i < filled ? "currentColor" : "none"}
                    strokeWidth={i < filled ? 0 : 1.5}
                />
            ))}
        </div>
    );
}

export default function HomeTestimonials({ testimonials }) {
    return (
        <section className="sec" data-tone="plain">
            <div className="wrapx">
                <SectionHead eyebrow="Testimonials">What our clients say</SectionHead>
                <div className="tst">
                    {testimonials.map((t) => (
                        <figure className="q" key={t.name}>
                            <Rating value={t.rating} />
                            <blockquote>
                                <p>{t.text}</p>
                            </blockquote>
                            <figcaption>
                                <span className="who">{t.name}</span>
                                <span className="role">{t.role}</span>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </div>
        </section>
    );
}
