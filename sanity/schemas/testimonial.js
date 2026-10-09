// Sanity `testimonial` document — a client testimonial / customer review.
//
// Read through src/app/lib/contentSource.js (getTestimonials), which falls back
// to src/app/lib/data/testimonials.js while no Sanity project is connected.
// Field names match that module exactly.
//
// The home page shows the FIRST THREE by `order`, and emits Review JSON-LD for
// exactly those three. `rating` draws the stars on the card and is NEVER put in
// the schema markup — a rating the business declares about itself, on its own
// site, is ineligible for review rich results and invites a manual action
// (see the note in lib/jsonld.js reviewJsonLd). The stars are presentation.

export default {
    name: "testimonial",
    title: "Testimonial / review",
    type: "document",
    fields: [
        {
            name: "name",
            title: "Client name",
            type: "string",
            validation: (R) => R.required(),
        },
        {
            name: "role",
            title: "Role, company",
            type: "string",
            description:
                'Job title, a comma, then the company — e.g. "Owner, Tweak Salon". The part after the comma becomes the review\'s publisher in the search markup.',
            validation: (R) => R.required(),
        },
        {
            name: "text",
            title: "Testimonial",
            type: "text",
            rows: 4,
            description: "The client's own words only. Never write one on a client's behalf.",
            validation: (R) => R.required(),
        },
        {
            name: "rating",
            title: "Stars (1–5)",
            type: "number",
            description: "Optional. Leave blank and the card shows no stars.",
            validation: (R) => R.integer().min(1).max(5),
        },
        {
            name: "order",
            title: "Order",
            type: "number",
            description: "1 is shown first. The home page shows the first three.",
            validation: (R) => R.required().integer().min(1),
        },
    ],
    orderings: [{ title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
    preview: { select: { title: "name", subtitle: "role" } },
};
