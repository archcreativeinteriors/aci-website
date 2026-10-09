// The home "Selected projects" section's text — the LOCAL source.
//
// Read through getSelectedProjects() in lib/contentSource.js, which prefers the
// Sanity `homeSelectedProjects` singleton and falls back to this text (with the
// six newest photographed projects) until then. sanity/scripts/seed.mjs copies
// it into that singleton, so the two cannot drift.

export const selectedProjectsText = {
    eyebrow: "Portfolio",
    heading: "Selected projects",
    // Qualitative by the owner's choice — it read "{n} of {total}." until the
    // project total was removed site-wide (2026-09-17). Never put a figure back.
    description: "A selection from across the portfolio.",
};
