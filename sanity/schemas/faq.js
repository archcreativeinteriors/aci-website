// Sanity `faq` document — one question and its answer.
//
// Read through src/app/lib/contentSource.js (getFaqs), which falls back to
// src/app/lib/data/faqs.js while no Sanity project is connected. Local keys are
// `q` / `a`; contentSource maps question/answer onto them.
//
// Rendered on /about as <details> AND emitted there as FAQPage JSON-LD from the
// same list, so the visible questions and the markup can never disagree. Keep
// answers factual — an FAQPage answer is a published claim in search results.

export default {
    name: "faq",
    title: "FAQ",
    type: "document",
    fields: [
        { name: "question", title: "Question", type: "string", validation: (R) => R.required() },
        {
            name: "answer",
            title: "Answer",
            type: "text",
            rows: 4,
            description: "Plain text — no links or lists.",
            validation: (R) => R.required(),
        },
        {
            name: "order",
            title: "Order",
            type: "number",
            description: "1 is shown first.",
            validation: (R) => R.required().integer().min(1),
        },
    ],
    orderings: [{ title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
    preview: { select: { title: "question", subtitle: "answer" } },
};
