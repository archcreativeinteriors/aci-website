// Contact details and headline numbers — the LOCAL source.
//
// Read only through lib/contentSource.js (getSiteSettings), which prefers the
// Sanity `siteSettings` singleton once a project is connected and falls back to
// this module until then. Keys match that schema field for field.
//
// PHONES: type each number once; lib/contact.js derives the tel:, display,
// wa.me and JSON-LD forms. The three are DIFFERENT real lines, owner-confirmed
// (2026-09) — `phone` is the studio's primary line (NAP: footer, top bar,
// /contact, schema), the other two are the floating buttons' channels. Do not
// "consolidate" them. `email` and `phone` must match the Google Business
// Profile exactly.
//
// NUMBERS: TYPED, not derived (owner's decision, 2026-09-24). They were
// computed from the project list (lib/projectStats.js) until then; these are
// the values that computation gave on that date. Update them by hand.

export const siteSettings = {
    email: "archcreativeinteriors@gmail.com", // TODO: swap for a branded mailbox
    phone: "+91 98111 41227",
    callPhone: "+91 95992 99979",
    whatsappPhone: "+91 95992 99980",

    spacesDelivered: 1000, // shown as "1000+"
    cities: 42,
    states: 16,
};
