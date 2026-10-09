// Sanity `costingPage` document — a SINGLETON (fixed id "costingPage"): the
// /costing page. Migrated from the text in src/app/costing/page.js (2026-09-28).

export default {
    name: "costingPage",
    title: "Costing page",
    type: "document",
    fields: [
        { name: "eyebrow", title: "Small label above the heading", type: "string", description: 'e.g. "Transparent Pricing".' },
        {
            name: "heading",
            title: "Heading",
            type: "text",
            rows: 2,
            description: "A new line here is a line break on the page.",
            validation: (R) => R.required(),
        },
        { name: "intro", title: "Introduction", type: "text", rows: 3, validation: (R) => R.required() },
        { name: "price", title: "Price", type: "string", description: 'As shown, e.g. "₹2,500 – ₹4,500".', validation: (R) => R.required() },
        { name: "unit", title: "Price unit", type: "string", description: 'e.g. "Per Sq. Ft."', validation: (R) => R.required() },
        { name: "note", title: "Line under the price", type: "string" },
        { name: "includesHeading", title: "Heading of the list", type: "string", description: 'e.g. "What’s Included".' },
        { name: "includes", title: "What is included", type: "array", of: [{ type: "string" }], validation: (R) => R.required().min(1) },
    ],
    preview: { prepare: () => ({ title: "Costing page", subtitle: "/costing" }) },
};
