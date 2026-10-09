// Sanity `founder` document — a SINGLETON.
//
// There is one founder, so there is one document, with the fixed id "founder".
// sanity.config.js pins it in the desk (Content > Founder opens that document
// directly) and removes "Founder" from the "create new" menu, so a second copy
// can never be made by accident — two founder documents would leave the site
// choosing between them.
//
// Rendered twice: the /about Founder section and the home page's StudioBlock.
// Both read it through src/app/lib/teamSource.js, which falls back to
// src/app/lib/data/team.js while no Sanity project is connected. Field names
// match that local module exactly, so the switch is a change of source only.

export default {
    name: "founder",
    title: "Founder",
    type: "document",
    fields: [
        { name: "name", title: "Name", type: "string", validation: (R) => R.required() },
        {
            name: "designation",
            title: "Designation",
            type: "string",
            description: 'Shown under the name, e.g. "Founder and Principal Designer".',
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
            name: "bio",
            title: "About the founder",
            type: "array",
            of: [{ type: "text", rows: 3 }],
            description: "One entry per paragraph, in the order they should appear.",
        },
        {
            name: "quote",
            title: "Quote",
            type: "text",
            rows: 2,
            description: "The founder's own words. Type it without quotation marks — the site adds them.",
        },
    ],
    preview: { select: { title: "name", subtitle: "designation", media: "photo" } },
};
