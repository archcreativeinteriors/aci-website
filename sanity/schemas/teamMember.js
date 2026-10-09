// Sanity `teamMember` document — one per person in "The team" on /about.
//
// Read through src/app/lib/teamSource.js, which falls back to
// src/app/lib/data/team.js while no Sanity project is connected. Field names
// match that local module exactly.
//
// `order` is the sort key, not document order: the grid lists people in the
// order the studio chose (Director first), and a stored number survives edits
// and re-imports where creation order would not. Lower numbers come first; ties
// fall back to the name.

export default {
    name: "teamMember",
    title: "Team member",
    type: "document",
    fields: [
        { name: "name", title: "Name", type: "string", validation: (R) => R.required() },
        {
            name: "designation",
            title: "Designation",
            type: "string",
            description: 'e.g. "Project Head".',
            validation: (R) => R.required(),
        },
        {
            name: "photo",
            title: "Photo",
            type: "image",
            options: { hotspot: true },
            fields: [
                {
                    name: "alt",
                    title: "Alt text",
                    type: "string",
                    description: 'Leave blank to use "<name>, <designation>".',
                },
            ],
            validation: (R) => R.required(),
        },
        {
            name: "order",
            title: "Order",
            type: "number",
            description: "Position in the team grid. 1 is shown first.",
            validation: (R) => R.required().integer().min(1),
        },
    ],
    orderings: [
        { title: "Team order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
    ],
    preview: { select: { title: "name", subtitle: "designation", media: "photo" } },
};
