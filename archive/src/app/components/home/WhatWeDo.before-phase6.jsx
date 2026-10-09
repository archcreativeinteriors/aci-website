// Brief §4 Home item 5 — three service cards. Counts are DERIVED (§7): the demo
// hard-coded "181 completed projects" where the data says 180.
// Card copy is the existing site's, unchanged (§0).

import Link from "next/link";
import { SECTOR_COUNTS } from "../../lib/projectStats";
import SectionHead from "../SectionHead";

const CARDS = [
    {
        title: "Salon, spa & studio",
        body: "Workstations, wash areas, lighting and services planned around how a salon actually runs.",
        sector: "Salon and studio",
        href: "/services/salon",
    },
    {
        title: "Commercial",
        body: "Restaurants, showrooms and beauty retail. Punjabi By Nature, The Bimini Road, Esskay Beauty Resources, Marc Zenat.",
        sector: "Commercial",
        href: "/services/commercial",
    },
    {
        title: "Residential",
        body: "Homes and estates, planned and executed end to end.",
        sector: "Residential",
        href: "/services/residential",
    },
];

export default function WhatWeDo() {
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
                        const n = SECTOR_COUNTS[card.sector] || 0;
                        return (
                            <Link className="sv" key={card.title} href={card.href}>
                                <h3>{card.title}</h3>
                                <p>{card.body}</p>
                                <span className="svN">
                                    {n} completed project{n === 1 ? "" : "s"}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
