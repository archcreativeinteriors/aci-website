// Sanity `project` document — spec §21.
//
// THE canonical project record. Spec §20: "Do NOT create separate copies of
// projects for brand pages, the all-projects page, the homepage or state
// sections. There should be one canonical Project document." Every surface on
// the site filters this one collection.
//
// Field names are snake-free camelCase and match what src/app/lib/cms/queries.js
// projects and what src/app/lib/projectSource.js hands the components, so the
// migration is a change of source, not a change of shape.
//
// LIVE for the 34 project pages (2026-09-25): /projects/[id] reads its title,
// copy and photos from here (lib/projectSource.js getProjectPage), falling
// back field by field to data/projects.js text. The list, brand and state
// pages, map and sitemap still read src/app/lib/data/projectsData.js.

export default {
    name: "project",
    title: "Project",
    type: "document",
    fields: [
        { name: "name", title: "Project name", type: "string", validation: (R) => R.required() },
        // The project's OWN page is titled more specifically than the list
        // name: "Geetanjali Salon Worldmark" on the page, "Geetanjali Salon" in
        // the list (27 of the 34 pages). Blank means the page uses the name.
        {
            name: "pageTitle",
            title: "Page title",
            type: "string",
            description:
                "The heading on this project's own page and in the browser tab. Leave empty to use the project name.",
        },
        {
            name: "slug",
            title: "Slug",
            type: "slug",
            options: { source: "name", maxLength: 96 },
            validation: (R) => R.required(),
        },
        {
            name: "brand",
            title: "Brand",
            type: "reference",
            to: [{ type: "brand" }],
            // §20: a reference, never a duplicated brand name string. The brand
            // page's project list is this reference resolved backwards.
            validation: (R) => R.required(),
        },

        // ── classification
        { name: "sector", title: "Sector", type: "string", options: { list: ["Salon and studio", "Commercial", "Residential"] } },
        { name: "subCategory", title: "Format", type: "string", options: { list: ["Salon", "Studio", "Academy", "Spa", "Nail studio", "Retail", "Restaurant", "Estate"] } },

        // ── place. `location` is the owner's free text as written ("Vista
        // Square Mall Sec-82A Gurgaon"); city/state are the canonical values the
        // counts are derived from. Both are shown on the detail page (§18).
        { name: "location", title: "Location (as written)", type: "string" },
        // The project's OWN page names its place more briefly than the list
        // (32 of the 34 pages): "Sector 65 Gurugram" in the page title and
        // search results, "Worldmark Sector 65 Gurgaon" in the list.
        {
            name: "pageLocation",
            title: "Location on the project page",
            type: "string",
            description:
                'Shown after the page title in the browser tab and search results, e.g. "Sector 65 Gurugram". Leave empty to use Location.',
        },
        { name: "city", title: "City", type: "string" },
        { name: "state", title: "State", type: "string" },
        { name: "latitude", title: "Latitude", type: "number" },
        { name: "longitude", title: "Longitude", type: "number" },

        // ── §27: leave blank when unknown — the front end must never invent a
        // scope. (Year completed, area and duration were removed 2026-09-24.)
        { name: "scope", title: "Scope", type: "text" },

        // ── editorial grading
        { name: "tier", title: "Tier", type: "string", options: { list: ["flagship", "standard", "archive"] } },
        { name: "photoQuality", title: "Photo quality", type: "string", options: { list: ["approved", "usable", "none"] } },
        { name: "storyStrength", title: "Story strength", type: "string", options: { list: ["strong", "adequate", "thin"] } },

        // §26: photoQuality "none" is what makes a card render the
        // "Photograph to be shot" state instead of an image. It is a content
        // decision, made here, not a front-end guess.
        {
            name: "heroImage",
            title: "Hero image",
            type: "image",
            options: { hotspot: true },
            fields: [{ name: "alt", title: "Alt text", type: "string" }],
        },
        {
            name: "gallery",
            title: "Gallery",
            type: "array",
            of: [{ type: "image", options: { hotspot: true }, fields: [{ name: "alt", type: "string" }] }],
        },
        {
            name: "beforeImages",
            title: "Before images",
            type: "array",
            of: [{ type: "image", options: { hotspot: true }, fields: [{ name: "alt", type: "string" }] }],
        },

        // ── written copy. These four are what projects/[id] renders as the
        // Overview / Challenge / Solution / Features sections, and they are what
        // the content pack's details.txt collects. They live in
        // data/projects.js today as desc / challenge / solution / features[];
        // without them here the 34 projects that HAVE copy would lose it on
        // migration and the detail page would be a spec panel and nothing else.
        { name: "overview", title: "Overview", type: "text" },
        { name: "challenge", title: "Challenge", type: "text" },
        { name: "solution", title: "Solution", type: "text" },
        {
            name: "features",
            title: "Features",
            type: "array",
            of: [{ type: "string" }],
        },

        { name: "testimonial", title: "Testimonial", type: "text" },
        { name: "credits", title: "Credits", type: "string" },

        // A project is only linked and only enters generateStaticParams when
        // published. Anything else stays an index row without a detail page.
        { name: "status", title: "Status", type: "string", options: { list: ["published", "draft", "archived"] }, initialValue: "draft" },
        { name: "clientDisplayConsent", title: "Client display consent", type: "boolean", initialValue: false },

        // Sort key. The owner's list is numbered 1 (oldest) to 192 (newest) and
        // the index reads it descending, so ordering survives a re-import
        // rather than depending on document order.
        //
        // A NEW project must land at the TOP, so a project created in the
        // Studio starts with the next number (highest existing + 1) instead of
        // an empty field. Left empty it would not sort reliably, and a typed
        // number below the highest would drop it into the middle of the list.
        //
        // A DECIMAL places a project BETWEEN two others (owner, 2026-09-29):
        // Geetanjali Academy Hauz Khas is 120.5, directly above #120 and below
        // #121, without renumbering anything. Whole numbers stay tied to the
        // owner's numbered photo folders (scripts/project-photos.mjs), which is
        // why the others must not be shifted. The document id drops the dot
        // (project-120-5): a dotted id is private and invisible to the site.
        {
            name: "listNo",
            title: "List number",
            type: "number",
            description:
                "Sets the order on the site — the highest number is shown first. A new project is given the next number automatically. To place a project between two others, use a number between theirs (e.g. 120.5 sits between 121 and 120).",
            initialValue: async (_params, { getClient }) => {
                const highest = await getClient({ apiVersion: "2024-01-01" }).fetch(
                    `*[_type == "project" && defined(listNo)] | order(listNo desc)[0].listNo`
                );
                return (highest || 0) + 1;
            },
            validation: (R) => [
                R.required().positive(),
                // Two projects with one number have no defined order between
                // them. Catches a duplicated document too, which copies the number.
                R.custom(async (listNo, { document, getClient }) => {
                    if (listNo == null) return true;
                    const id = document._id.replace(/^drafts\./, "");
                    const taken = await getClient({ apiVersion: "2024-01-01" }).fetch(
                        `count(*[_type == "project" && listNo == $listNo && !(_id in [$id, "drafts." + $id])])`,
                        { listNo, id }
                    );
                    return taken ? `Another project already has number ${listNo}.` : true;
                }).warning(),
            ],
        },
    ],
    orderings: [
        {
            title: "Newest first",
            name: "listDesc",
            by: [
                { field: "listNo", direction: "desc" },
                { field: "_createdAt", direction: "desc" },
            ],
        },
    ],
    preview: {
        select: { title: "name", subtitle: "location", media: "heroImage" },
    },
};
