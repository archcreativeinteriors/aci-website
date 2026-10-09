// What stands in for a photograph that does not exist yet, or failed to load
// (owner, 2026-10-01): a navy gradient, the brand's initials in large faded
// serif type and a faint line drawing of an arch and a floor, like an
// architect's sketch. Never a "no image" icon, never a broken-image box, and
// never another brand's photo.
//
// It fills its parent (position: absolute; inset: 0), and every frame it is
// used in is already `position: relative` with its own aspect ratio, rounded
// corners and `overflow: hidden` — so it takes exactly the photo's box and
// nothing moves when one replaces the other. Decorative: aria-hidden, the
// surrounding link or heading carries the name.
//
// No state, no hooks: usable from Server and Client Components alike.

import "../styles/brand-placeholder.css";

// "Punjabi By Nature" -> "PB", "Toni & Guy" -> "TG", "Rawls" -> "R". Only
// words starting with a letter or digit count, so "&" is skipped.
export function initials(name = "") {
    return name
        .split(/\s+/)
        .filter((w) => /^[\p{L}\p{N}]/u.test(w))
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("");
}

export default function BrandPlaceholder({ name, className = "" }) {
    return (
        <span className={`bp${className ? ` ${className}` : ""}`} aria-hidden="true">
            <svg className="bp__lines" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" focusable="false">
                <g fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke">
                    <path d="M120 300V150a80 80 0 0 1 160 0v150" />
                    <path d="M146 300V156a54 54 0 0 1 108 0v144" />
                    <path d="M40 0v300M360 0v300M70 0v300M330 0v300" />
                    <path d="M0 236h400M0 262h400" />
                    <path d="M200 236 40 300M200 236l160 64" />
                </g>
            </svg>
            <span className="bp__initials">{initials(name)}</span>
        </span>
    );
}
