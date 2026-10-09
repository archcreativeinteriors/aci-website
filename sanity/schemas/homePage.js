// Sanity `homePage` document — a SINGLETON (fixed id "homePage"): home-page
// content that has no other home. Today: the three "What we do" cards.
// Migrated from src/app/components/home/WhatWeDo.jsx (2026-09-28).
//
// The hero, Selected projects, testimonials and headline numbers have their own
// documents (Home hero, Selected projects, Testimonials, Site settings).

export default {
    name: "homePage",
    title: "Home page",
    type: "document",
    fields: [
        {
            name: "whatWeDo",
            title: "What we do — cards",
            type: "array",
            validation: (R) => R.required().min(1).max(4),
            of: [
                {
                    type: "object",
                    name: "whatWeDoCard",
                    fields: [
                        { name: "title", title: "Title", type: "string", validation: (R) => R.required() },
                        { name: "body", title: "Text", type: "text", rows: 2, validation: (R) => R.required() },
                        {
                            name: "sector",
                            title: "Sector",
                            type: "string",
                            options: { list: ["Salon and studio", "Commercial", "Residential"] },
                            description: "Which projects the card counts.",
                            validation: (R) => R.required(),
                        },
                        { name: "href", title: "Link", type: "string", description: 'e.g. "/services/salon".', validation: (R) => R.required() },
                    ],
                    preview: { select: { title: "title", subtitle: "sector" } },
                },
            ],
        },
    ],
    preview: { prepare: () => ({ title: "Home page", subtitle: "What we do" }) },
};
