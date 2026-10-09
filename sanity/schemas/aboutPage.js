// Sanity `aboutPage` document — a SINGLETON (fixed id "aboutPage"): the top of
// /about — the page's <h1>, the photograph, and the "About us" text beside it.
//
// Read through getAboutIntro() in src/app/lib/contentSource.js, which falls
// back to src/app/lib/data/about.js while no Sanity project is connected. Field
// names match that local module exactly. ALL OR NOTHING: a document missing its
// photo, a heading or every paragraph falls back to the local block as a whole.
//
// The rest of /about has its own homes — the three stats are in Site settings,
// the founder and the team in Founder / Team, the questions in FAQs.
//
// ── why the paragraphs have {placeholders} ───────────────────────────────────
// The first paragraph quotes the largest client rollout ("a 104-space
// Geetanjali rollout across 15 states"). Those figures are DERIVED from the
// project list at build time, so the editor types the placeholder and the site
// fills it in — the same approach as the Home hero. Only the tokens below are
// accepted, so a typo is caught here instead of shipping as literal braces.
// Keep this list equal to ABOUT_TOKENS in src/app/lib/contentSource.js.

const TOKENS = ["rolloutSpaces", "rolloutBrand", "rolloutStates"];

function onlyKnownTokens(text) {
    if (!text) return true;
    const unknown = [...text.matchAll(/\{([^}]*)\}/g)]
        .map((m) => m[1])
        .filter((t) => !TOKENS.includes(t));
    return unknown.length === 0
        ? true
        : `Unknown placeholder ${unknown.map((t) => `{${t}}`).join(", ")}. Use only ${TOKENS.map((t) => `{${t}}`).join(", ")}.`;
}

export default {
    name: "aboutPage",
    title: "About page",
    type: "document",
    fields: [
        {
            name: "heading",
            title: "Page heading",
            type: "string",
            description:
                "The page's main heading (<h1>) at the very top, e.g. \"Creating Timeless Interiors Through Design, Detail & Craftsmanship\".",
            validation: (R) => R.required().max(120),
        },
        {
            name: "image",
            title: "Photograph",
            type: "image",
            options: { hotspot: true },
            description:
                "Shown beside the \"About us\" text — a landscape photo of the studio or a finished project. It is also the picture used when /about is shared on social media.",
            fields: [
                {
                    name: "alt",
                    title: "Alt text",
                    type: "string",
                    description: "Describe the photograph for screen readers, e.g. \"Arch Creative Interiors studio\".",
                    validation: (R) => R.required(),
                },
            ],
            validation: (R) => R.required(),
        },
        {
            name: "sectionHeading",
            title: "Heading beside the photo",
            type: "string",
            description: 'Under the small "About us" label, e.g. "Every Space Has A Story."',
            validation: (R) => R.required().max(80),
        },
        {
            name: "paragraphs",
            title: "Paragraphs",
            type: "array",
            of: [{ type: "text", rows: 3, validation: (R) => R.custom(onlyKnownTokens) }],
            description:
                "Shown in this order beside the photo. {rolloutSpaces}, {rolloutBrand} and {rolloutStates} are replaced with the largest client rollout's project count, brand and state count, worked out from the project list — type the placeholder, not the number.",
            validation: (R) => R.required().min(1).max(5),
        },
        // Migrated from STAGES in src/app/about/page.js (2026-09-28).
        {
            name: "processStages",
            title: "How a project runs — stages",
            type: "array",
            description: 'The "Process" section, in order.',
            validation: (R) => R.required().min(1).max(8),
            of: [
                {
                    type: "object",
                    name: "processStage",
                    fields: [
                        { name: "label", title: "Label", type: "string", description: 'e.g. "Stage 1".', validation: (R) => R.required() },
                        { name: "title", title: "Title", type: "string", description: 'e.g. "Survey".', validation: (R) => R.required() },
                        { name: "text", title: "Text", type: "text", rows: 2, validation: (R) => R.required() },
                    ],
                    preview: { select: { title: "title", subtitle: "label" } },
                },
            ],
        },
    ],
    preview: {
        select: { title: "heading", media: "image" },
        prepare: ({ title, media }) => ({ title: title || "About page", subtitle: "/about", media }),
    },
};
