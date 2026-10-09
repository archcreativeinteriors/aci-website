// The section heading used across the site: a small uppercase eyebrow with a
// trailing rule, then the heading itself.
//
// ── WHY A COMPONENT AND NOT JUST CSS ────────────────────────────────────────
// The type treatment is pure CSS (`.secHead h2` in styles/home.css) and needs
// no component at all. The EYEBROW does: it is markup — a <p>, a label and a
// rule <span> — so without this it would be hand-written at ~20 call sites,
// which is how two of them end up with a different gap or a missing aria
// treatment. One component, one shape.
//
// ── THE RULE SPAN IS NOT A BORDER ───────────────────────────────────────────
// It is an empty aria-hidden <span> painted with `background: currentColor`, so
// it takes its colour from the label beside it and cannot be announced. A
// border-bottom on the <p> would stretch the full column width instead of the
// fixed 64px, and ::after content would be read out by some screen readers.
//
// ── LAYOUT ──────────────────────────────────────────────────────────────────
// `.secHead` is a space-between flex row: heading block on the left, optional
// description on the right. `children` is that right-hand slot and MUST stay a
// direct child of `.secHead`, which is why the eyebrow + heading are wrapped in
// `.secHeadMain` rather than all three being siblings.
// `description` and `subtitle` are two different slots and the difference is
// where the text belongs, not how it looks:
//   description — a caption FOR THE SECTION, on the heading's row, right-aligned
//   subtitle    — text that belongs TO THE HEADING, stacked under it
// The state pages use `subtitle` for their city list. On `description` it was
// pushed to the far edge by space-between, which reads fine beside a long
// heading ("Haryana" + six cities) and strands a short one — "Odisha" has a
// single city, and one word alone at the opposite end of a 1280px row does not
// look like it belongs to the title it describes.
export default function SectionHead({
    eyebrow,
    children,
    description,
    subtitle,
    as: Tag = "h2",
    id,
    tight = false,
    className = "",
}) {
    return (
        <div className={`secHead${tight ? " secHead--tight" : ""}${className ? ` ${className}` : ""}`}>
            <div className="secHeadMain">
                {eyebrow ? (
                    <p className="secEyebrow">
                        <span>{eyebrow}</span>
                        <span className="secEyebrowRule" aria-hidden="true" />
                    </p>
                ) : null}
                <Tag id={id}>{children}</Tag>
                {subtitle ? <p className="secSub">{subtitle}</p> : null}
            </div>
            {description ? <p>{description}</p> : null}
        </div>
    );
}

/**
 * The eyebrow on its own, for blocks that are not a `.secHead` row — the CTA
 * band and the brand/state CTAs, which centre a single heading with no
 * description beside it.
 */
export function Eyebrow({ children, center = false }) {
    return (
        <p className={`secEyebrow${center ? " secEyebrow--center" : ""}`}>
            <span>{children}</span>
            <span className="secEyebrowRule" aria-hidden="true" />
        </p>
    );
}
