// People: the founder, the team, and the client testimonials.
// `photo` is a Sanity image { url, lqip, width, height, alt } — render it with
// components/PersonPhoto.jsx.

import { cache } from "react";
import { sanityFetch, required } from "./sanity";
import { FOUNDER, TEAM, TESTIMONIALS } from "./queries";

/** The founder, for /about and the home page's StudioBlock. */
export const getFounder = cache(async () => {
    const doc = required(await sanityFetch(FOUNDER), "Founder");
    required(doc.name, "Founder → name");
    return {
        name: doc.name,
        designation: doc.designation || "",
        photo: doc.photo?.url ? doc.photo : null,
        bio: Array.isArray(doc.bio) ? doc.bio.filter(Boolean) : [],
        quote: doc.quote || "",
    };
});

/** The /about team grid, in display order. An empty list shows no one. */
export const getTeam = cache(async () =>
    ((await sanityFetch(TEAM)) || [])
        .filter((m) => m && m.name)
        .map((m) => ({ name: m.name, designation: m.designation || "", photo: m.photo?.url ? m.photo : null }))
);

/** [{ name, role, text, rating? }] in display order. */
export const getTestimonials = cache(async () =>
    ((await sanityFetch(TESTIMONIALS)) || [])
        .filter((t) => t && t.name && t.text)
        .map((t) => ({ name: t.name, role: t.role || "", text: t.text, ...(t.rating ? { rating: t.rating } : {}) }))
);
