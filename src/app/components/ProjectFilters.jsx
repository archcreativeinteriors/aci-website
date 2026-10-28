// /projects sector LABELS above the index — not filters (owner, 2026-10-21).
//
// These were clickable chips that hid every row outside the chosen sector. The
// owner wants them to read as information only: "the list below holds salon,
// commercial and residential projects". So they are plain text now — no
// <button>, no click handler, no hover lift — and every row stays visible.
// "All" keeps its navy fill, as it looked before, because the whole list is
// what is shown. The clickable version is in
// archive/src/app/components/ProjectFilters.before-static.jsx.
//
// A server component now: with nothing to click there is no JavaScript to
// wait for, so the labels are in the HTML from the start (before, they only
// appeared once the bundle ran).
//
// Sectors come from the data (§15: only ones with published records), passed
// in by projects/page.js in its order. No numbers (owner, 2026-10-01).

import { Building2, House, LayoutGrid, Scissors } from "lucide-react";
import "../styles/project-filters.css";

// Keyed by the sector slug built in projects/page.js. A sector without an entry
// still gets a label — just no icon.
const ICONS = { all: LayoutGrid, "salon-and-studio": Scissors, commercial: Building2, residential: House };

export default function ProjectFilters({ options, children }) {
    return (
        <>
            <div className="pf-group" role="list" aria-label="Sectors in this portfolio">
                {[{ value: "all", label: "All" }, ...options].map((opt) => {
                    const Icon = ICONS[opt.value];
                    return (
                        <span
                            key={opt.value}
                            role="listitem"
                            className={`pf-chip pf-tag${opt.value === "all" ? " on" : ""}`}
                        >
                            {Icon && <Icon className="pf-icon" size={15} strokeWidth={1.75} aria-hidden="true" />}
                            <span className="pf-label">{opt.label}</span>
                        </span>
                    );
                })}
            </div>

            <p className="pfilterCount">Every space we&apos;ve built</p>

            <div>{children}</div>
        </>
    );
}
