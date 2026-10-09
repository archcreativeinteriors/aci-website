import Link from "next/link";
import PhotoOrPlaceholder from "./PhotoOrPlaceholder";

// Spec §7 / §32 — the one project card. Used by the brand collection pages and
// anywhere else a project needs a tile. Takes a record from
// getProjects() (lib/content/projects.js), so there is no second shape to keep in step.
//
// §26 PHOTOGRAPH STATE. A project either has an approved image or it does not,
// and "does not" is a designed state (BrandPlaceholder), never a broken <img>
// and never another project's photograph borrowed as a stand-in.
//
// §8 / §30 INTERACTION. The whole card is one <a> when the project has a detail
// page — not a clickable <div> — so it is keyboard reachable and has a real
// focus ring. Everything a visitor needs (name, location, state) is in the
// markup at rest; the hover overlay only repeats the format, so nothing is
// hover-only and mobile loses nothing. A row with no detail page renders as an
// inert <article>: never link to a page generateStaticParams does not build.
export default function ProjectCard({ project, priority = false }) {
    const {
        slug,
        projectName,
        city,
        state,
        subCategory,
        heroImage,
        linkable,
        brand,
    } = project;

    const Wrapper = linkable ? Link : "article";
    const wrapperProps = linkable ? { href: `/projects/${slug}` } : {};

    return (
        <Wrapper
            {...wrapperProps}
            className={`pcard${linkable ? "" : " pcard--static"}`}
        >
            <span className="pcardFrame">
                {/* §26: no photograph (or it fails to load) is a designed
                    state — BrandPlaceholder with the project's brand initials,
                    in the same 4:3 frame (owner, 2026-10-01; it replaced the
                    "Photograph to be shot" text). */}
                <PhotoOrPlaceholder
                    image={heroImage}
                    name={brand || projectName}
                    alt={`${projectName}, ${city}`}
                    fill
                    loading={priority ? "eager" : undefined}
                    sizes="(max-width: 680px) 50vw, (max-width: 1000px) 33vw, 24vw"
                    style={{ objectFit: "cover" }}
                />
                {heroImage && subCategory && (
                    <span className="pcardVeil" aria-hidden="true">
                        {subCategory}
                    </span>
                )}
            </span>

            <span className="pcardName">{projectName}</span>
            <span className="pcardLoc">{city}</span>
            {state && <span className="pcardState">{state}</span>}
        </Wrapper>
    );
}
