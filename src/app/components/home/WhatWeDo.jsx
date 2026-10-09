// Brief §4 Home item 5 — three service cards.
// Card copy is the existing site's, unchanged (§0).

import Link from "next/link";
import { getHomePage, getStats } from "../../lib/content";
import SectionHead from "../SectionHead";

// The three cards are in Sanity (Home page → What we do) since 2026-09-28.
// Each card ended in "N completed projects" (its sector's count) until the
// owner removed project counts site-wide on 2026-10-01; it now ends in a
// "See the work" cue. SECTOR_COUNTS is still read here, just not printed.

export default async function WhatWeDo() {
    const [{ whatWeDo: CARDS }, { SECTOR_COUNTS }] = await Promise.all([getHomePage(), getStats()]);
    return (
        <section className="sec" data-tone="plain">
            <div className="wrapx">
                <SectionHead
                    eyebrow="Services"
                    description="Salon work is where we started. The same site teams run commercial and residential."
                >
                    What we do
                </SectionHead>
                <div className="svc">
                    {CARDS.map((card) => {
                        return (
                            <Link className="sv" key={card.title} href={card.href}>
                                <h3>{card.title}</h3>
                                <p>{card.body}</p>
                                <span className="svN">
                                    See the work <span aria-hidden="true">&rarr;</span>
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
