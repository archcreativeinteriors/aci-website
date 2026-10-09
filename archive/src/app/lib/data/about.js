// The /about intro block — the LOCAL source.
//
// Read only through getAboutIntro() in lib/contentSource.js, which prefers the
// Sanity `aboutPage` singleton (sanity/schemas/aboutPage.js) once a project is
// connected and falls back to this module until then. Keys match that schema,
// except `imageAlt` — Sanity keeps the alt text on the image itself, and
// getAboutIntro() hands both sources back as { image, imageAlt }.
//
// The first paragraph carries {rolloutSpaces} / {rolloutBrand} /
// {rolloutStates}, filled in from the project data (the largest client
// rollout) — never type those numbers here.

import image from "../../../../public/images/about-2.jpg";

export const about = {
    heading: "Creating Timeless Interiors Through Design, Detail & Craftsmanship",
    image,
    imageAlt: "Arch Creative Interiors studio",
    sectionHeading: "Every Space Has A Story.",
    paragraphs: [
        "We started in Delhi building one salon at a time. Twenty years later the same approach runs a {rolloutSpaces}-space {rolloutBrand} rollout across {rolloutStates} states: one site manager per project, from strip-out to opening day.",
        "At Arch Creative Interiors, we transform ideas into sophisticated environments that balance aesthetics, functionality, and lasting value.",
        "Our design philosophy combines modern luxury, intelligent planning, and meticulous execution to create spaces that truly reflect the people who live and work within them.",
    ],
};
