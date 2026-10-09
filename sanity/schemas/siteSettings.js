// Sanity `siteSettings` document — a SINGLETON (fixed id "siteSettings"):
// the contact details and the headline numbers.
//
// Read through src/app/lib/contentSource.js (getSiteSettings), which falls back
// to src/app/lib/data/siteSettings.js while no Sanity project is connected.
//
// ── phone numbers: type each ONCE ────────────────────────────────────────────
// Every number is used in several formats — a tel: link, a display form, a
// wa.me link, the Organization JSON-LD. The editor types the number once, in
// any common format ("+91 98111 41227", "09811141227", "9811141227"), and
// lib/contact.js derives every format from its 10 digits. Typing four variants
// by hand is how a footer ends up dialling a different number from the one it
// shows. Numbers must be Indian (10 digits after an optional +91 / 0).
//
// ── NAP ──────────────────────────────────────────────────────────────────────
// The email and the primary phone are part of the business's Name / Address /
// Phone, which must match the Google Business Profile character for character
// (local search ranks on it). Change them there in the same sitting.
//
// ── the numbers ──────────────────────────────────────────────────────────────
// Cities and States are TYPED here (owner's decision, 2026-09-24). They are no
// longer calculated from the project list, so they do not change when projects
// are added — update them by hand when the portfolio reaches a new city or
// state.

const PHONE_HELP = 'Type it once, any common format, e.g. "+91 98111 41227".';

function indianPhone(value) {
    if (!value) return true;
    const digits = String(value).replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
    return /^[1-9]\d{9}$/.test(digits)
        ? true
        : "Enter a 10-digit Indian number, optionally starting with +91 or 0.";
}

const phoneField = (name, title, description) => ({
    name,
    title,
    type: "string",
    fieldset: "contact",
    description: `${description} ${PHONE_HELP}`,
    validation: (R) => R.required().custom(indianPhone),
});

const countField = (name, title, description) => ({
    name,
    title,
    type: "number",
    fieldset: "numbers",
    description,
    validation: (R) => R.required().integer().min(1),
});

export default {
    name: "siteSettings",
    title: "Site settings",
    type: "document",
    fieldsets: [
        { name: "contact", title: "Contact details" },
        { name: "numbers", title: "Headline numbers" },
        { name: "business", title: "Address, hours and links" },
    ],
    fields: [
        {
            name: "email",
            title: "Email",
            type: "string",
            fieldset: "contact",
            description: "Footer, top bar, /contact, the floating email button and the search markup.",
            validation: (R) => R.required().email(),
        },
        phoneField(
            "phone",
            "Contact number (primary)",
            "The studio line: shown second in the footer, top bar, /contact, the legal pages and the 404 page; the only number in the search markup (keep it the same as the Google Business Profile)."
        ),
        phoneField(
            "callPhone",
            "Call button number",
            "The floating call button, the \"New enquiries\" line on the home page, and the FIRST of the two numbers shown for calling in the top bar, footer, /contact, the legal pages and the 404 page (the contact number is the second). A separate real line from the primary number."
        ),
        phoneField(
            "whatsappPhone",
            "WhatsApp number",
            "The floating WhatsApp button, the home page and /contact."
        ),
        countField(
            "spacesDelivered",
            "Spaces delivered",
            'Shown as "1000+" in the home and /about stats and on /services ("1000+ salon, commercial and residential spaces"). Type the number without the "+".'
        ),
        countField("cities", "Cities", "Shown in the home and /about stats, and in page copy."),
        countField("states", "States", "Shown in the home and /about stats, and in page copy."),

        // ── address, hours, links: migrated from BUSINESS in src/app/lib/site.js
        // (2026-09-28). Part of the NAP — keep it identical to the Google
        // Business Profile.
        {
            name: "address",
            title: "Studio address",
            type: "object",
            fieldset: "business",
            description: "Footer, /contact, the legal pages and the search markup. Must match the Google Business Profile.",
            validation: (R) => R.required(),
            fields: [
                { name: "streetAddress", title: "Street address", type: "string", validation: (R) => R.required() },
                { name: "locality", title: "City", type: "string", validation: (R) => R.required() },
                { name: "region", title: "State", type: "string", validation: (R) => R.required() },
                { name: "postalCode", title: "PIN code", type: "string", validation: (R) => R.required().regex(/^\d{6}$/, { name: "6-digit PIN" }) },
            ],
        },
        { name: "shortAddress", title: "Short address", type: "string", fieldset: "business", description: 'The top bar, e.g. "DLF Phase 3, Gurugram".', validation: (R) => R.required() },
        { name: "mapsUrl", title: "Google Maps link", type: "url", fieldset: "business", description: "Opened by \"Get directions\".", validation: (R) => R.required() },
        {
            name: "mapsEmbedUrl",
            title: "Google Maps embed address",
            type: "url",
            fieldset: "business",
            description: "The src of Google's \"Embed a map\" code. Loaded only after a visitor accepts cookies.",
            validation: (R) => R.required(),
        },
        {
            name: "geo",
            title: "Map position",
            type: "object",
            fieldset: "business",
            description: "The studio's latitude / longitude, for search engines.",
            fields: [
                { name: "lat", title: "Latitude", type: "number", validation: (R) => R.required() },
                { name: "lng", title: "Longitude", type: "number", validation: (R) => R.required() },
            ],
        },
        {
            name: "openingDays",
            title: "Open on",
            type: "array",
            fieldset: "business",
            of: [{ type: "string" }],
            options: { list: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
            description: "Consecutive days, e.g. Monday to Saturday — the footer shows the first and last.",
            validation: (R) => R.required().min(1),
        },
        { name: "opens", title: "Opens", type: "string", fieldset: "business", description: '24-hour time, e.g. "09:30".', validation: (R) => R.required().regex(/^\d{2}:\d{2}$/, { name: "HH:MM" }) },
        { name: "closes", title: "Closes", type: "string", fieldset: "business", description: '24-hour time, e.g. "18:30".', validation: (R) => R.required().regex(/^\d{2}:\d{2}$/, { name: "HH:MM" }) },
        { name: "socialLinks", title: "Social profiles", type: "array", fieldset: "business", of: [{ type: "url" }], description: "Instagram, Facebook, LinkedIn — full addresses." },
        { name: "areaServed", title: "Areas served", type: "array", fieldset: "business", of: [{ type: "string" }], description: "For search engines." },
        { name: "priceRange", title: "Price range", type: "string", fieldset: "business", description: 'For search engines, e.g. "₹₹₹".' },
    ],
    preview: { prepare: () => ({ title: "Site settings" }) },
};
