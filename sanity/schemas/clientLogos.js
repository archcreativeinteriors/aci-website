// Sanity `clientLogos` document — a SINGLETON (fixed id "clientLogos"): the
// logo wall on /clients.
//
// Read through getClientLogoRows() in src/app/lib/contentSource.js, which falls
// back to src/app/lib/data/clientLogos.js while no Sanity project is connected.
//
// ── ROWS are the layout ──────────────────────────────────────────────────────
// Exactly like the local file: each row is one line of the grid and its length
// is how many logos share it. The grid is 12 columns and styles/clients-page.css
// sizes a tile by its row's length — 1 logo spans 12, 2 span 6, 3 span 4, 4 span
// 3 — so every row fills the width, and a row of 2 gets taller logos than a row
// of 4. That is why a row holds 1 to 4 logos and never more: there is no style
// for 5. Reorder logos by dragging them between rows.
//
// The "You can be here" tile joins the LAST row, so keep that row to 3 logos or
// fewer. If it has 4, the site puts the tile on a row of its own instead.
//
// A NEW client goes at the BOTTOM: the last row, or a new row after it (the
// Studio appends there by default). The page renders rows in stored order.
//
// ── names matter ─────────────────────────────────────────────────────────────
// `name` becomes the alt text ("<name> logo") that screen readers and search
// engines read. Type the brand as written on the artwork — filenames are
// abbreviations and made "La logo" / "Natu logo" before names were added.
//
// These are CLIENT logos (82 companies the studio has worked for). They are not
// the 66 project `brand` documents, which carry a logo field of their own.

const logo = {
    name: "clientLogo",
    title: "Logo",
    type: "object",
    fields: [
        {
            name: "name",
            title: "Company name",
            type: "string",
            description: 'As written on the logo, e.g. "Rosewood Projects". Used as the alt text.',
            validation: (R) => R.required(),
        },
        {
            name: "image",
            title: "Logo image",
            type: "image",
            description: "PNG with a transparent or white background, trimmed close to the mark.",
            validation: (R) => R.required(),
        },
        {
            name: "wide",
            title: "Wide banner logo",
            type: "boolean",
            initialValue: false,
            description:
                "For a very wide logo (about 5:1, like UPS) alone on its row — gives it a shorter, wider band.",
        },
    ],
    preview: { select: { title: "name", media: "image" } },
};

const row = {
    name: "clientLogoRow",
    title: "Row",
    type: "object",
    fields: [
        {
            name: "logos",
            title: "Logos in this row",
            type: "array",
            of: [logo],
            description: "1 to 4. Fewer logos per row means bigger logos.",
            validation: (R) => R.required().min(1).max(4),
        },
    ],
    preview: {
        select: { a: "logos.0.name", b: "logos.1.name", c: "logos.2.name", d: "logos.3.name", m: "logos.0.image" },
        prepare: ({ a, b, c, d, m }) => {
            const names = [a, b, c, d].filter(Boolean);
            return { title: names.join(" · ") || "Empty row", subtitle: `${names.length} logo(s)`, media: m };
        },
    },
};

export default {
    name: "clientLogos",
    title: "Client logos",
    type: "document",
    fields: [
        {
            name: "rows",
            title: "Rows",
            type: "array",
            of: [row],
            description:
                "Top to bottom, as they appear on /clients. A new client goes at the END: add it to the last row, or add a new row at the bottom.",
            validation: (R) => [
                R.required().min(1),
                R.custom((rows) => {
                    const last = rows && rows[rows.length - 1];
                    return !last || !last.logos || last.logos.length <= 3
                        ? true
                        : 'The last row has 4 logos, so the "You can be here" tile will sit on a row of its own. Keep the last row to 3 or fewer to share it.';
                }).warning(),
            ],
        },
    ],
    preview: { prepare: () => ({ title: "Client logos" }) },
};
