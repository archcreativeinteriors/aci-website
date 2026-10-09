import Link from "next/link";
import { Eyebrow } from "../SectionHead";
import "../../styles/brand-curated.css";

// Brand page, brand with NO photographs yet (owner, 2026-10-01): stands in for
// the project list ("Every {brand} space, by state"), which would otherwise be
// a grid of placeholders. It carries the list's id, #all-projects, so the
// hero's "Explore more about {brand}" link and the format cards still land
// here.
//
// `projectHref` is the brand's project page, when it has one — the list was
// the only link to it from this page.
export default function BrandCuratedNotice({ brand, projectHref = null }) {
    return (
        <section className="sec" data-tone="tint" id="all-projects">
            <div className="wrapx">
                {/* No "Every {brand} space, by state" heading: there is no
                    list under it yet. */}
                <div className="bc-notice">
                    <Eyebrow>Photographs</Eyebrow>
                    <p className="bc-notice__text">Photographs of this space are being curated.</p>
                    <p className="bc-notice__actions">
                        {projectHref && (
                            <Link className="link" href={projectHref}>
                                View the {brand} project
                            </Link>
                        )}
                        <Link href="/contact" className="bGlow">
                            Get Free Consultation
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    );
}
