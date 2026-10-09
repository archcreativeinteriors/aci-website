"use client";

// Spec §15 — data-driven filters for the projects index.
//
// PROGRESSIVE ENHANCEMENT, like ProjectIndex. The rows are server-rendered and
// complete; this only hides some of them. Two consequences that are deliberate:
//
//  1. The chips are rendered BY this component, so with no JavaScript they do
//     not exist at all — a visitor sees the full 192-row index instead of a row
//     of dead controls. (The home brand tiles were exactly that mistake: 66
//     <button>s wired to nothing. Never ship a control that cannot act.)
//  2. Filtering toggles `hidden` on the existing DOM rows rather than
//     re-rendering them here. Moving the rows into this component would gate
//     the page's actual content on a bundle — the failure that left the whole
//     site blank in Phase 10.11.
//
// Options come from the data (§15: "Only display filter categories that have
// actual published records"), counted and passed in by the server.
//
// NO NUMBERS (owner, 2026-10-01): the chips used to carry each sector's project
// count and the line under them read "Showing N projects". Both are gone — the
// counts are still passed in (`opt.count`, `total`) and still drive the order
// and the empty state, they are just not printed. The active chip is marked by
// one navy pill that slides between chips (styles/project-filters.css).

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Building2, House, LayoutGrid, Scissors } from "lucide-react";
import "../styles/project-filters.css";

// Keyed by the chip's value (the sector slug built in projects/page.js). A
// sector without an entry still gets a chip — just no icon, and its own label
// as the line below.
const ICONS = { all: LayoutGrid, "salon-and-studio": Scissors, commercial: Building2, residential: House };
const LINES = {
    all: "Every space we've built",
    "salon-and-studio": "Salons and studios",
    commercial: "Commercial spaces",
    residential: "Homes",
};

export default function ProjectFilters({ options, total, children }) {
    const wrapRef = useRef(null);
    const groupRef = useRef(null);
    const [active, setActive] = useState("all");
    const [shown, setShown] = useState(total);
    // Where the sliding pill sits: the active chip's box inside the group.
    // null until measured; `.pf-ready` waits for it, so the first placement
    // does not slide in from the corner.
    const [pill, setPill] = useState(null);
    const [ready, setReady] = useState(false);

    // Measured before paint, and again whenever a chip changes size (the web
    // font arriving, the chips wrapping onto a second row on a phone).
    useLayoutEffect(() => {
        const group = groupRef.current;
        if (!group) return;
        const place = () => {
            const chip = group.querySelector(`[data-value="${active}"]`);
            if (!chip) return;
            setPill({ x: chip.offsetLeft, y: chip.offsetTop, w: chip.offsetWidth, h: chip.offsetHeight });
        };
        place();
        if (typeof ResizeObserver === "undefined") return;
        const ro = new ResizeObserver(place);
        ro.observe(group);
        group.querySelectorAll("[data-value]").forEach((chip) => ro.observe(chip));
        return () => ro.disconnect();
    }, [active]);

    useEffect(() => {
        if (!pill || ready) return;
        const id = requestAnimationFrame(() => setReady(true));
        return () => cancelAnimationFrame(id);
    }, [pill, ready]);

    useEffect(() => {
        const wrap = wrapRef.current;
        if (!wrap) return;

        const rows = wrap.querySelectorAll("[data-sector]");
        let count = 0;

        rows.forEach((row) => {
            const match = active === "all" || row.dataset.sector === active;
            row.hidden = !match;
            if (match) count += 1;
        });

        setShown(count);
    }, [active]);

    return (
        <>
            <div
                ref={groupRef}
                className={`pf-group${ready ? " pf-ready" : ""}`}
                role="group"
                aria-label="Filter projects by sector"
            >
                <span
                    className="pf-pill"
                    aria-hidden="true"
                    style={
                        pill
                            ? {
                                  transform: `translate(${pill.x}px, ${pill.y}px)`,
                                  width: `${pill.w}px`,
                                  height: `${pill.h}px`,
                              }
                            : undefined
                    }
                />
                {[{ value: "all", label: "All" }, ...options].map((opt) => {
                    const Icon = ICONS[opt.value];
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            data-value={opt.value}
                            className={`pf-chip${active === opt.value ? " on" : ""}`}
                            aria-pressed={active === opt.value}
                            onClick={() => setActive(opt.value)}
                        >
                            {Icon && <Icon className="pf-icon" size={15} strokeWidth={1.75} aria-hidden="true" />}
                            <span className="pf-label">{opt.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Announced politely so a screen-reader user knows the list changed
                under them. Names what is showing rather than counting it. */}
            <p className="pfilterCount" aria-live="polite">
                {LINES[active] || options.find((o) => o.value === active)?.label}
            </p>

            <div ref={wrapRef}>{children}</div>

            {/* Latent today — every chip has records — but a filter that empties
                the list has to say so. Without it the page shows "Showing 0
                projects" above blank space and reads as broken rather than as an
                honest empty result. */}
            {shown === 0 && (
                <p className="pfilterEmpty">No projects in this sector yet.</p>
            )}
        </>
    );
}
