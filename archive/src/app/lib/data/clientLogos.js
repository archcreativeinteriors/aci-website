// Client logos, grouped into the rows the company-profile PDF lays them out in.
//
// Each inner array IS one row of the /clients grid, read top to bottom, and the
// row's length IS how many logos sit in it — 2, 3 or 4, matching the PDF page.
// `// ── PDF page N` marks where each source page starts. To re-sequence, move a
// line between rows; to change a row's density, change how many lines are in it.
// A NEW client goes at the BOTTOM: into the last row, or a new row after it.
// Nothing else needs updating.
//
// This is the LOCAL source. /clients reads it only through getClientLogoRows()
// in lib/contentSource.js, which prefers the Sanity `clientLogos` singleton
// (same rows-of-logos model) once a project is connected. The logo count on the
// page is derived from whichever rows it gets — never a second list.
//
// width/height are the real pixel dimensions of the files — regenerate both the
// images and these numbers with `npm run logos:sharpen`.
export const clientLogoRows = [
    // ── PDF page 1
    [
        { src: "/images/new-clients/rosewood.png", name: "Rosewood Projects", width: 458, height: 181 },
        { src: "/images/new-clients/chicking.png", name: "ChicKing", width: 350, height: 203 },
        { src: "/images/new-clients/magic-auto.png", name: "Magic Auto", width: 423, height: 193 },
    ],
    // Alone on its row in the PDF too — `wide` also drops the logo band height,
    // since this one is a ~5:1 banner rather than a squarish mark.
    [{ src: "/images/new-clients/ups.png", name: "UPS", width: 778, height: 146, wide: true }],
    [
        { src: "/images/new-clients/south-gate.png", name: "Southgate Resorts & Hotels", width: 486, height: 186 },
        { src: "/images/new-clients/express.png", name: "Express Industry Council of India", width: 432, height: 182 },
        { src: "/images/new-clients/falcon.png", name: "Falcon Realty Services", width: 444, height: 182 },
    ],
    [
        { src: "/images/new-clients/gojavas.png", name: "GoJavas", width: 470, height: 164 },
        { src: "/images/new-clients/health.png", name: "HealthSquare", width: 349, height: 93 },
        { src: "/images/new-clients/radisson.png", name: "Radisson Estate", width: 279, height: 120 },
    ],

    // ── PDF page 2
    [
        { src: "/images/new-clients/ambuja.png", name: "Ambuja Cement", width: 269, height: 264 },
        { src: "/images/new-clients/flip.png", name: "Flip Bistro & Pizzeria", width: 169, height: 168 },
        { src: "/images/new-clients/chd.png", name: "CHD Developers", width: 293, height: 285 },
        { src: "/images/new-clients/rain.png", name: "Rain Rainbow", width: 362, height: 276 },
    ],
    [
        { src: "/images/new-clients/sweet.png", name: "Sweet Child of Mine", width: 187, height: 102 },
        { src: "/images/new-clients/laxmi-bai.png", name: "Laxmi Bai Institute of Dental Sciences & Hospital", width: 341, height: 166 },
        { src: "/images/new-clients/vision.png", name: "Vision Café", width: 327, height: 193 },
        { src: "/images/new-clients/punjabi.png", name: "Punjabi By Nature", width: 192, height: 128 },
    ],
    [
        { src: "/images/new-clients/esskay.png", name: "Esskay Beauty Resources", width: 498, height: 289 },
        { src: "/images/new-clients/marc.png", name: "Marc Slimming & Beauty Equipment", width: 276, height: 188 },
        { src: "/images/new-clients/la.png", name: "La Fleur", width: 260, height: 188 },
    ],

    // ── PDF page 3
    [
        { src: "/images/new-clients/headonizm.png", name: "Headonizm 40", width: 767, height: 255 },
        { src: "/images/new-clients/amber.png", name: "Amber by Pooja Sethi", width: 354, height: 116 },
    ],
    [
        { src: "/images/new-clients/the-bimini.png", name: "The Bimini Road", width: 540, height: 235 },
        { src: "/images/new-clients/kittn.png", name: "Kittn", width: 360, height: 165 },
        { src: "/images/new-clients/knuckout.png", name: "Knuckout", width: 420, height: 188 },
    ],
    [
        { src: "/images/new-clients/natu.png", name: "Naturals", width: 320, height: 151 },
        { src: "/images/new-clients/riya.png", name: "Riya Vashist", width: 525, height: 245 },
        { src: "/images/new-clients/sandy.png", name: "Sandy's Unisex Hair & Beauty Studio", width: 420, height: 205 },
    ],

    // ── PDF page 4
    [
        { src: "/images/new-clients/simran.png", name: "Simrann's Salon", width: 277, height: 147 },
        { src: "/images/new-clients/cosmo.png", name: "Cosmo Salon", width: 354, height: 69 },
        { src: "/images/new-clients/hairscape.png", name: "Hairscape Salon", width: 215, height: 117 },
    ],
    [
        { src: "/images/new-clients/style.png", name: "Style Studio", width: 431, height: 192 },
        { src: "/images/new-clients/mams.png", name: "Mam's & Babe's", width: 295, height: 133 },
        { src: "/images/new-clients/verma.png", name: "Verma's Unisex Salon", width: 428, height: 178 },
    ],
    [
        { src: "/images/new-clients/verma-acadmy.png", name: "Verma's Salon & Academy", width: 285, height: 161 },
        { src: "/images/new-clients/nails.png", name: "Nails At Dalip", width: 287, height: 140 },
        { src: "/images/new-clients/la-adorable.png", name: "La Adorabelle", width: 778, height: 289 },
    ],

    // ── PDF page 5
    [
        { src: "/images/new-clients/api.png", name: "Api Ruché", width: 457, height: 230 },
        { src: "/images/new-clients/iza.png", name: "Iza Setia Makeovers", width: 778, height: 161 },
        { src: "/images/new-clients/strike.png", name: "Strike A Pose", width: 741, height: 207 },
    ],
    [
        { src: "/images/new-clients/headlines.png", name: "Headlines Make News", width: 778, height: 303 },
        { src: "/images/new-clients/fa.png", name: "Fa Professional", width: 279, height: 147 },
        { src: "/images/new-clients/revitall.png", name: "Revitaal Mantrra", width: 732, height: 232 },
    ],
    [
        { src: "/images/new-clients/geet.png", name: "Geet's Make Up Studio", width: 294, height: 156 },
        { src: "/images/new-clients/magn.png", name: "Magnolia", width: 778, height: 219 },
        { src: "/images/new-clients/fab-u.png", name: "Fab-u Salon", width: 286, height: 158 },
    ],

    // ── PDF page 6
    [
        { src: "/images/new-clients/uma.png", name: "Uma Maurya's", width: 627, height: 346 },
        { src: "/images/new-clients/martina.png", name: "Martina Wu", width: 603, height: 193 },
        { src: "/images/new-clients/gr8.png", name: "GR8 Unisex Saloon", width: 464, height: 220 },
    ],
    [
        { src: "/images/new-clients/beauty.png", name: "Beauty & Beard", width: 778, height: 185 },
        { src: "/images/new-clients/sarman.png", name: "Sarman The Makeover Studio", width: 258, height: 95 },
        { src: "/images/new-clients/ozone.png", name: "Ozone Salon", width: 252, height: 64 },
    ],
    [
        { src: "/images/new-clients/geetanjali.png", name: "Geetanjali Salon", width: 778, height: 229 },
        { src: "/images/new-clients/geetanjali-studio.png", name: "Geetanjali Studio", width: 778, height: 248 },
        { src: "/images/new-clients/wilson.png", name: "Wilson's Scissor Art", width: 279, height: 126 },
    ],

    // ── PDF page 7
    [
        { src: "/images/new-clients/bon.png", name: "Bon Temps Beauty & Hair Studio", width: 205, height: 50 },
        { src: "/images/new-clients/seba.png", name: "Sebastiana", width: 281, height: 114 },
        { src: "/images/new-clients/wild.png", name: "Wildbloom", width: 294, height: 173 },
    ],
    [
        { src: "/images/new-clients/preet.png", name: "Preet Wellness & Makeover", width: 275, height: 164 },
        { src: "/images/new-clients/hakim.png", name: "Hakim's Aalim Hair n' Beauty Lounge", width: 778, height: 308 },
        // The GOLD "Nail Cafe by Encanto" mark. The blue Encanto is a different
        // logo — it is `encanto-second` on page 8. Don't let them converge.
        { src: "/images/new-clients/encanto.png", name: "Nail Cafe by Encanto", width: 219, height: 136 },
    ],
    [
        { src: "/images/new-clients/vandna.png", name: "Vandna's Salon", width: 286, height: 190 },
        { src: "/images/new-clients/tweak.png", name: "Tweak Salon", width: 488, height: 221 },
        { src: "/images/new-clients/hob.png", name: "HOB House O Beautyy", width: 674, height: 237 },
    ],

    // ── PDF page 8
    [
        { src: "/images/new-clients/ivory.png", name: "Ivory Room Salon and Spa", width: 771, height: 358 },
        { src: "/images/new-clients/encanto-second.png", name: "Encanto Unisex Salon & Nail Cafe", width: 582, height: 344 },
        { src: "/images/new-clients/extension.png", name: "Extension Port Salon", width: 252, height: 87 },
    ],
    [
        { src: "/images/new-clients/studio.png", name: "Studio ESS", width: 778, height: 189 },
        { src: "/images/new-clients/northwood.png", name: "Northwoodd Salon", width: 778, height: 300 },
        { src: "/images/new-clients/trendz.png", name: "Trendz Salon", width: 776, height: 317 },
    ],
    [
        { src: "/images/new-clients/he-she.png", name: "He & She Unisex Salon", width: 436, height: 175 },
        { src: "/images/new-clients/lakme.png", name: "Lakmé Salon", width: 621, height: 189 },
    ],

    // ── PDF page 9
    [
        { src: "/images/new-clients/black-express.png", name: "Black Express Salon", width: 405, height: 94 },
        { src: "/images/new-clients/looks.png", name: "Looks Salon", width: 269, height: 144 },
    ],
    [
        { src: "/images/new-clients/toni.png", name: "Toni & Guy", width: 778, height: 216 },
        // Not on any of the 10 company-profile pages — placed here on the owner's
        // instruction rather than trailing at the end.
        { src: "/images/new-clients/dopulence.png", name: "D'Opulence Salon & Makeup", width: 778, height: 253 },
        { src: "/images/new-clients/eesha.png", name: "Eesha's", width: 374, height: 214 },
    ],

    // ── PDF page 10
    [
        { src: "/images/new-clients/ps.png", name: "PS Salon", width: 379, height: 247 },
        { src: "/images/new-clients/madona.png", name: "Madonna Unisex Salon", width: 267, height: 157 },
    ],
    // The /clients page appends the "You can be here" tile to whichever row is
    // last, so this one renders three-up.
    [
        { src: "/images/new-clients/aloevera.png", name: "Aloevera Unisex Salon", width: 325, height: 324 },
        { src: "/images/new-clients/bellance.png", name: "Bellance Salon", width: 282, height: 128 },
    ],
];

/**
 * Alt text for a logo. Pass the WHOLE entry, not just its `src`.
 *
 * Every entry above carries a `name` read off the rendered artwork, because the
 * filenames are abbreviations that do not survive being turned into prose:
 * `la` is La Fleur, `natu` is Naturals, `health` is HealthSquare, `magn` is
 * Magnolia, `seba` is Sebastiana. The old derivation produced "La logo",
 * "Natu logo", "Health logo" — which is what a screen-reader user heard, and
 * what search engines read, for 82 images.
 *
 * The filename fallback is kept for one reason: a logo added without a `name`
 * should degrade to a poor label, not to no label at all. If you see a clumsy
 * alt on the wall, the fix is to add the missing `name` above, not to improve
 * this fallback.
 */
export function clientLogoAlt(logo) {
    if (logo && typeof logo === "object" && logo.name) return `${logo.name} logo`;

    const src = typeof logo === "string" ? logo : logo?.src || "";
    const derived = src
        .split("/")
        .pop()
        .replace(/\.[^.]+$/, "")
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim();
    return derived ? `${derived} logo` : "Client logo";
}
