import ProjectGrid from "../ProjectGrid";
import SectionHead from "../SectionHead";

// Spec §6 — "Every {brand} space, by state".
//
// One component that maps over the grouped data. The spec is explicit: "Do not
// manually create a separate page section for every state." Groups and counts
// come from lib/content/stats.js groupByState(), biggest state first.
//
// Each group's heading is an <h3> under the section's <h2>, so a brand page with
// fifteen states still has one <h1> and no level skips.
//
// No numbers (owner, 2026-10-01): the description said "N projects across S
// states" and each state heading carried its project count. State NAMES stay;
// `total` is still accepted but no longer printed.
export default function BrandStateSection({ brand, groups, total }) {
    if (!groups.length) return null;

    return (
        <section className="sec" data-tone="tint" id="all-projects">
            <div className="wrapx">
                <SectionHead
                    eyebrow="Coverage"
                    description="Every project, grouped by state."
                >
                    Every {brand} space, by state
                </SectionHead>

                {groups.map((group) => (
                    <div className="bstateGroup" key={group.state}>
                        <h3 className="bstateHead">
                            <span>{group.state}</span>
                        </h3>
                        <ProjectGrid projects={group.projects} />
                    </div>
                ))}
            </div>
        </section>
    );
}
