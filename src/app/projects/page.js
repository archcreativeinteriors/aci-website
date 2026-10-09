// /projects — the All Projects Experience (spec §10–§15).
//
// §24: this answers "what has ACI built across the whole portfolio?" The brand
// collection pages answer "what has ACI built for THIS brand?" and present
// cards grouped by state. The two must not converge — that is why this stays an
// editorial index (§14 lists "editorial rows" as a valid treatment) rather than
// becoming a second grid.
//
// §13 CREATIVE COUNT: a large editorial number (the spec's Option A), rendered
// statically. The spec allows an animated counter but attaches five conditions
// to it, one of which is that it must work without JavaScript animation and
// never end on 0 — and this repo has already shipped a counter that rendered a
// literal "0" (Phase 6.4). "A static creative number is preferred if the
// animation introduces reliability issues." It does; this is static.
//
// §15 FILTERS: sector chips, built from the data — only categories with real
// records appear. Rendered by a client component so that with no JavaScript
// there are no chips at all rather than dead controls, and the full index is
// still there.

import ScrollReveal from "../components/ScrollReveal";
import ProjectIndex from "../components/ProjectIndex";
import ProjectFilters from "../components/ProjectFilters";
import ProjectRow from "../components/ProjectRow";
import { getProjects, getStats, getSiteSettings } from "../lib/content";

export const metadata = {
    title: "Projects & Portfolio",
    description:
        "Explore Arch Creative Interiors' portfolio of completed salon, spa, commercial and residential interior design projects across Delhi NCR and India.",
    alternates: { canonical: "/projects" },
    openGraph: {
        title: "Our Interior Design Portfolio | Arch Creative Interiors",
        description:
            "Completed salon, commercial and residential interior design projects across Delhi NCR and India.",
        url: "/projects",
        images: ["/og-image-landscape.jpg"],
    },
};

// §7: the newest six carry a "Recent" badge.
const RECENT_COUNT = 6;

const sectorSlug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export default async function ProjectsPage() {
    // Cities / states for the lede — typed in Site settings (owner, 2026-09-24).
    const [projects, { PROJECT_STATS, SECTOR_COUNTS }, { stats }] = await Promise.all([
        getProjects(),
        getStats(),
        getSiteSettings(),
    ]);

    // §15: derived, largest first. A sector with no records never appears.
    const filterOptions = Object.entries(SECTOR_COUNTS)
        .map(([label, count]) => ({ label, count, value: sectorSlug(label) }))
        .sort((a, b) => b.count - a.count);

    return (
        <main id="main-content" tabIndex={-1}>
            <ScrollReveal>
                <section className="projects-page">
                    <div className="projects-header">
                        <span>Our Portfolio</span>
                        <h1>Interior Design Projects &amp; Portfolio</h1>

                        {/* This was §13's editorial mega-number — the project
                            total at clamp(48px, 6.4vw, 76px), the largest thing
                            on the page. The owner removed the project total
                            site-wide on 2026-09-17, so `.pcountN` is gone and
                            with it the hairline in `.pcountL::before`, which
                            existed only to join the number to this label.
                            Do not reinstate a project total here. Since
                            2026-10-01 there are no city / state counts either
                            (owner); `stats` is still loaded, not printed. */}
                        <p className="pcount">
                            <span className="pcountL">
                                Salon, commercial and residential interiors completed
                                in cities across India.
                            </span>
                        </p>
                    </div>

                    {/* The rows below are plain server-rendered links and are
                        complete without JavaScript. ProjectIndex layers the
                        cursor-following preview on top and ProjectFilters only
                        hides rows — if neither bundle loads you lose the photo
                        and the chips, not the page (see Phase 10.11). */}
                    {/* `total` and each option's `count` are still passed, but
                        neither is RENDERED — no project counts on the site
                        (owner, 2026-10-01). The counts order the chips here;
                        ProjectFilters names the active filter instead of
                        counting it. */}
                    <ProjectFilters
                        options={filterOptions}
                        total={PROJECT_STATS.projects}
                    >
                        <ProjectIndex>
                            <ol className="project-index">
                                {projects.map((project, i) => (
                                    <li
                                        key={project.slug}
                                        className="project-row-wrap"
                                        data-sector={sectorSlug(project.sector || "")}
                                    >
                                        <ProjectRow
                                            project={project}
                                            recent={i < RECENT_COUNT}
                                        />
                                    </li>
                                ))}
                            </ol>
                        </ProjectIndex>
                    </ProjectFilters>
                </section>
            </ScrollReveal>
        </main>
    );
}
