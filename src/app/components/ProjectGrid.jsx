import ProjectCard from "./ProjectCard";

// Spec §32 — the shared grid. §29 sets the column counts (desktop 4 / tablet 3 /
// mobile 2); they live in styles/project-cards.css so every consumer gets the
// same breakpoints rather than each page inventing its own.
//
// `priorityFirst` marks the first N images as priority. Default 0: these grids
// are below the fold everywhere they are used today, and §28 is explicit that
// only hero/critical images should be eager.
export default function ProjectGrid({ projects, priorityFirst = 0 }) {
    if (!projects.length) return null;

    return (
        <ul className="pgrid">
            {projects.map((project, i) => (
                <li key={project.slug}>
                    <ProjectCard project={project} priority={i < priorityFirst} />
                </li>
            ))}
        </ul>
    );
}
