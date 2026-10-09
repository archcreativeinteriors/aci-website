// The founder and the team — the LOCAL source.
//
// Read only through lib/teamSource.js, which prefers Sanity (the `founder` and
// `teamMember` documents in sanity/schemas/) once a project is connected and
// falls back to this module until then. Keys match those schemas field for
// field, so the components never need to know which source they got.
//
// This is the single copy. The founder block used to be written out twice —
// in /about and again in components/home/StudioBlock.jsx, with a comment
// asking whoever edited one to edit the other. Both now read from here.

import founderPhoto from "../../../../public/images/team/boss.png";

export const founder = {
    name: "Mr. Itinder Singh",
    designation: "Founder and Principal Designer",
    // Static import, so next/image gets a blur placeholder for free.
    photo: founderPhoto,
    bio: [
        "With a passion for timeless design and a commitment to excellence, our founder has led the journey of creating elegant and functional spaces that reflect individuality and purpose.",
        "Every project is driven by a deep understanding of aesthetics, detail, and client vision — turning ideas into refined living experiences.",
    ],
    // Without quotation marks; the components add them.
    quote: "Design is not only what people see. It’s what they feel when they enter a space.",
};

// Real people with real photographs, in the studio's order (Director first).
export const team = [
    { name: "Ravinder Singh", designation: "Director", photo: "/images/team/managing-director.jpg" },
    { name: "Suresh Sharma", designation: "Project Head", photo: "/images/team/project-head.jpg" },
    { name: "Shamim Ahmad", designation: "Sr. Interior Designer", photo: "/images/team/senior-interior.jpg" },
    { name: "Rajnish Thakur", designation: "Purchase Manager", photo: "/images/team/purchase-manager.jpg" },
    { name: "Shivani Rawat", designation: "HR & Admin", photo: "/images/team/hr.jpg" },
    { name: "Rakesh Arya", designation: "Account Head", photo: "/images/team/account-head.jpg" },
];
