// Spec §5 — "By format". One reusable component, explicitly NOT a static block
// per brand ("Do not create separate static HTML blocks for each brand").
//
// FORMAT CARDS, NO NUMBERS (owner, 2026-10-01). This was a bar per format with
// its project count; the counts are gone and each format is now a card — the
// brand's own photograph of that format, its name, and a one-line description.
// `rows` still comes from lib/content/stats.js formatBreakdown() (largest
// format first); its `count` / `pct` are simply not printed. Styles:
// styles/brand-formats.css, every class `bf-`, matched to the home brand tiles.
//
// No format filter exists anywhere on the site, so every card links to this
// brand's own project list further down the page (#all-projects).
//
// `count` is still accepted (the page passes the brand's total) but no longer
// rendered.
import Link from "next/link";
import PhotoOrPlaceholder from "../PhotoOrPlaceholder";
import SectionHead from "../SectionHead";
import "../../styles/brand-formats.css";

// One line per format that exists in the data (fmt / subCategory). A format
// missing here shows its name alone.
const FORMAT_LINES = {
    Salon: "Full-service flagship salons",
    Studio: "Compact styling studios",
    Academy: "Training academies",
    "Nail studio": "Dedicated nail bars",
    Spa: "Calm treatment and spa suites",
    Retail: "Beauty retail and showrooms",
    Restaurant: "Dining rooms and kitchens",
    Estate: "Private homes and estates",
};

export default function BrandFormatBreakdown({ rows, brand, count, photos = {} }) {
    if (!rows.length) return null;

    return (
        <section className="sec" data-tone="plain">
            <div className="wrapx">
                <SectionHead eyebrow="Breakdown">By format</SectionHead>

                <div className="bfmt">
                    <ul className="bf-grid">
                        {rows.map((row) => (
                            <li className="bf-item" key={row.format}>
                                <Link className="bf-card" href="#all-projects">
                                    {/* No photograph of this format (or it fails
                                        to load): BrandPlaceholder. */}
                                    <PhotoOrPlaceholder
                                        image={photos[row.format]}
                                        name={brand}
                                        placeholderClassName="bf-card__ph"
                                        alt=""
                                        fill
                                        className="bf-card__bg"
                                        sizes="(max-width: 680px) 100vw, 300px"
                                    />
                                    <span className="bf-card__shade" />
                                    <span className="bf-card__glass">
                                        <span className="bf-card__name">{row.format}</span>
                                        {FORMAT_LINES[row.format] && (
                                            <span className="bf-card__line">{FORMAT_LINES[row.format]}</span>
                                        )}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <div className="bfmtCopy">
                        <p>
                            A rollout partner needs one contractor who can hold a
                            specification constant whether the site is a Gurugram mall
                            or a Srinagar high street. Every time, that has been us.
                        </p>
                        <p className="bfmtLink">
                            <Link className="link" href="#all-projects">
                                Explore more about {brand}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
