// Sanity `homeHero` document — a SINGLETON (fixed id "homeHero"), the top of
// the home page: the photographs, the kicker line, the <h1> and the paragraph.
//
// Read through src/app/lib/heroSource.js, which falls back to
// src/app/lib/data/hero.js while no Sanity project is connected. Field names
// match that local module exactly.
//
// ── why EXACTLY four slides ──────────────────────────────────────────────────
// The desktop cross-fade is pure CSS (styles/home.css, `.xheroSlide` +
// `@keyframes heroCross`): a 24s cycle, four delays, four keyframe stops. Its
// timing is written for four slides. With three, the hero shows nothing for 6s
// of every cycle; with five, the fifth never appears. So the count is enforced
// here rather than trusted — change the CSS first if it ever needs to differ.
//
// ── why the paragraph has {placeholders} ─────────────────────────────────────
// The paragraph quotes the largest rollout ("a 104-space national rollout
// across 15 states"). Those figures are DERIVED from the project list at build
// time (CLAUDE.md: never type a number the data can compute), so the editor
// writes the tokens and the site fills them in. Only the tokens listed below
// are accepted, so a typo is caught here instead of shipping as literal braces.
// The site fills them in src/app/lib/heroSource.js — keep the two lists equal.

const TOKENS = ["rolloutSpaces", "rolloutStates"];

function onlyKnownTokens(text) {
    if (!text) return true;
    const unknown = [...text.matchAll(/\{([^}]*)\}/g)]
        .map((m) => m[1])
        .filter((t) => !TOKENS.includes(t));
    return unknown.length === 0
        ? true
        : `Unknown placeholder ${unknown.map((t) => `{${t}}`).join(", ")}. Use only ${TOKENS.map((t) => `{${t}}`).join(" or ")}.`;
}

const imageWithAlt = (altDescription) => ({
    type: "image",
    options: { hotspot: true },
    fields: [{ name: "alt", title: "Alt text", type: "string", description: altDescription }],
});

export default {
    name: "homeHero",
    title: "Home hero",
    type: "document",
    fields: [
        {
            name: "eyebrow",
            title: "Kicker",
            type: "string",
            description: 'The small line above the heading, e.g. "Salon · Commercial · Residential interiors since 2005".',
        },
        {
            name: "heading",
            title: "Heading",
            type: "string",
            description: "The page's main heading (<h1>). Keep it to one line on a laptop.",
            validation: (R) => R.required().max(80),
        },
        {
            name: "paragraph",
            title: "Paragraph",
            type: "text",
            rows: 3,
            description:
                "Under the heading. {rolloutSpaces} and {rolloutStates} are replaced with the largest client rollout's project and state counts, worked out from the project list — type the placeholder, not the number.",
            validation: (R) => R.required().custom(onlyKnownTokens),
        },
        {
            name: "slides",
            title: "Desktop slideshow",
            type: "array",
            of: [
                imageWithAlt(
                    "Used for the FIRST slide only — the rest are decorative repeats and are hidden from screen readers."
                ),
            ],
            description:
                "Exactly four landscape photographs, shown in this order. The first one loads first, so make it the strongest.",
            validation: (R) =>
                R.required().length(4).error("The slideshow needs exactly four photographs (see the note in the schema)."),
        },
        {
            name: "mobileImage",
            title: "Mobile photo",
            ...imageWithAlt("Describe the photograph for screen readers."),
            description: "One portrait photograph, used instead of the slideshow on phones (below 768px).",
            validation: (R) => R.required(),
        },
    ],
    preview: {
        select: { title: "heading", media: "mobileImage" },
        prepare: ({ title, media }) => ({ title: title || "Home hero", subtitle: "Home page", media }),
    },
};
