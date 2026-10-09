"use client";

// Brief §4 Home item 4 / §3.6 — sticky preview column + brand tiles.
//
// The tiles are real, readable content and are rendered in full on the server;
// this component is a Client Component only because the preview repaints on
// hover/focus. With no JS you still get all 66 brands and their counts — you
// just lose the preview swap (see CLAUDE.md Phase 10.11).
//
// Tile look (owner, 2026-09-30): styles/brand-tiles.css, every class `bt-`.
// Each tile shows its brand's preview photograph, blurred until hovered or
// active, under a frosted panel with the name. The FIRST brand — the largest,
// `brands` is largest first — is the featured 2x2 tile. This replaced the §3.6
// rule where any brand with 20+ projects spanned two columns (`.tile.big` in
// styles/home.css, now unused).
//
// NO NUMBERS (owner, 2026-10-01): no project, city or state counts anywhere
// here — not on the tiles, not in the preview caption, not in the section
// line. `count`, `cities` and `states` are still on every brand — page.js
// sorts by `count` and brandHref() routes by it — they are just not printed.
// The caption names the brand's cities instead (`cityNames`, most projects
// first).
//
// PHOTOS (owner, 2026-10-01): page.js puts the brands WITH photographs first
// (lib/content/brandImages.js decides), so the featured tile and the default
// preview are always a brand with a photo. A brand without one — or whose
// photo fails to load — shows BrandPlaceholder, on the tile and in the preview;
// its text, hover and link are the same as every other tile's.

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import PhotoOrPlaceholder from "../PhotoOrPlaceholder";
import SectionHead from "../SectionHead";
import "../../styles/brand-tiles.css";

// City names in the preview caption before "and more".
const CITIES_SHOWN = 3;

// `brands` is worked out on the server (page.js, from the Sanity projects):
// [{ brand, count, cities, states, cityNames[], href, hasCollection, hasPhotos }],
// brands with photos first, each group largest first. This component only
// handles the hover.
export default function BrandWall({ brands = [], previews = {} }) {
    const [active, setActive] = useState(brands[0]);
    if (!active) return null;

    // Derived on the server in page.js and passed down as a plain map, so this
    // client bundle carries no image imports of its own. Absent = no photograph
    // for that brand yet, which shows BrandPlaceholder.
    const preview = previews[active.brand];

    const meta =
        active.cityNames.length > CITIES_SHOWN
            ? `${active.cityNames.slice(0, CITIES_SHOWN).join(", ")} and more`
            : active.cityNames.join(", ");

    return (
        <section className="sec" data-tone="tint">
            <div className="wrapx">
                <SectionHead
                    eyebrow="Clients"
                    description="From a single salon to a nationwide rollout."
                >
                    The brands we build for
                </SectionHead>

                <div className="wall">
                    <div className="preview">
                        <div className="pvFrame">
                            {/* Keyed by brand, so a photo that failed for one
                                brand never leaves the next one on the
                                placeholder. */}
                            <PhotoOrPlaceholder
                                key={active.brand}
                                image={preview}
                                name={active.brand}
                                alt={`${active.brand} interior by Arch Creative Interiors`}
                                fill
                                sizes="(max-width: 1000px) 100vw, 40vw"
                                style={{ objectFit: "cover" }}
                            />
                        </div>
                        <div>
                            <div className="pvName">{active.brand}</div>
                            {meta && <div className="pvMeta">{meta}</div>}
                            <Link
                                className="pvGo bt-pvgo"
                                href={active.href}
                            >
                                Explore more about {active.brand}
                                <ArrowRight className="bt-pvgo__arrow" size={15} strokeWidth={2} aria-hidden="true" />
                            </Link>
                        </div>
                    </div>

                    {/* Links, not buttons. These were <button>s carrying only
                        onMouseEnter/onFocus, so a tile swapped the preview on
                        hover and did nothing at all on click — and with no JS it
                        was 66 dead controls. As <Link>s they navigate to the
                        brand's collection with or without JS; the hover handlers
                        stay and keep driving the preview panel. onClick sets the
                        preview too, for the moment before the page changes. */}
                    <ul className="bt-grid">
                        {brands.map((b, i) => (
                            <li
                                key={b.brand}
                                className={`bt-grid__item${i === 0 ? " bt-grid__item--featured" : ""}`}
                            >
                                <Link
                                    href={b.href}
                                    className={`bt-card${previews[b.brand] ? "" : " bt-card--noimg"}${b.brand === active.brand ? " is-active" : ""}`}
                                    aria-label={`Explore more about ${b.brand}`}
                                    onMouseEnter={() => setActive(b)}
                                    onFocus={() => setActive(b)}
                                    onClick={() => setActive(b)}
                                >
                                    {/* The same photograph the preview shows for
                                        this brand; decoration, so alt="". Small
                                        sizes: a tile is ~190px wide (the
                                        featured one ~390px), 2 across on phones.
                                        No photograph: BrandPlaceholder. */}
                                    <PhotoOrPlaceholder
                                        image={previews[b.brand]}
                                        name={b.brand}
                                        placeholderClassName="bt-card__ph"
                                        alt=""
                                        fill
                                        className="bt-card__bg"
                                        sizes={
                                            i === 0
                                                ? "(max-width: 900px) 100vw, 400px"
                                                : "(max-width: 900px) 50vw, 200px"
                                        }
                                    />
                                    <span className="bt-card__shade" />
                                    {/* The name has the panel's full width (up to
                                        two lines); "Explore more" and the arrow
                                        share the row under it, so text and arrow
                                        never meet. */}
                                    <span className="bt-card__glass">
                                        <span className="bt-card__titles">
                                            <span className="bt-card__name">{b.brand}</span>
                                            {/* No category field on brands yet. */}
                                            <span className="bt-card__cat" />
                                        </span>
                                        <span className="bt-card__foot" aria-hidden="true">
                                            {/* "Explore more" turns into "Step inside"
                                                on hover / focus. The link's
                                                aria-label is what is announced. */}
                                            <span className="bt-card__cta">
                                                <span className="bt-card__ctaRest">Explore more</span>
                                                <span className="bt-card__ctaHover">Step inside</span>
                                            </span>
                                            {/* Two arrows in a round clip: on hover the
                                                first leaves up-right and the second
                                                slides in from bottom-left. */}
                                            <span className="bt-card__arrow">
                                                <ArrowUpRight className="bt-card__arrowIcon" size={16} strokeWidth={2} />
                                                <ArrowUpRight className="bt-card__arrowIcon bt-card__arrowIcon--next" size={16} strokeWidth={2} />
                                            </span>
                                        </span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
