// Site settings — contact details, headline numbers, and the studio's address,
// opening hours, maps and social links. One Sanity document ("Site settings").
//
// The address block moved here from BUSINESS in lib/site.js (Phase 6,
// 2026-09-28). `business` keeps the shape BUSINESS had, so everything that
// shows the NAP reads it the same way. It MUST match the Google Business
// Profile exactly — local search ranks on it.

import { cache } from "react";
import { sanityFetch, required } from "./sanity";
import { SITE_SETTINGS } from "./queries";
import { toContact } from "../contact";

/**
 * {
 *   contact:  { email, telephone, telephoneDisplay, callNumber, callNumberDisplay, whatsappNumber },
 *   stats:    { spacesDelivered, cities, states },
 *   business: { address: { streetAddress, addressLocality, addressRegion, postalCode, addressCountry },
 *               shortAddress, mapsUrl, mapsEmbedUrl, geo: { latitude, longitude },
 *               areaServed[], priceRange, sameAs[], openingHours: { days[], opens, closes } }
 * }
 * `cache()`: the layout, footer, floating buttons and page all ask; Sanity is queried once.
 */
export const getSiteSettings = cache(async () => {
    const s = required(await sanityFetch(SITE_SETTINGS), "Site settings");
    for (const [field, label] of [
        ["email", "Email"], ["phone", "Contact number"], ["callPhone", "Call button number"],
        ["whatsappPhone", "WhatsApp number"], ["spacesDelivered", "Spaces delivered"], ["cities", "Cities"],
        ["states", "States"], ["address", "Studio address"], ["shortAddress", "Short address"],
        ["mapsUrl", "Google Maps link"], ["mapsEmbedUrl", "Google Maps embed address"], ["geo", "Map position"],
        ["openingDays", "Open on"], ["opens", "Opens"], ["closes", "Closes"],
    ]) {
        required(s[field] === "" ? null : s[field], `Site settings → ${label}`);
    }

    return {
        contact: toContact(s),
        stats: {
            spacesDelivered: Number(s.spacesDelivered),
            cities: Number(s.cities),
            states: Number(s.states),
        },
        business: {
            // Key order matters: it is the order of the Organization JSON-LD.
            address: {
                streetAddress: s.address.streetAddress,
                addressLocality: s.address.locality,
                addressRegion: s.address.region,
                postalCode: s.address.postalCode,
                addressCountry: "IN", // the schema is India-only (6-digit PIN)
            },
            shortAddress: s.shortAddress,
            mapsUrl: s.mapsUrl,
            mapsEmbedUrl: s.mapsEmbedUrl,
            geo: { latitude: s.geo.lat, longitude: s.geo.lng },
            areaServed: s.areaServed || [],
            priceRange: s.priceRange || "",
            sameAs: s.socialLinks || [],
            openingHours: { days: s.openingDays, opens: s.opens, closes: s.closes },
        },
    };
});
