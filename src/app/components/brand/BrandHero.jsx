import { MapPin } from "lucide-react";
import PhotoOrPlaceholder from "../PhotoOrPlaceholder";
import BrandExploreLink from "./BrandExploreLink";
import { stateDisplay } from "../../lib/content";
import "../../styles/brand-hero.css";

// Spec §3.1 / §4 — the brand hero.
//
// "Make the selected brand feel important and substantial." The composition is
// editorial (§31): large type, generous whitespace, one photograph, blue only
// as an accent.
//
// NO NUMBERS (owner, 2026-10-01). This carried a stats block — spaces, then
// cities and states — and a lede assembled from the same counts. All of it is
// gone: the lede is one sentence for every brand, and the stats block became
// a row of location chips (the NAMES of the brand's cities and states, from
// its projects) plus a link down to the brand's project list. `brand.count`,
// `.cities` and `.states` are still on the object; they are just not printed.
// (Earlier: a `share` stat, "53% Of our work", went on 2026-09-17 with the
// site-wide project total.)

// How many location chips before "and more".
const CHIPS_SHOWN = 4;

// City names, most projects first, then state names the same way; a state
// that repeats a city's name ("Delhi") is shown once.
function locationNames(items = []) {
    const tally = (values) => {
        const counts = new Map();
        for (const v of values) if (v) counts.set(v, (counts.get(v) || 0) + 1);
        return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([v]) => v);
    };
    const cities = tally(items.map((p) => p.city));
    const seen = new Set(cities.map((c) => c.toLowerCase()));
    const states = tally(items.map((p) => (p.state ? stateDisplay(p.state) : null))).filter((s) => !seen.has(s.toLowerCase()));
    return [...cities, ...states];
}

export default function BrandHero({ brand, image }) {
    const { brand: name } = brand;
    const places = locationNames(brand.items);
    const shown = places.slice(0, CHIPS_SHOWN);

    return (
        <header className="bhero">
            <div className="bheroTxt">
                <p className="bheroKick">Brand collection</p>
                <h1>{name}</h1>
                <p className="bheroLede">
                    Every space delivered to one fit-out standard, wherever the
                    brand grows.
                </p>

                {shown.length > 0 && (
                    <ul className="bh-places" aria-label={`Where we have built for ${name}`}>
                        {shown.map((place) => (
                            <li className="bh-place" key={place}>
                                <MapPin size={14} strokeWidth={2} aria-hidden="true" />
                                {place}
                            </li>
                        ))}
                        {places.length > CHIPS_SHOWN && (
                            <li className="bh-place bh-place--more">and more</li>
                        )}
                    </ul>
                )}

                <BrandExploreLink href="#all-projects">Explore more about {name}</BrandExploreLink>
            </div>

            <div className="bheroImg">
                {/* §26 — no photograph for this brand yet (or it fails to
                    load): BrandPlaceholder, in the same 4:3 box. */}
                <PhotoOrPlaceholder
                    image={image}
                    name={name}
                    alt={`${name} interior by Arch Creative Interiors`}
                    fill
                    loading="eager"
                    sizes="(max-width: 1000px) 100vw, 46vw"
                    style={{ objectFit: "cover" }}
                />
            </div>
        </header>
    );
}
