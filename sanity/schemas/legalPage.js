// Sanity `legalPage` document — /privacy-policy and /terms (ids
// "legalPage-privacy-policy", "legalPage-terms"). Migrated from the text in
// src/app/privacy-policy/page.js and src/app/terms/page.js (2026-09-28).
//
// The body is Portable Text: headings, paragraphs and bullet lists. The
// studio's contact details are NOT typed into it — {email}, {phone},
// {address} and {siteName} are filled in from Site settings when the page is
// built, so the legal pages can never show an old number. Only those four
// placeholders are accepted.
//
// Legal text: have changes reviewed before publishing them.

const TOKENS = ["email", "phone", "address", "siteName"];

function onlyKnownTokens(blocks) {
    const text = (blocks || [])
        .flatMap((b) => (b.children || []).map((c) => c.text || ""))
        .join(" ");
    const unknown = [...text.matchAll(/\{([^}]*)\}/g)].map((m) => m[1]).filter((t) => !TOKENS.includes(t));
    return unknown.length === 0
        ? true
        : `Unknown placeholder ${unknown.map((t) => `{${t}}`).join(", ")}. Use only ${TOKENS.map((t) => `{${t}}`).join(", ")}.`;
}

export default {
    name: "legalPage",
    title: "Legal page",
    type: "document",
    fields: [
        { name: "title", title: "Title", type: "string", validation: (R) => R.required() },
        {
            name: "slug",
            title: "Slug",
            type: "slug",
            description: "privacy-policy or terms — the page address. Do not change.",
            validation: (R) => R.required(),
        },
        {
            name: "lastUpdated",
            title: "Last updated",
            type: "string",
            description: 'Shown under the title as written, e.g. "September 2026". Change it whenever the text changes.',
            validation: (R) => R.required(),
        },
        {
            name: "body",
            title: "Text",
            type: "array",
            description:
                "Use Heading 2 for section titles. {email}, {phone}, {address} and {siteName} are replaced with the details from Site settings.",
            of: [
                {
                    type: "block",
                    styles: [
                        { title: "Normal", value: "normal" },
                        { title: "Heading 2", value: "h2" },
                    ],
                    lists: [{ title: "Bullet", value: "bullet" }],
                    marks: {
                        decorators: [
                            { title: "Bold", value: "strong" },
                            { title: "Italic", value: "em" },
                        ],
                        annotations: [],
                    },
                },
            ],
            validation: (R) => R.required().custom(onlyKnownTokens),
        },
    ],
    preview: { select: { title: "title", subtitle: "slug.current" } },
};
