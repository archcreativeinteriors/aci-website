// "Where we build" — locations section with an India map.
//
// ── WHY THIS IS A CLIENT COMPONENT, AND WHAT STILL WORKS WITHOUT JS ──────────
// Hovering a city link has to highlight a dot inside an SVG in the other
// column, and hovering a dot has to highlight the link. Those two elements are
// in different subtrees, so CSS alone cannot connect them without one
// hand-written :has() rule per city — 28 selectors that would silently fall out
// of step with the data the moment a city is added.
//
// So it holds one piece of state: which city is active. Everything ELSE is in
// the server-rendered HTML — every state name, every city link with its real
// href, the full map, and all 14 dots. With no JS you lose the highlight; you
// do not lose the content or a single link (CLAUDE.md Phase 10.11).
//
// ── THE DOTS ARE PRE-PROJECTED ──────────────────────────────────────────────
// CITY_POINTS in lib/map/indiaMap.js comes out of the same Mercator projection and
// viewBox fit as the state outlines, produced by the same generator run. Do not
// compute a dot position here, and do not regenerate the paths without the
// points — they are one output. Verified: all 14 dots land inside their own
// state's bounding box.
//
// ── LOCATIONS ARE DERIVED ───────────────────────────────────────────────────
// Eight states, two cities each, from the project data. The brief asked for
// Manesar, Udaipur, Mumbai, Bengaluru and Hyderabad — the firm has projects in
// none of them. The data is worked out on the server by getLocations()
// (lib/content/locations.js, from the Sanity projects) and passed in as props.

"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { stateKey, smallStateMarkers } from "../../lib/map/geo";
import { MAP_VIEWBOX, STATE_PATHS } from "../../lib/map/indiaMap";

export default function WhereWeBuild({
    regions: rows = [],
    mappedCities: cities = [],
    remainingStates: rest = [],
    projectStateKeys = [],
}) {
    const [active, setActive] = useState(null);
    // Which of the "Also delivering in ..." states is being pointed at. Kept
    // separate from `active` (a city slug) because the two highlight different
    // things — a dot and a polygon — and one variable holding either would make
    // every comparison below ambiguous.
    const [hotState, setHotState] = useState(null);
    const headingId = useId();

    // Every state with a project is tinted on the map (all of them, not just
    // the 8 with a column).
    const isProjectState = (mapName) => projectStateKeys.includes(stateKey(mapName));

    // One handler pair, passed to both the link and its dot, so the two can
    // never drift into highlighting different things.
    const bind = (slug) => ({
        onMouseEnter: () => setActive(slug),
        onMouseLeave: () => setActive((c) => (c === slug ? null : c)),
        onFocus: () => setActive(slug),
        onBlur: () => setActive((c) => (c === slug ? null : c)),
    });

    // Same shape, for the state links in the "Also delivering in" line. Pointing
    // at one lifts that state out of the flat 16-state tint on the map.
    // Deliberately ONE-WAY (text -> map): only 8 of the 16 tinted states have a
    // link here, so making the polygons hoverable would give half the map a
    // response and half of it none.
    const bindState = (key) => ({
        onMouseEnter: () => setHotState(key),
        onMouseLeave: () => setHotState((c) => (c === key ? null : c)),
        onFocus: () => setHotState(key),
        onBlur: () => setHotState((c) => (c === key ? null : c)),
    });

    return (
        <section className="wwb" data-tone="plain" aria-labelledby={headingId}>
            <div className="wwbInner">
                <div className="wwbText">
                    <p className="wwbEyebrow">
                        <span>Where we build</span>
                        <span className="wwbEyebrowRule" aria-hidden="true" />
                    </p>

                    <h2 id={headingId} className="wwbHeading">
                        Interior projects across India.
                    </h2>

                    <p className="wwbLede">
                        From high-rise residences in metro cities to industrial and
                        commercial builds in fast-growing hubs, our sites span multiple
                        regions across India.
                    </p>

                    <nav className="wwbGrid" aria-label="Projects by location">
                        <ul className="wwbStates">
                            {rows.map((r) => (
                                <li className="wwbState" key={r.slug}>
                                    <p className="wwbStateName">
                                        <span>{r.state}</span>
                                        <span
                                            className="wwbStateRule"
                                            aria-hidden="true"
                                        />
                                    </p>
                                    <ul className="wwbCities">
                                        {r.cities.map((c) => (
                                            <li key={c.slug}>
                                                <Link
                                                    className={`wwbCity${
                                                        active === c.slug ? " isOn" : ""
                                                    }`}
                                                    href={c.href}
                                                    title={`Interior projects in ${c.name}, ${r.state}`}
                                                    {...bind(c.slug)}
                                                >
                                                    {c.name}
                                                    <svg
                                                        className="wwbCityArrow"
                                                        viewBox="0 0 16 16"
                                                        aria-hidden="true"
                                                    >
                                                        <path
                                                            d="M3 8h9M8.5 4l4 4-4 4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="1.5"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                        {/* NOT in the brief, and here for a measured reason: the
                            grid shows 8 of 16 states, and the design it replaced
                            linked all 16. Without this line the other 8 state
                            pages lose every internal link on the site — a crawl
                            went from 131 reachable pages to 123 and nothing else
                            showed it, because those pages still return 200 and
                            are still in the sitemap. One quiet sentence buys
                            them back. */}
                        {rest.length > 0 && (
                            <p className="wwbAlso">
                                Also delivering in{" "}
                                {rest.map((r, i) => (
                                    <span key={r.slug}>
                                        <Link
                                            className={
                                                hotState === r.key ? "isOn" : undefined
                                            }
                                            href={r.href}
                                            title={`Interior projects in ${r.state}`}
                                            {...bindState(r.key)}
                                        >
                                            {r.state}
                                        </Link>
                                        {i < rest.length - 2
                                            ? ", "
                                            : i === rest.length - 2
                                              ? " and "
                                              : ""}
                                    </span>
                                ))}
                                .
                            </p>
                        )}
                    </nav>

                    <p className="wwbCtaWrap">
                        <Link className="wwbCta" href="/projects">
                            Explore all locations
                            <span aria-hidden="true"> →</span>
                        </Link>
                    </p>
                </div>

                <div className="wwbMapCol">
                    {/* Decorative: every city it plots is already a labelled link
                        in the list, so announcing the SVG again would read the
                        same 14 names twice. */}
                    <svg
                        className="wwbMap"
                        viewBox={MAP_VIEWBOX}
                        role="presentation"
                        aria-hidden="true"
                        focusable="false"
                    >
                        {/* Two passes. The under-layer's thick stroke shows only
                            where nothing covers it — the coastline and the land
                            border — because the over-layer's white fills paint out
                            every internal edge. That is what produces a heavier
                            country outline and hairline state borders without
                            dissolving the polygons, which would need a topology
                            dependency. */}
                        <g className="wwbMapOutline">
                            {STATE_PATHS.map((s) => (
                                <path key={s.name} d={s.d} />
                            ))}
                        </g>
                        {/* Every state with a project is tinted, all 16 — not
                            just the 8 with a column. 14 dots on an otherwise
                            blank map understates the coverage, which is the same
                            thing the old bar chart got wrong when it rendered
                            "Odisha 1". Matching is normalised, because the data
                            says "J&K", the list says "Jammu & Kashmir" and the
                            map says "Jammu and Kashmir". */}
                        <g className="wwbMapStates">
                            {STATE_PATHS.map((s) => (
                                <path
                                    key={s.name}
                                    d={s.d}
                                    className={
                                        [
                                            isProjectState(s.name) ? "isActive" : "",
                                            hotState && stateKey(s.name) === hotState
                                                ? "isHot"
                                                : "",
                                        ]
                                            .filter(Boolean)
                                            .join(" ") || undefined
                                    }
                                />
                            ))}
                        </g>

                        {/* Chandigarh is 2x2 px at this size, so filling its
                            polygon highlights nothing a person can see. States
                            below the size threshold get this ring instead. It is
                            rendered AFTER the state layer so it is not painted
                            over, and before the city dots so a dot always wins.
                            See smallStateMarkers in lib/map/geo.js. */}
                        {hotState && smallStateMarkers[hotState] && (
                            <circle
                                className="wwbHotMark"
                                cx={smallStateMarkers[hotState].x}
                                cy={smallStateMarkers[hotState].y}
                                r="16"
                            />
                        )}

                        {cities.map((c) => {
                            const on = active === c.slug;
                            return (
                                <g
                                    key={c.slug}
                                    className={`wwbDot${on ? " isOn" : ""}`}
                                    {...bind(c.slug)}
                                >
                                    {/* Sits under the dot so it never eats the
                                        pointer, and scales from 0 rather than
                                        appearing at full size. */}
                                    <circle
                                        className="wwbDotRing"
                                        cx={c.point.x}
                                        cy={c.point.y}
                                        r="14"
                                    />
                                    <circle
                                        className="wwbDotCore"
                                        cx={c.point.x}
                                        cy={c.point.y}
                                        r="5"
                                    />
                                    <text
                                        className="wwbDotLabel"
                                        x={c.point.x + 20}
                                        y={c.point.y + 5}
                                    >
                                        {c.name}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>

                <p className="wwbCompass" aria-hidden="true">
                    <span className="wwbCompassText">Across India</span>
                    <span className="wwbCompassLine" />
                    <svg className="wwbCompassArrow" viewBox="0 0 12 16">
                        <path
                            d="M6 1l4 6H2z"
                            fill="currentColor"
                        />
                    </svg>
                    <span className="wwbCompassN">N</span>
                </p>
            </div>
        </section>
    );
}
