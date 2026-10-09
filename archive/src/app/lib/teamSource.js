// The ONE module that knows where the founder and team come from — the people
// equivalent of projectSource.js.
//
// Sanity first: once NEXT_PUBLIC_SANITY_PROJECT_ID is set, these run the
// FOUNDER / TEAM projections from lib/cms/queries.js against the `founder` and
// `teamMember` documents. Until then — and whenever nothing has been published
// yet — they return lib/data/team.js, which is what the site renders today.
// Either way the shape is the same: { name, designation, photo, … }.
//
// `photo` is the one field whose SHAPE differs by source: a static import or a
// /public path locally, a `{ url, lqip, width, height, alt }` object from
// Sanity. components/PersonPhoto.jsx renders both, so callers never branch.
//
// The fallback on an EMPTY result is deliberate: connecting the project before
// anyone has entered the team must not blank the /about grid. The consequence
// is that unpublishing every team member brings the local list back rather
// than hiding the section — remove people from lib/data/team.js too if that
// is ever the intent.

import { sanityFetch } from "./cms/client";
import { FOUNDER, TEAM } from "./cms/queries";
import { founder as localFounder, team as localTeam } from "./data/team";

/** The founder, for /about and the home page's StudioBlock. */
export async function getFounder() {
    const doc = await sanityFetch(FOUNDER);
    if (!doc || !doc.name) return localFounder;
    return {
        name: doc.name,
        designation: doc.designation || "",
        photo: doc.photo || null,
        bio: Array.isArray(doc.bio) ? doc.bio.filter(Boolean) : [],
        quote: doc.quote || "",
    };
}

/** The team grid on /about, in display order. */
export async function getTeam() {
    const docs = await sanityFetch(TEAM, {}, []);
    const members = (docs || []).filter((m) => m && m.name);
    if (members.length === 0) return localTeam;
    return members.map((m) => ({
        name: m.name,
        designation: m.designation || "",
        photo: m.photo || null,
    }));
}
