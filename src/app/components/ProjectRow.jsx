import Link from "next/link";
import PhotoOrPlaceholder from "./PhotoOrPlaceholder";

// One row of the typographic project index (execution plan v5 §7):
// name · city · state · arrow.
//
// Extracted from projects/page.js so /projects and /projects/brand/[brand]
// render identical rows. It is a Server Component and stays one — the rows must
// be complete with no JS (Phase 10.11); components/ProjectIndex.jsx only layers
// the cursor-following preview on top, reading `data-preview` off these nodes.
export default function ProjectRow({ project, recent }) {
    const { slug, projectName, city, state, heroImage, previewSrc, linkable, brand } = project;

    // Only the rows backed by a real record have a detail page. The rest render
    // as inert text so we never emit a link to a 404 (generateStaticParams
    // builds only the linkable ones).
    const Row = linkable ? Link : "div";
    const rowProps = linkable ? { href: `/projects/${slug}` } : {};

    return (
        <Row
            {...rowProps}
            className={`project-row${linkable ? "" : " project-row--placeholder"}`}
            data-preview={previewSrc || undefined}
        >
            {/* Mobile has no hover, so §7 puts a thumbnail on the row itself.
                Hidden from the desktop layout in CSS, not unmounted, so there is
                no layout shift when the breakpoint changes. */}
            <span className="project-row-thumb" aria-hidden="true">
                {/* No photograph (or it fails to load): BrandPlaceholder, not
                    an empty grey square (owner, 2026-10-01). */}
                <PhotoOrPlaceholder
                    image={heroImage}
                    name={brand || projectName}
                    alt=""
                    fill
                    sizes="64px"
                    style={{ objectFit: "cover" }}
                />
            </span>

            <span className="project-row-name">
                {projectName}
                {recent && <em className="project-row-badge">Recent</em>}
            </span>

            <span className="project-row-city">{city}</span>

            <span className="project-row-state">{state || ""}</span>

            <span className="project-row-arrow" aria-hidden="true">
                &rarr;
            </span>
        </Row>
    );
}
