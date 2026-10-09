// Sanity `homeSelectedProjects` document — a SINGLETON (fixed id
// "homeSelectedProjects"): the "Selected projects" section on the home page.
//
// Read through getSelectedProjects() in src/app/lib/contentSource.js, which
// falls back to the local selection (the six newest photographed projects,
// selectedProjects() in lib/projectStats.js) while no Sanity project is
// connected or nothing usable is published.
//
// ── REFERENCES, not copies ───────────────────────────────────────────────────
// Each card is a reference to a `project` document. Spec §20 (see project.js):
// "Do NOT create separate copies of projects for … the homepage." The card's
// photo, name, format, sector and location all come from that one Project
// document, so editing a project updates its card too.
//
// ── what the site will actually show ─────────────────────────────────────────
// A card is shown only if its project is PUBLISHED (status "published", which
// the import sets only with a hero photo and written consent) AND has a detail
// page on the site — otherwise the card would link to a 404. Anything else is
// skipped, and the build logs which ones. The picker below already offers
// published projects only.

export default {
    name: "homeSelectedProjects",
    title: "Selected projects (home)",
    type: "document",
    fields: [
        {
            name: "eyebrow",
            title: "Eyebrow",
            type: "string",
            description: 'The small label above the heading, e.g. "Portfolio".',
        },
        {
            name: "heading",
            title: "Heading",
            type: "string",
            validation: (R) => R.required(),
        },
        {
            name: "description",
            title: "Description",
            type: "string",
            description:
                "One line beside the heading. Do not state a project total here — the owner removed it site-wide (2026-09-17).",
        },
        {
            name: "projects",
            title: "Projects",
            type: "array",
            of: [
                {
                    type: "reference",
                    to: [{ type: "project" }],
                    options: {
                        // Only projects that can go live: published = hero photo + consent.
                        filter: 'status == "published"',
                        disableNew: true,
                    },
                },
            ],
            description:
                "3 to 6 projects, in the order they should appear. The grid is three across, so 3 or 6 fills whole rows.",
            validation: (R) => [
                R.required().min(3).max(6).unique(),
                R.custom((list) =>
                    !list || list.length === 3 || list.length === 6
                        ? true
                        : "With 4 or 5 projects the last row of the grid is only partly filled."
                ).warning(),
            ],
        },
    ],
    preview: {
        select: { title: "heading" },
        prepare: ({ title }) => ({ title: title || "Selected projects", subtitle: "Home page" }),
    },
};
