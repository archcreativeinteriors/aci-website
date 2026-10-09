// Sanity `brand` document — spec §21.
//
// Project COUNT is deliberately not a field here. Spec §21: "Project count
// should be derived from related projects", and §4 forbids hard-coding any
// number the data can compute. A stored count is a number that goes stale the
// first time a project is added.
//
// Whether a brand gets its own collection page is likewise derived, not stored:
// spec §23 sets the rule at 3+ projects (BRAND_COLLECTION_MIN in
// src/app/lib/projectStats.js). On the current 192 rows that is 7 brands of 66.

export default {
    name: "brand",
    title: "Brand",
    type: "document",
    fields: [
        { name: "name", title: "Brand name", type: "string", validation: (R) => R.required() },
        {
            name: "slug",
            title: "Slug",
            type: "slug",
            options: { source: "name", maxLength: 96 },
            validation: (R) => R.required(),
        },
        {
            name: "logo",
            title: "Logo",
            type: "image",
            fields: [{ name: "alt", title: "Alt text", type: "string" }],
        },
        {
            name: "heroImage",
            title: "Brand hero image",
            type: "image",
            options: { hotspot: true },
            fields: [{ name: "alt", title: "Alt text", type: "string" }],
            description:
                "Optional. Falls back to the brand's newest photographed project.",
        },
        {
            name: "description",
            title: "Description",
            type: "text",
            description:
                "The brand's own story. Leave blank and the page composes a line from the derived counts.",
        },
        // §26 / §27: consent gates whether the brand may be shown at all.
        { name: "displayConsent", title: "Display consent", type: "boolean", initialValue: true },
        { name: "featured", title: "Featured", type: "boolean", initialValue: false },
    ],
    preview: { select: { title: "name", media: "logo" } },
};
