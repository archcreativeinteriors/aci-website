// Sanity `service` document — one per service line: /services cards and each
// /services/<slug> page. Migrated from src/app/lib/data/services.js (2026-09-28).
//
// `icon` names a lucide-react icon the site maps in code (a data field cannot
// hold a component). `order` is the order of the /services cards.

export default {
    name: "service",
    title: "Service",
    type: "document",
    fields: [
        { name: "title", title: "Title", type: "string", description: 'e.g. "Salon Interiors".', validation: (R) => R.required() },
        {
            name: "slug",
            title: "Slug",
            type: "slug",
            options: { source: "title", maxLength: 40 },
            description: "The page address: /services/<slug>. Changing it changes the URL.",
            validation: (R) => R.required(),
        },
        {
            name: "icon",
            title: "Icon",
            type: "string",
            options: { list: ["scissors", "home", "building"] },
            validation: (R) => R.required(),
        },
        { name: "tagline", title: "Tagline", type: "string", description: "The one line on the /services card." },
        { name: "label", title: "Short label", type: "string", description: "2–3 words on the service page's hero and in its browser title." },
        {
            name: "image",
            title: "Photograph",
            type: "image",
            options: { hotspot: true },
            fields: [{ name: "alt", title: "Alt text", type: "string" }],
            validation: (R) => R.required(),
        },
        { name: "description", title: "Description", type: "text", rows: 4, validation: (R) => R.required() },
        { name: "features", title: "What we offer", type: "array", of: [{ type: "string" }] },
        { name: "process", title: "Our process", type: "array", of: [{ type: "string" }] },
        { name: "order", title: "Order", type: "number", description: "Lower numbers come first on /services.", validation: (R) => R.required().integer() },
    ],
    orderings: [{ title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
    preview: { select: { title: "title", subtitle: "tagline", media: "image" } },
};
