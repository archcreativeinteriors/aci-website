// The home hero — the LOCAL source.
//
// Read only through lib/heroSource.js, which prefers the Sanity `homeHero`
// singleton (sanity/schemas/homeHero.js) once a project is connected and falls
// back to this module until then. Keys match that schema field for field.
//
// `paragraph` carries {rolloutSpaces} / {rolloutStates}, filled in by
// heroSource.js from the project data — never type those numbers here.

import slide1 from "../../../../public/heroo.jpg";
import slide2 from "../../../../public/hero.webp";
import slide3 from "../../../../public/hero4.jpg";
import slide4 from "../../../../public/hero2.jpeg";
import mobile from "../../../../public/mob1.jpg";

export const hero = {
    eyebrow: "Salon · Commercial · Residential interiors since 2005",
    heading: "1000+ spaces delivered across India.",
    paragraph:
        "Turnkey interiors for salons, restaurants, showrooms, offices and homes — from a single Delhi studio to a {rolloutSpaces}-space national rollout across {rolloutStates} states.",
    // Exactly four — the CSS cross-fade in styles/home.css is timed for four.
    // Only the FIRST alt is used; the other three are decorative repeats.
    slides: [
        { image: slide1, alt: "Salon interior by Arch Creative Interiors" },
        { image: slide2 },
        { image: slide3 },
        { image: slide4 },
    ],
    mobileImage: { image: mobile, alt: "Salon interior by Arch Creative Interiors" },
};
