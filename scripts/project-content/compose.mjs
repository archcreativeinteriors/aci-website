// Writes the four text fields of a project page — overview, challenge,
// solution, keyFeatures — from that project's OWN data (owner, 2026-10-08).
//
// WHAT IT USES, AND NOTHING ELSE: the project name / page title, brand, format,
// sector, location as written, city and state, how many projects we have done
// for the same brand (never printed as a number), and words in the name such as
// "Unisex" or "Makeover". It never states an area, budget, date, material, room
// count or client requirement — none of those exist in the data — and keeps to
// general, professional interior-design language where the data says nothing.
//
// HOW EACH TEXT STAYS UNIQUE: every field is assembled from several sentence
// slots, and each slot has many differently written variants, chosen by the
// project's setting (mall, market, office complex, street, residential area,
// sector or just a city), its format and its brand history. A seeded random pick
// (seeded by the slug, so a re-run gives the same text) is re-rolled until no
// other project uses the same combination of sentences for that field.
// index.mjs then validates lengths, banned phrases and exact duplicates.

// ── small helpers ────────────────────────────────────────────────────────────

export function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    return h >>> 0;
}

export function rng(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const an = (w) => (/^[aeiou]/i.test(w) ? "an" : "a");
export const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;

// Display spellings for a few misspelt values in the data. The data itself is
// not changed; only the prose spells them correctly.
const SPELLING = {
    Jhamshedpur: "Jamshedpur",
    Uttrakhand: "Uttarakhand",
    Chhatisgarh: "Chhattisgarh",
    Chhasttisgarh: "Chhattisgarh",
    Gurugam: "Gurugram",
    Rajnder: "Rajendra",
    Acedemy: "Academy",
    Tamps: "Temps",
    Mgf: "MGF",
    Dlf: "DLF",
    Huda: "HUDA",
};
// Abbreviations spelt out in prose (Delhi place names), and one brand spelling.
const EXPAND = [
    [/\bCP\b/g, "Connaught Place"],
    [/\bNFC\b/g, "New Friends Colony"],
    [/\bGK[- ]?(\d)\b/g, "Greater Kailash $1"],
    [/\bC\.R\.? Park\b/g, "C.R. Park"],
    [/\bJ&K\b/g, "Jammu and Kashmir"],
    [/\bTony & Guy\b/g, "Toni & Guy"],
];
const spell = (s) => {
    if (!s) return s;
    let out = s.replace(/\b[A-Z][a-z]+\b/g, (w) => SPELLING[w] || w);
    for (const [re, to] of EXPAND) out = out.replace(re, to);
    return out;
};

const NCR = new Set(["Gurgaon", "Gurugram", "New Delhi", "Delhi", "Delhi Cantt", "Noida", "Greater Noida", "Ghaziabad", "Faridabad"]);

// Words at the END of "location as written" that only repeat the city / state.
const PLACE_TAIL = new Set(
    [
        "u.p", "u.p.", "up", "uk", "m.p", "mp", "haryana", "punjab", "rajasthan", "bihar", "jharkhand", "assam",
        "gujarat", "maharashtra", "chhattisgarh", "chhatisgarh", "chhasttisgarh", "uttarakhand", "uttrakhand",
        "uttar", "pradesh", "kashmir", "&", "jammu", "delhi", "new", "india", "gurgaon", "gurugram", "gurugam",
    ]
);

function locality(location, city, state) {
    if (!location) return null;
    const cityWords = new Set(String(city || "").toLowerCase().split(/\s+/));
    const stateWords = new Set(String(state || "").toLowerCase().split(/\s+/));
    const parts = location.replace(/\s+/g, " ").replace(/\s*,\s*/g, " , ").trim().split(" ");
    const isTail = (w) => {
        const k = w.toLowerCase().replace(/[.,]+$/, "");
        return w === "," || cityWords.has(k) || stateWords.has(k) || PLACE_TAIL.has(k) || PLACE_TAIL.has(k + ".");
    };
    while (parts.length && isTail(parts[parts.length - 1])) {
        // "The Mall Of Faridabad": the city is part of the name — stop.
        if (parts.length >= 2 && /^of$/i.test(parts[parts.length - 2])) break;
        parts.pop();
    }
    while (parts.length && isTail(parts[0])) parts.shift(); // "Faridabad Sector 35"
    const out = parts.join(" ").replace(/\s+,/g, ",").replace(/,\s*$/, "").trim();
    return out && !/^,?$/.test(out) ? spell(out) : null;
}

// The kind of place, from the location as written — and the page title, which
// sometimes names a mall the location leaves out ("Geetanjali Studio Vensej Mall").
function setting(loc, title) {
    const l = `${loc || ""} ${title || ""}`.toLowerCase();
    if (/\bmall\b|plaza|citywalk|one29|esplanade|habitat centre|super mart|square\b|boulevard|food mall|dlf place|promenade|central mall/.test(l)) return "mall";
    if (!loc) return "city";
    if (/market|bazar|bazaar|khan market|galleria/.test(l)) return "market";
    if (/cyber|business park|ifc|tower|worldmark|makenews|trinity|conscient|udyog vihar|imt|bestech|sapphire|unitech|complex|max tower|mukut house|genesis/.test(l)) return "business";
    if (/club|golf|belaire|palm drive|palm hills|palm spring|victory valley|gardenia glory|suncity/.test(l)) return "club";
    if (/road|marg|street|drive|high street|crossing|more\b/.test(l)) return "street";
    if (/colony|nagar|vihar|bagh|enclave|garden|town|kunj|palm|valley|hills|glory|park|phase|extn|green|city\s?[12]|vasundhara|indirapuram|dwarka|ashiyana|kankarbagh|karol bagh|gk|hauz khas|saket|c\.r|chhatarpur|vaishali|scheme|naraina|janakpuri|kamla|tilak|lajpat|rajinder|rajnder|ashok|geeta|nfc|cp\b|gandhi/.test(l)) return "neighbourhood";
    if (/sector|sec[- ]?\d/.test(l)) return "sector";
    return "neighbourhood";
}

// ── vocabulary per format ────────────────────────────────────────────────────

const FORMAT_GROUP = {
    Salon: "salon", Studio: "studio", "Nail studio": "nail", Spa: "spa", Academy: "academy",
    Retail: "retail", Restaurant: "restaurant", Estate: "estate",
};

const VOCAB = {
    salon: { space: "salon", spaces: "salons", guests: "clients", floor: "styling floor", services: "hair and beauty services", type: "salon interior" },
    studio: { space: "studio", spaces: "studios", guests: "clients", floor: "service floor", services: "beauty and grooming services", type: "beauty studio interior" },
    nail: { space: "nail studio", spaces: "studios", guests: "clients", floor: "nail bar", services: "nail care", type: "nail studio interior" },
    spa: { space: "salon and spa", spaces: "sites", guests: "guests", floor: "treatment and styling areas", services: "salon and spa treatments", type: "salon and spa interior" },
    academy: { space: "academy", spaces: "sites", guests: "students and trainers", floor: "training floor", services: "professional beauty training", type: "training academy interior" },
    retail: { space: "store", spaces: "stores", guests: "customers", floor: "shop floor", services: "retail", type: "retail interior" },
    restaurant: { space: "restaurant", spaces: "restaurants", guests: "diners", floor: "dining room", services: "dining", type: "restaurant interior" },
    estate: { space: "home", spaces: "homes", guests: "residents", floor: "living areas", services: "everyday living", type: "residential interior" },
    clinic: { space: "centre", spaces: "centres", guests: "clients", floor: "client areas", services: "wellness and slimming services", type: "commercial interior" },
};

// ── context ─────────────────────────────────────────────────────────────────

export function context(p, brandCount) {
    const nameText = `${p.name} ${p.brand || ""}`;
    const traits = {
        unisex: /unisex/i.test(nameText),
        makeup: /makeup|make-up|makeover/i.test(nameText),
        wellness: /wellness|slimming/i.test(nameText),
        grooming: /beard|grooming/i.test(nameText),
    };
    let group = FORMAT_GROUP[p.subCategory] || (p.sector === "Commercial" ? "retail" : p.sector === "Residential" ? "estate" : "salon");
    // A "Retail" record whose name says slimming / wellness (Marc Zenat Slimming
    // Systems) is a client centre, not a shop: product-shelf copy would be wrong.
    if (group === "retail" && traits.wellness) group = "clinic";
    const v = { ...VOCAB[group] };
    if (group === "studio" && traits.makeup) v.type = "makeup studio interior";
    if (group === "studio" && traits.makeup) v.services = "makeup, styling and grooming services";
    if (group === "salon" && traits.unisex) v.services = "hair and beauty services for men and women";

    const city = spell(p.city) || "";
    const state = spell(p.state) || "";
    const loc = locality(p.location, p.city, p.state);
    const sameName = city && state && (city.includes(state) || state.includes(city));
    // "The Mall Of Faridabad" already names its city.
    const locNamesCity = loc && city && loc.toLowerCase().includes(city.toLowerCase());
    const place = loc ? (locNamesCity ? loc : `${loc}, ${city}`) : sameName || !state ? city : `${city}, ${state}`;
    const brand = p.brand || p.name;
    const tier = brandCount >= 6 ? "chain" : brandCount >= 2 ? "repeat" : "single";
    return {
        slug: p.slug,
        T: spell(p.pageTitle || p.name).replace(/,(?=\S)/g, ", "),
        brand,
        group,
        v,
        traits,
        city,
        state,
        loc,
        place,
        at: loc ? `at ${place}` : `in ${place}`,
        At: loc ? `At ${place}` : `In ${place}`,
        // A residence has no shopfront and no brand outlets: its own wording.
        setting: group === "estate" ? "home" : setting(loc, p.pageTitle || p.name),
        away: !NCR.has(p.city),
        tier: group === "estate" ? "home" : tier,
    };
}

// ── OVERVIEW ────────────────────────────────────────────────────────────────

const O_INTRO = [
    (c) => `${c.T} is ${an(c.v.type)} ${c.v.type} we designed and delivered ${c.at}, planned around the daily routine of the ${c.v.guests} who use it.`,
    (c) => `${c.At}, ${c.T} gave our studio the chance to shape ${an(c.v.space)} ${c.v.space} from the first sketch through to handover.`,
    (c) => `This ${c.v.type} for ${c.brand} is located ${c.at}, and was taken on as a complete design-and-build commission.`,
    (c) => `${c.T} brings ${c.brand}'s ${c.v.services} to ${c.place}, in a space we planned, detailed and fitted out end to end.`,
    (c) => `Our work for ${c.brand} ${c.at} covered the whole interior of the ${c.v.space}, from layout and lighting to finishes and furniture.`,
    (c) => `Set ${c.at}, this ${c.v.space} for ${c.brand} is a turnkey ${c.v.type}, carried by our team from concept drawings to a working space.`,
    (c) => `${c.T} ${c.at} is ${an(c.v.type)} ${c.v.type} shaped around ${c.v.services}, with each area considered for ${c.v.guests} and the team alike.`,
    (c) => `For ${c.brand}, we created ${an(c.v.space)} ${c.v.space} ${c.at} that gives ${c.v.services} a calm and well-organised setting.`,
    (c) => `${c.T} is the ${c.v.space} we fitted out for ${c.brand} ${c.at}, ${an(c.v.type)} ${c.v.type} in which planning and finish were developed together.`,
    (c) => `${c.At}, the brief was for ${an(c.v.space)} ${c.v.space} that works hard every day and still feels considered; ${c.T} is the outcome of that brief.`,
    (c) => `Designed for ${c.brand} and located ${c.at}, ${c.T} is ${an(c.v.type)} ${c.v.type} where function and atmosphere carry equal weight.`,
];

const O_INTRO_HOME = [
    (c) => `${c.T} is a residential interior we designed and delivered ${c.at}, planned around the rhythms of everyday family life.`,
    (c) => `For this home ${c.at}, our studio took the interiors from the first layout drawings through to a finished, lived-in space.`,
    (c) => `${c.At}, ${c.T} called for interiors that feel calm, personal and easy to live in, developed by our team from concept to handover.`,
];

const O_BRAND = {
    chain: [
        (c) => `It continues our long association with ${c.brand}, whose ${c.v.spaces} share a recognisable design language that each site adapts to its own footprint.`,
        (c) => `Having delivered many ${c.brand} locations, we knew the brand's standards well; the work here lay in fitting them to this particular space.`,
        (c) => `Clients who know ${c.brand} from other cities should feel at home here, even though the plan was worked out afresh for this address.`,
        (c) => `As with every ${c.brand} project, the aim was a space that reads clearly as the brand while responding to its own setting.`,
        (c) => `The site builds on a design approach refined across many ${c.brand} ${c.v.spaces}, keeping what works and adjusting what the location asks for.`,
        (c) => `The ${c.brand} identity carries through, but the proportions, circulation and detailing were resolved for this location alone.`,
        (c) => `Our familiarity with ${c.brand} allowed the brand's character to be carried over quickly, leaving time to refine the details specific to this site.`,
    ],
    repeat: [
        (c) => `We have worked with ${c.brand} at more than one location, so continuity between the outlets mattered as much as the layout itself.`,
        (c) => `Because we had delivered other ${c.brand} outlets, the design could build on an established look while answering to a new site.`,
        (c) => `Returning to ${c.brand} for this outlet let us carry forward details that had worked before and refine the rest.`,
        (c) => `${c.brand} came back to our studio for this location, and the design keeps the brand consistent while giving the outlet a character of its own.`,
        (c) => `Continuity with ${c.brand}'s other outlets guided the palette and detailing, while the plan responds to this site alone.`,
    ],
    // A residence (format "Estate"): no brand language at all.
    home: [
        (c) => `The interiors were shaped around the way the household lives, rather than a show-flat template.`,
        (c) => `Each room was considered for the people who use it every day, from morning routines to evenings with guests.`,
        (c) => `The aim was a home that feels personal and settled, with every space given a clear purpose.`,
    ],
    single: [
        (c) => `For ${c.brand}, we began with the brand's own personality rather than a template, so the interior feels specific to them.`,
        (c) => `The design gives ${c.brand} a distinct presence, with a look that stays consistent from the entrance to the last ${c.group === "restaurant" ? "table" : "service area"}.`,
        (c) => `The intent was a space with a clear character of its own, one that ${c.v.guests} remember after a first visit.`,
        (c) => `Every decision, from the entrance to the smallest fitting, was made to give ${c.brand} a coherent and recognisable setting.`,
        (c) => `Rather than following a standard format, the design develops a setting that belongs to ${c.brand} alone.`,
    ],
};

const O_SETTING = {
    mall: [
        (c) => `Inside a shopping mall the frontage has to work hard: it is the first impression for passing shoppers and sets the tone before anyone steps in.`,
        (c) => `The mall location shaped the approach, from a shopfront that reads clearly along the corridor to a plan that makes full use of the unit.`,
        (c) => `A mall brings steady passing footfall, so the entrance and the first view inside were designed to draw people in.`,
        (c) => `As a mall unit, the ${c.v.space} had to follow the centre's fit-out guidelines while still standing apart from its neighbours.`,
        (c) => `In a mall setting, visibility and a confident shopfront matter, and both were considered from the very start.`,
    ],
    market: [
        (c) => `In a busy market, a welcoming shopfront and a clear view inside help the ${c.v.space} stand out from its neighbours.`,
        (c) => `The market location calls for a frontage that is easy to read from the street and an interior that feels calm once inside.`,
        (c) => `Surrounded by other shops and services, the ${c.v.space} needed a confident face to the street and a well-ordered interior behind it.`,
        (c) => `Market settings reward an inviting entrance, and the design makes the first step inside feel easy and natural.`,
    ],
    business: [
        (c) => `Its address within a commercial development called for a polished, professional character in keeping with the businesses around it.`,
        (c) => `Located in a business and commercial complex, the ${c.v.space} needed to feel refined and efficient, suited to its setting.`,
        (c) => `The commercial setting led to a crisp, composed interior that sits comfortably alongside the offices and businesses nearby.`,
        (c) => `In a commercial complex first impressions form quickly, so the entrance and reception were given particular attention.`,
    ],
    street: [
        (c) => `With frontage onto the road, visibility from the street was an important consideration from the outset.`,
        (c) => `Its street-facing position meant the entrance had to read clearly to passers-by and feel open and approachable.`,
        (c) => `A roadside location shaped the entrance, which was planned to be inviting and easy to find.`,
    ],
    club: [
        (c) => `Its setting within a residential development called for an interior that feels relaxed, familiar and welcoming to regular visitors.`,
        (c) => `Set within a residential community, the ${c.v.space} was planned as a comfortable, easy-going place for repeat visits.`,
    ],
    neighbourhood: [
        (c) => `Set in an established neighbourhood, the ${c.v.space} is designed to welcome regular local ${c.v.guests} as warmly as first-time visitors.`,
        (c) => `The neighbourhood location suggested a warm, approachable interior that is comfortable for repeat visits.`,
        (c) => `Serving a lived-in part of the city, the design favours comfort and familiarity alongside a polished finish.`,
        (c) => `In a neighbourhood setting, the ${c.v.space} needed to feel approachable and dependable, a place ${c.v.guests} return to.`,
    ],
    sector: [
        (c) => `Located in a planned urban sector, the ${c.v.space} serves the surrounding area, so comfort and ease of use were priorities.`,
        (c) => `Its sector location called for an interior that is welcoming, practical and easy to find one's way around.`,
        (c) => `As a sector-based ${c.v.space}, it was planned for everyday convenience, with a clear layout and a comfortable atmosphere.`,
    ],
    home: [
        (c) => `Light, proportion and storage were weighed together, so the rooms stay calm and uncluttered in daily use.`,
        (c) => `The design keeps a quiet, consistent palette from room to room, letting furniture and daily life take the foreground.`,
    ],
    city: [
        (c) => `In ${c.city}, the ${c.v.space} was planned to give ${c.v.guests} a polished, comfortable setting for ${c.v.services}.`,
        (c) => `The ${c.city} location led to a design that feels contemporary yet approachable for local ${c.v.guests}.`,
        (c) => `For ${c.city}${c.state && c.state !== c.city ? `, ${c.state}` : ""}, the aim was an interior that brings a considered, contemporary feel to ${c.v.services}.`,
        (c) => `Bringing the project to ${c.city} meant working to the same standards as our studio's other work, with a design suited to its own context.`,
    ],
};

const O_CHARACTER = {
    salon: [
        (c) => `The interior pairs clean lines with warm, layered lighting, giving the styling floor an open and unhurried feel.`,
        (c) => `Materials were chosen for appearance and durability alike, so the salon keeps its finish through long working days.`,
        (c) => `Calm colours, carefully placed mirrors and soft lighting give the salon a composed, contemporary character.`,
        (c) => `Throughout, the design balances visual appeal with the practical needs of a working salon, from storage to everyday cleaning.`,
        (c) => `The result is a salon that feels refined without being formal, with a clear sequence from arrival to service.`,
        (c) => `Clear zoning gives each service its own setting, while the salon still reads as one coherent space.`,
    ],
    studio: [
        (c) => `Soft, even lighting and a restrained palette let the studio's styling and makeup work take centre stage.`,
        (c) => `The studio is designed to feel personal and calm, with each service area given a sense of its own.`,
        (c) => `Careful detailing and a light, contemporary palette give the studio a polished but welcoming character.`,
        (c) => `Every station was considered for good light and comfortable working positions, which beauty services depend on.`,
        (c) => `The overall feel is intimate and well finished, suited to the one-to-one nature of studio services.`,
    ],
    nail: [
        (c) => `Focused task lighting and a fresh, light palette suit the detailed work of nail care.`,
        (c) => `The studio balances neat, practical workstations with a relaxed atmosphere that clients enjoy lingering in.`,
        (c) => `Clean surfaces and an orderly layout give the space a crisp character that suits close, careful work.`,
        (c) => `Comfortable seating and good light at every station were treated as the foundation of the design.`,
    ],
    spa: [
        (c) => `Softer lighting and tactile finishes mark the move from the busier salon areas to the quieter treatment spaces.`,
        (c) => `The design gives the spa side a calm, restful mood while keeping the salon areas bright and practical.`,
        (c) => `Privacy, quiet and a gentle palette shape the treatment areas, in balance with an efficient salon floor.`,
        (c) => `A considered sequence of spaces lets guests move from styling to treatments without losing the sense of calm.`,
    ],
    academy: [
        (c) => `An uncluttered, practical interior suits a space used intensively for teaching and practice.`,
        (c) => `The interior keeps a professional, focused character, giving students a setting that mirrors a working salon.`,
        (c) => `Flexible areas let the academy move between demonstration, practice and theory without major rearrangement.`,
    ],
    retail: [
        (c) => `A clean, uncluttered backdrop lets the products lead, with lighting that shows them clearly.`,
        (c) => `The store is arranged for easy browsing, with a clear route from the entrance to the counter.`,
        (c) => `Durable finishes and orderly display give the store a professional, dependable character.`,
        (c) => `The interior balances generous display with comfortable space to move, so the store never feels crowded.`,
    ],
    restaurant: [
        (c) => `Warm lighting and a mix of seating give the dining room a relaxed, sociable atmosphere.`,
        (c) => `The interior balances character and comfort, with finishes chosen to stand up to daily service.`,
        (c) => `Distinct dining zones give the restaurant variety while keeping a single, coherent identity.`,
    ],
    estate: [
        (c) => `Warm materials and a calm palette give the home a settled, liveable character.`,
        (c) => `The interiors favour comfort and good storage, so the spaces stay easy to live in day to day.`,
        (c) => `Rooms were planned to flow naturally into one another while each keeps its own purpose.`,
    ],
    clinic: [
        (c) => `A calm, orderly interior and a discreet sequence of spaces suit a centre where clients come for personal services.`,
        (c) => `Clean lines and a restrained palette give the centre a professional, reassuring character.`,
        (c) => `The design keeps the reception open and welcoming while the client areas beyond feel private and composed.`,
    ],
};

// ── CHALLENGE ───────────────────────────────────────────────────────────────

const C_SETTING = {
    mall: [
        (c) => `Working inside a mall meant meeting the centre's fit-out rules and approvals while making the most of a fixed unit.`,
        (c) => `The mall setting required a shopfront that competes for attention along the corridor without breaking the centre's design guidelines.`,
        (c) => `Fit-out work in a mall runs to the centre's schedules and rules, which shaped both the design and the order of work on site.`,
    ],
    market: [
        (c) => `In a market setting, the challenge was to make the ${c.v.space} stand out among neighbouring shopfronts while keeping the interior calm.`,
        (c) => `Street-facing units in busy markets need to draw people in quickly, and the frontage and first view inside had to do that work.`,
        (c) => `The market location meant designing for walk-in visitors as well as regular ${c.v.guests}, with an entrance that is easy to read.`,
    ],
    business: [
        (c) => `A commercial address sets high expectations, so the ${c.v.space} had to feel polished and professional from the first step inside.`,
        (c) => `Within a commercial complex, the design had to sit comfortably with its surroundings while still giving ${c.brand} a distinct presence.`,
        (c) => `The setting demanded a crisp, efficient interior that matches the professional character of the complex around it.`,
    ],
    street: [
        (c) => `A street-facing site needed an entrance that is visible and inviting from the road, without exposing the interior too openly.`,
        (c) => `On a roadside frontage, the challenge was to attract attention from the street while creating a calm, private feel inside.`,
    ],
    club: [
        (c) => `In a residential setting, the ${c.v.space} needed to feel at ease with its surroundings while still offering a polished experience.`,
        (c) => `Serving a residential community meant designing for regular, repeat visits, where comfort and familiarity count.`,
    ],
    neighbourhood: [
        (c) => `A neighbourhood ${c.v.space} relies on regular ${c.v.guests}, so the design had to feel welcoming and comfortable visit after visit.`,
        (c) => `The challenge was to give a local ${c.v.space} a polished finish without losing the approachable, familiar feel its setting calls for.`,
        (c) => `Designing for an established neighbourhood meant balancing a contemporary look with warmth and ease of use.`,
    ],
    sector: [
        (c) => `In a planned sector, the ${c.v.space} had to be easy to find and easy to use, serving the community around it.`,
        (c) => `The challenge was to create a welcoming local destination that feels considered rather than generic.`,
        (c) => `A sector location called for an interior practical enough for everyday visits yet distinctive enough to be remembered.`,
    ],
    home: [
        (c) => `Making the home work for everyday living while still feeling calm and considered was the starting point.`,
        (c) => `The challenge was to give each room a clear role without the home feeling divided or formal.`,
    ],
    city: [
        (c) => `The brief called for an interior in ${c.city} that feels contemporary and well resolved, with a clear and comfortable layout.`,
        (c) => `Creating a setting in ${c.city} that feels both polished and approachable was the starting point of the design.`,
        (c) => `In ${c.city}, the challenge was to deliver a refined interior that local ${c.v.guests} find welcoming from the first visit.`,
    ],
};

const C_FORMAT = {
    salon: [
        (c) => `Inside, the salon had to fit styling stations, washing and waiting areas without the floor feeling crowded.`,
        (c) => `Balancing the number of styling positions with comfortable circulation for clients and staff was the central planning task.`,
        (c) => `Hair, colour and beauty services each have their own needs, and the layout had to keep them distinct yet connected.`,
        (c) => `Plumbing, power and lighting for every station had to be coordinated early so that the finished floor stays clean and uncluttered.`,
        (c) => `The plan needed to keep busy service areas efficient for the team while giving clients a sense of space and privacy.`,
    ],
    studio: [
        (c) => `Makeup and styling work depends on consistent, flattering light, and achieving it at every station shaped much of the design.`,
        (c) => `The studio had to offer several services within one space while keeping each experience personal and unhurried.`,
        (c) => `Fitting stations, storage and client seating together without crowding the studio was the main planning task.`,
        (c) => `The layout needed to support close, one-to-one work while keeping circulation easy for clients and staff.`,
    ],
    nail: [
        (c) => `Nail work needs focused light, comfortable seating and good ventilation, all within a compact, efficient layout.`,
        (c) => `Arranging manicure and pedicure positions so that clients feel comfortable and staff can work efficiently was the core task.`,
        (c) => `The studio had to stay neat and easy to clean while still feeling relaxed and inviting.`,
    ],
    spa: [
        (c) => `Combining a working salon with quieter spa treatments meant separating noise and activity without dividing the space awkwardly.`,
        (c) => `Treatment areas needed privacy and calm, while the salon floor had to remain open and efficient.`,
        (c) => `The plan had to guide guests between busy and restful areas smoothly, with privacy where it matters.`,
    ],
    academy: [
        (c) => `A teaching space has to support demonstrations, hands-on practice and theory, often within the same day.`,
        (c) => `The academy needed durable, flexible spaces that can handle many students while staying organised.`,
        (c) => `Students need room to practise and clear sightlines to the trainer, which had to be balanced within the available space.`,
    ],
    retail: [
        (c) => `Displaying a wide range of products clearly, while keeping enough room to browse comfortably, was the main planning task.`,
        (c) => `The store needed generous display and practical stock storage without the shop floor feeling cluttered.`,
        (c) => `Customers should find what they need quickly, so the layout had to make the range easy to understand at a glance.`,
    ],
    restaurant: [
        (c) => `A restaurant has to serve diners comfortably and staff efficiently at the same time, which shaped every part of the plan.`,
        (c) => `Balancing seating capacity with comfortable spacing and smooth service routes was the central challenge.`,
    ],
    estate: [
        (c) => `A home has to suit daily routines as well as occasional gatherings, which called for flexible, well-organised spaces.`,
        (c) => `Storage, comfort and durable finishes had to be balanced with a calm, uncluttered look.`,
    ],
    clinic: [
        (c) => `Clients visiting for personal services expect privacy, so the plan had to separate the public reception from the quieter client areas.`,
        (c) => `The centre needed to feel welcoming at the front and discreet beyond it, without the layout becoming confusing.`,
        (c) => `Balancing an open, reassuring reception with private client spaces was the central planning task.`,
    ],
};

const C_CONTEXT = {
    chain: [
        (c) => `Carrying ${c.brand}'s established identity into a new site, without simply repeating a previous one, added another layer to the brief.`,
        (c) => `The design also had to stay true to ${c.brand}'s familiar look while adapting to this site's particular footprint.`,
        (c) => `Keeping the brand experience consistent with other ${c.brand} locations, while respecting what this site offers, needed careful judgement.`,
    ],
    repeat: [
        (c) => `Keeping continuity with ${c.brand}'s other outlets while responding to a new site required a careful balance.`,
        (c) => `The outlet had to feel unmistakably ${c.brand}, yet fit its own location naturally.`,
    ],
    home: [
        (c) => `Storage needed to be generous yet discreet, so that the rooms keep their calm, open feel.`,
        (c) => `Finishes had to be durable enough for family life while keeping a warm, refined look.`,
    ],
    single: [
        (c) => `The design also had to establish a clear, memorable identity for ${c.brand} within this space.`,
        (c) => `Giving ${c.brand} a distinctive character that ${c.v.guests} recognise and remember was an equally important goal.`,
    ],
    away: [
        (c) => `Delivering the project in ${c.city}, at a distance from our Gurugram studio, called for careful planning and coordination on site.`,
        (c) => `Working in ${c.state || c.city} meant the drawings, materials and site work had to be well coordinated from the start.`,
        (c) => `As the site is outside the NCR, the project relied on thorough documentation and close coordination with the team on the ground.`,
    ],
};

// ── SOLUTION ────────────────────────────────────────────────────────────────

const S_PLAN = {
    salon: [
        (c) => `We zoned the salon so that reception, styling, washing and waiting each have a clear place, linked by simple circulation.`,
        (c) => `Styling stations were arranged for clear sightlines and comfortable spacing, with the wash area placed for a smooth client route.`,
        (c) => `A clear sequence from reception to styling and washing keeps the floor orderly, even at the busiest times.`,
        (c) => `Service areas were grouped by function, keeping wet and dry work apart and giving staff efficient routes behind the scenes.`,
        (c) => `The layout gives each styling position room to work, while built-in storage keeps surfaces clear.`,
    ],
    studio: [
        (c) => `We arranged the studio so that each station has good light and space to work, with client seating kept comfortable and private.`,
        (c) => `Services were grouped into clear zones, giving every client a calm, personal experience within one open space.`,
        (c) => `Built-in storage at each station keeps products to hand and surfaces clear, so the studio stays orderly.`,
        (c) => `A simple route from reception to the service areas keeps movement easy for clients and staff alike.`,
    ],
    nail: [
        (c) => `Manicure and pedicure positions were laid out for comfort and efficient work, with clear space for clients to move between them.`,
        (c) => `We kept the layout compact and orderly, with storage close to every station and an easy route for clients.`,
        (c) => `Seating, lighting and storage were planned together so that each station works well on its own.`,
    ],
    spa: [
        (c) => `We separated the quieter treatment spaces from the active salon floor, with a gentle transition between the two.`,
        (c) => `Treatment rooms were placed away from the busiest areas, giving them privacy while the salon stays open and efficient.`,
        (c) => `A clear route leads guests from reception through the salon to the treatment areas without disturbing either.`,
    ],
    academy: [
        (c) => `We planned flexible training areas that move easily between demonstration and practice, with clear sightlines to the trainer.`,
        (c) => `Practice stations were arranged so that students have room to work while trainers can move among them easily.`,
        (c) => `Storage for kits and equipment was built in, keeping the training spaces organised and ready for each session.`,
    ],
    retail: [
        (c) => `We organised the store around a clear route, with display arranged so that the range is easy to understand.`,
        (c) => `Display and stock storage were planned together, keeping the shop floor generous and uncluttered.`,
        (c) => `The counter was positioned for easy service, with display leading customers naturally through the store.`,
    ],
    restaurant: [
        (c) => `We defined distinct dining zones with a mix of seating, linked by service routes that keep staff moving efficiently.`,
        (c) => `Seating, lighting and circulation were planned together so the restaurant feels comfortable at any level of occupancy.`,
    ],
    estate: [
        (c) => `We planned the rooms around daily routines, with generous built-in storage and a natural flow between spaces.`,
        (c) => `Living, dining and private areas were arranged to work together while each keeps its own character.`,
    ],
    clinic: [
        (c) => `We placed the reception at the front and the client areas behind it, so privacy increases as clients move through the centre.`,
        (c) => `A clear route from reception to the client rooms keeps the centre easy to navigate and calm to move through.`,
        (c) => `The public and private parts of the centre were clearly separated, with simple circulation linking them.`,
    ],
};

const S_SETTING = {
    mall: [
        (c) => `At the front, a clean, confident shopfront and a well-lit entrance give the ${c.v.space} presence within the mall.`,
        (c) => `The shopfront was detailed to suit the mall's guidelines while giving ${c.brand} a clear identity along the corridor.`,
        (c) => `We planned the work around the mall's requirements, keeping the frontage bold and the interior uncluttered.`,
    ],
    market: [
        (c) => `The frontage was kept open and inviting, offering a clear view of the ${c.v.space} from the street.`,
        (c) => `A clear, welcoming entrance helps the ${c.v.space} stand out in the market and makes walking in feel natural.`,
    ],
    business: [
        (c) => `A refined palette and precise detailing give the ${c.v.space} the professional finish its commercial setting calls for.`,
        (c) => `The entrance and reception were given a crisp, composed treatment in keeping with the surrounding businesses.`,
    ],
    street: [
        (c) => `The entrance was made clear and inviting from the road, while the interior behind it stays calm and private.`,
        (c) => `A well-defined frontage gives the ${c.v.space} presence on the street without exposing the interior.`,
    ],
    club: [
        (c) => `A relaxed, familiar atmosphere suits the residential setting and makes the ${c.v.space} easy to return to.`,
    ],
    neighbourhood: [
        (c) => `Warm finishes and a welcoming entrance give the ${c.v.space} the approachable feel its neighbourhood setting suits.`,
        (c) => `The design keeps the ${c.v.space} polished yet friendly, so regular ${c.v.guests} feel comfortable on every visit.`,
    ],
    sector: [
        (c) => `A clear entrance and an easy layout make the ${c.v.space} simple to use, suited to everyday visits.`,
        (c) => `The interior was kept welcoming and practical, giving the local area a dependable, well-finished ${c.v.space}.`,
    ],
    home: [
        (c) => `A restrained palette carried through every room gives the home a sense of continuity and calm.`,
        (c) => `Built-in joinery keeps everyday items out of sight, so the rooms stay open and easy to live in.`,
    ],
    city: [
        (c) => `The design gives the ${c.v.space} a polished, contemporary presence in ${c.city}, while staying comfortable and easy to use.`,
        (c) => `A considered palette and clear layout give ${c.v.guests} in ${c.city} a setting that feels both refined and welcoming.`,
    ],
};

const S_FINISH = {
    salon: [
        (c) => `Layered lighting, even at the mirrors and softer elsewhere, supports accurate colour work and a relaxed mood.`,
        (c) => `Durable, easy-to-clean surfaces were chosen for the work areas, with warmer finishes in reception and waiting.`,
        (c) => `Mirrors, lighting and joinery were designed together, so each station is practical to work at and pleasant to sit in.`,
        (c) => `Finishes were selected to withstand daily wear while keeping a warm, polished look.`,
    ],
    studio: [
        (c) => `Even, flattering light at every station supports detailed beauty and makeup work.`,
        (c) => `A light, calm palette and durable surfaces keep the studio fresh and easy to maintain.`,
        (c) => `Lighting, mirrors and storage were designed as one, giving each station a clean and practical finish.`,
    ],
    nail: [
        (c) => `Easy-to-clean surfaces keep the studio practical, while softer ambient light elsewhere keeps it relaxed.`,
        (c) => `A fresh palette and durable finishes keep the studio crisp and easy to maintain.`,
    ],
    spa: [
        (c) => `Softer lighting and natural, tactile finishes in the treatment areas contrast with brighter, practical light on the salon floor.`,
        (c) => `Materials were chosen for calm and comfort in the spa spaces, and for durability where the salon works hardest.`,
    ],
    academy: [
        (c) => `Bright, even lighting and hard-wearing surfaces suit the intensive daily use of a training space.`,
        (c) => `Durable finishes and organised storage keep the academy practical and ready for every session.`,
    ],
    retail: [
        (c) => `Display lighting shows the products clearly, while durable finishes keep the store looking fresh.`,
        (c) => `A clean, neutral backdrop and practical finishes let the range stand out.`,
    ],
    restaurant: [
        (c) => `Warm lighting and finishes chosen for daily service give the restaurant a welcoming, lasting quality.`,
        (c) => `Lighting was layered to suit the mood of the dining room, with durable surfaces where service is busiest.`,
    ],
    estate: [
        (c) => `Warm materials and soft lighting give the home a calm, settled feel that suits everyday living.`,
        (c) => `Durable, comfortable finishes were chosen to age well with daily use.`,
    ],
    clinic: [
        (c) => `A soft, even light and a calm, neutral palette keep the client areas restful and the centre easy to maintain.`,
        (c) => `Durable, easy-to-clean surfaces were paired with warmer finishes in reception to keep the centre welcoming.`,
    ],
};

const S_DELIVERY = {
    home: [
        (c) => `Our team managed the work from drawings and site coordination through to the final handover of the home.`,
        (c) => `Delivered as a turnkey project, the home was handed over complete and ready to move into.`,
    ],
    near: [
        (c) => `As a turnkey project, our team managed design, site work and handover, giving ${c.brand} a single point of contact.`,
        (c) => `We handled the project end to end, from drawings and site work to the final handover.`,
        (c) => `From concept to handover, the work was delivered as one turnkey package by our team.`,
        (c) => `Our team carried the project from the first drawings through to a finished, ready-to-use space.`,
    ],
    away: [
        (c) => `Coordinated from our Gurugram studio with a site team in ${c.city}, the project was delivered end to end, from drawings to handover.`,
        (c) => `Although outside the NCR, the project followed our usual turnkey process, with design, execution and handover managed by one team.`,
        (c) => `Our team in ${c.state || c.city} worked to the same drawings and standards as our NCR projects, through to handover.`,
    ],
};

// ── KEY FEATURES ────────────────────────────────────────────────────────────

const F_FORMAT = {
    salon: [
        "Clear Arrival and Reception", "Well-Spaced Styling Stations", "Even, Shadow-Free Mirror Lighting", "Dedicated Hair Wash Area",
        "Comfortable Client Waiting Zone", "Built-In Storage at Each Station", "Durable, Easy-Clean Work Surfaces", "Separate Wet and Dry Zones",
        "Concealed Services and Cabling", "Efficient Staff Circulation", "Warm, Layered Ambient Lighting", "Coordinated Mirrors and Joinery",
    ],
    studio: [
        "Well-Lit Styling Stations", "Even, Flattering Task Lighting", "Comfortable Client Seating", "Clean, Light Material Palette",
        "Integrated Product Storage", "Clear Service Zoning", "Easy-Clean Work Surfaces", "Unhurried Client Journey", "Welcoming Reception Point",
    ],
    nail: [
        "Comfortable Manicure Stations", "Focused Task Lighting", "Relaxed Pedicure Seating", "Orderly Product Display",
        "Easy-Clean Surfaces", "Ventilation-Aware Layout", "Storage Within Reach", "Calm Waiting Area",
    ],
    spa: [
        "Calm Treatment Areas", "Soft Ambient Lighting", "Privacy Between Zones", "Gentle Salon-to-Spa Transition",
        "Efficient Salon Floor", "Natural, Tactile Finishes", "Relaxing Waiting Area",
    ],
    academy: [
        "Flexible Training Spaces", "Student Practice Stations", "Clear Demonstration Area", "Bright, Even Task Lighting",
        "Hard-Wearing Finishes", "Organised Kit Storage", "Easy Student Circulation",
    ],
    retail: [
        "Clear Product Display", "Easy-to-Browse Layout", "Well-Placed Service Counter", "Back-of-House Stock Storage",
        "Bright Display Lighting", "Durable Retail Finishes", "Inviting Storefront",
    ],
    restaurant: [
        "Varied Dining Zones", "Comfortable Seating Mix", "Warm Ambient Lighting", "Efficient Service Routes",
        "Durable Hospitality Finishes", "Welcoming Entrance",
    ],
    estate: [
        "Calm, Liveable Interiors", "Generous Built-In Storage", "Durable Everyday Finishes", "Natural Room Flow",
        "Warm Material Palette", "Comfortable Family Spaces",
    ],
    clinic: [
        "Welcoming Reception", "Private Client Areas", "Clear Public-to-Private Sequence", "Calm, Neutral Palette",
        "Soft, Even Lighting", "Easy-Clean Surfaces", "Simple, Intuitive Circulation",
    ],
};

const F_SETTING = {
    mall: ["Mall-Compliant Shopfront", "High-Visibility Entrance", "Corridor-Facing Brand Presence"],
    market: ["Inviting Street Frontage", "Clear View From the Street", "Walk-In Friendly Entrance"],
    business: ["Polished Professional Finish", "Composed Entrance and Reception", "Commercial-Grade Detailing"],
    street: ["Street-Facing Entrance", "Roadside Visibility"],
    club: ["Relaxed Residential Atmosphere", "Comfortable Repeat-Visit Setting"],
    neighbourhood: ["Neighbourhood-Friendly Atmosphere", "Comfortable Repeat-Visit Setting", "Approachable Entrance"],
    sector: ["Easy-to-Find Entrance", "Practical Everyday Layout", "Welcoming Local Setting"],
    city: ["Contemporary, Locally Suited Design", "Polished Yet Approachable Interior"],
    home: ["Discreet Built-In Joinery", "Consistent Room-to-Room Palette"],
};

const F_CONTEXT = {
    chain: (c) => [`Consistent ${c.brand} Identity`, "Brand-Aligned Detailing", "Site-Specific Planning"],
    repeat: (c) => [`Continuity Across ${c.brand} Outlets`, "Familiar Brand Details", "Site-Specific Planning"],
    single: (c) => [`Distinct ${c.brand} Character`, "Coherent Brand Setting"],
    home: () => ["Spaces Planned Around Daily Routines", "Turnkey Residential Delivery"],
    away: (c) => [`Turnkey Delivery in ${c.city}`, "Coordinated Remote Execution"],
};

const F_TRAIT = {
    unisex: "Unisex Service Planning",
    makeup: "Makeup-Ready Lighting",
    wellness: "Calm Wellness Setting",
    grooming: "Grooming-Focused Stations",
};

// ── more variety where the portfolio is largest ─────────────────────────────
// Salons (142 projects) and studios (35) — most of them one brand — need the
// deepest sentence pools, as do the commonest settings.

O_INTRO.push(
    (c) => `We designed ${c.T} ${c.at} as a complete ${c.v.type}, resolving the plan, the lighting and the finishes as one piece of work.`,
    (c) => `${c.T}, ${c.at}, is one of our ${c.v.type} projects for ${c.brand}, delivered from initial layout to opening day.`,
    (c) => `The ${c.v.space} for ${c.brand} ${c.at} was conceived as a practical, welcoming setting for ${c.v.services}.`,
);
O_CHARACTER.salon.push(
    (c) => `A restrained palette lets the styling stations and mirrors set the rhythm of the room, with warmth added through lighting and texture.`,
    (c) => `Every surface was considered for the realities of salon work, so the interior looks as composed at closing time as at opening.`,
    (c) => `The salon is light and orderly, with the reception, styling and wash areas each reading clearly as you move through.`,
);
O_CHARACTER.studio.push(
    (c) => `Neat, considered detailing keeps the studio calm, so the focus stays on the client and the work at each station.`,
    (c) => `The studio pairs a soft, welcoming atmosphere with the practical precision that styling and makeup services need.`,
);
O_SETTING.mall.push(
    (c) => `Mall units are seen first from the corridor, so the frontage and the view into the ${c.v.space} were treated as part of the brand's presence.`,
    (c) => `Its place in a busy retail centre called for a ${c.v.space} that is easy to spot, easy to enter and comfortable once inside.`,
);
O_SETTING.neighbourhood.push(
    (c) => `Its residential surroundings called for a ${c.v.space} that feels part of the local fabric while still offering a polished experience.`,
    (c) => `A neighbourhood address favours an interior that feels familiar on the tenth visit as much as the first.`,
);
C_SETTING.mall.push(
    (c) => `Mall corridors are crowded with competing frontages, so the ${c.v.space} needed a clear, confident presence within the centre's rules.`,
    (c) => `Planning had to respect the mall's services, shopfront line and working hours, which constrained both layout and programme.`,
);
C_SETTING.neighbourhood.push(
    (c) => `In a residential area the ${c.v.space} competes on comfort and trust as much as on looks, which shaped the brief from the start.`,
    (c) => `The design had to suit a steady local clientele, offering a polished interior that never feels intimidating.`,
);
C_SETTING.sector.push(
    (c) => `Serving a planned sector meant designing for regular, everyday visits, where clarity and comfort matter more than spectacle.`,
);
C_SETTING.market.push(
    (c) => `With neighbouring shops on either side, the frontage had limited room to make an impression, so every element of it had to count.`,
);
C_SETTING.business.push(
    (c) => `A business setting brings ${c.v.guests} with limited time, so the interior had to feel efficient as well as polished.`,
);
C_SETTING.city.push(
    (c) => `Bringing a contemporary ${c.v.space} to ${c.city} meant creating something polished yet comfortable for a local clientele.`,
    (c) => `In ${c.city}${c.state && c.state !== c.city ? `, ${c.state}` : ""}, the ${c.v.space} needed to make a clear first impression and stay easy to use every day.`,
);
C_SETTING.sector.push(
    (c) => `As a local ${c.v.space} in a planned sector, it needed to be inviting from the entrance and simple to move through.`,
);
C_SETTING.street.push(
    (c) => `Facing the street, the ${c.v.space} had to announce itself clearly while keeping clients comfortable and unexposed inside.`,
);
C_SETTING.club.push(
    (c) => `Within a residential community, the ${c.v.space} had to feel at home among its neighbours while offering a refined service.`,
);
C_CONTEXT.single.push(
    (c) => `Just as important was giving ${c.brand} an interior with a personality of its own, distinct from generic ${c.v.space} design.`,
);
C_CONTEXT.repeat.push(
    (c) => `As a further ${c.brand} outlet, it had to share a family resemblance with the others while suiting its own setting.`,
);
C_CONTEXT.chain.push(
    (c) => `Each ${c.brand} site is recognisably part of the brand, and this one had to be too, on its own terms.`,
);
C_FORMAT.salon.push(
    (c) => `Salon work generates heat, water and clutter, and the interior had to handle all three while still looking composed.`,
    (c) => `Giving every station good light, power and storage without visible clutter was central to the planning.`,
    (c) => `The layout had to support a steady flow of appointments, keeping arrival, service and departure from crossing each other.`,
);
C_FORMAT.studio.push(
    (c) => `Studio services are close and personal, so each station needed privacy and good light without the space feeling closed in.`,
    (c) => `Keeping products, tools and seating organised around every station, without clutter, was central to the plan.`,
);
C_CONTEXT.chain.push(
    (c) => `The site had to deliver the experience ${c.brand} clients expect, built around the dimensions and setting of this location.`,
    (c) => `Matching ${c.brand}'s standards of finish while planning afresh for this footprint required close attention to detail.`,
);
C_CONTEXT.away.push(
    (c) => `Working away from the NCR, in ${c.city}, required clear drawings and dependable coordination so that the finished site matched the design.`,
);
S_PLAN.salon.push(
    (c) => `Reception sits at the front to greet clients, with styling stations beyond and the wash area placed to keep the floor calm.`,
    (c) => `We arranged the stations in a clear rhythm, keeping a generous route through the salon and space for staff to work freely.`,
    (c) => `Services and plumbing were planned together, so wash points and stations sit neatly within the layout without visible clutter.`,
);
S_PLAN.studio.push(
    (c) => `Stations were placed to make the most of the available light, with seating and storage arranged neatly around each one.`,
    (c) => `We planned the studio as a sequence from welcome to service, keeping each area calm and easy to reach.`,
);
S_FINISH.salon.push(
    (c) => `Lighting was layered, brighter and even where detailed work happens and softer elsewhere, so the salon stays practical and warm.`,
    (c) => `Hard-wearing surfaces sit where work is heaviest, with softer textures in waiting areas to keep the salon comfortable.`,
    (c) => `Joinery conceals tools and stock at each station, leaving clean lines and an uncluttered floor.`,
);
S_FINISH.studio.push(
    (c) => `Mirror lighting was kept even and true to skin tone, while softer ambient light keeps the rest of the studio relaxed.`,
);
S_DELIVERY.near.push(
    (c) => `The work was delivered turnkey, with our team coordinating every trade through to handover.`,
    (c) => `One team took the project through design, site execution and snagging to a finished handover.`,
);
S_DELIVERY.away.push(
    (c) => `From our Gurugram studio, we coordinated the site work in ${c.city} through to a complete, ready-to-open ${c.v.space}.`,
);

// ── assembly ────────────────────────────────────────────────────────────────

const LIMITS = { overview: [50, 90], challenge: [35, 70], solution: [45, 80] };

function pickIndex(list, r) {
    return Math.floor(r() * list.length);
}

/** The shared state of one run: what each field has used so far. */
export function newRun() {
    return { sigs: new Set(), combos: {}, stats: {} };
}

// One field: try seeded combinations until one fits the word range AND
// differs from every earlier project's text for this field in at least two
// sentences (not merely one). If no such combination exists — a large group
// of near-identical projects — take the one closest to that goal; the text is
// still unique, because it names the project's own place.
function build(field, c, slotsFor, run, tries = 800) {
    const r = rng(hash(`${c.slug}|${field}`));
    const prior = (run.combos[field] ||= []);
    const stat = (run.stats[field] ||= { apart2: 0, apart1: 0 });
    let best = null;
    for (let t = 0; t < tries; t++) {
        const slots = slotsFor(r);
        const ids = slots.map(([key, list]) => `${key}:${pickIndex(list, r)}`);
        const text = slots.map(([, list], i) => list[Number(ids[i].split(":").pop())](c)).join(" ");
        const n = words(text);
        const [lo, hi] = LIMITS[field];
        if (n < lo || n > hi) continue;
        let shared = 0; // most sentences in common with any earlier project
        for (const p of prior) {
            let same = 0;
            for (const id of ids) if (p.has(id)) same++;
            if (same > shared) shared = same;
            if (shared >= ids.length) break;
        }
        if (shared <= ids.length - 2) {
            prior.push(new Set(ids));
            stat.apart2++;
            return text;
        }
        if (!best || shared < best.shared) best = { text, ids, shared };
    }
    if (best) {
        prior.push(new Set(best.ids));
        stat.apart1++;
        return best.text;
    }
    throw new Error(`${c.slug}: no ${field} within ${LIMITS[field].join("–")} words`);
}

export function composeProject(c, run) {
    const g = c.group;
    const overview = build("overview", c, () => [
        g === "estate" ? ["oi-home", O_INTRO_HOME] : ["oi", O_INTRO],
        [`ob-${c.tier}`, O_BRAND[c.tier]],
        [`os-${c.setting}`, O_SETTING[c.setting]],
        [`oc-${g}`, O_CHARACTER[g]],
    ], run);

    const challenge = build("challenge", c, (r) => {
        const ctxKey = c.away && r() < 0.55 ? "away" : c.tier;
        return [
            [`cs-${c.setting}`, C_SETTING[c.setting]],
            [`cf-${g}`, C_FORMAT[g]],
            [`cc-${ctxKey}`, C_CONTEXT[ctxKey]],
        ];
    }, run);

    const solution = build("solution", c, (r) => {
        const slots = [[`sp-${g}`, S_PLAN[g]]];
        if (r() < 0.75) slots.push([`ss-${c.setting}`, S_SETTING[c.setting]]);
        slots.push([`sf-${g}`, S_FINISH[g]]);
        const d = g === "estate" ? "home" : c.away ? "away" : "near";
        slots.push([`sd-${d}`, S_DELIVERY[d]]);
        return slots;
    }, run);

    // Key features: 3–5 from the format, one from the setting, one from the
    // brand history (or the remote delivery), plus a name trait if there is one.
    const r = rng(hash(`${c.slug}|features`));
    let keyFeatures = null;
    for (let t = 0; t < 400 && !keyFeatures; t++) {
        const pool = [...F_FORMAT[g]];
        const take = 3 + Math.floor(r() * 3);
        const chosen = [];
        while (chosen.length < take && pool.length) chosen.push(pool.splice(pickIndex(pool, r), 1)[0]);
        const settingPool = F_SETTING[c.setting];
        chosen.push(settingPool[pickIndex(settingPool, r)]);
        const ctxPool = F_CONTEXT[c.away && r() < 0.5 ? "away" : c.tier](c);
        chosen.push(ctxPool[pickIndex(ctxPool, r)]);
        const trait = Object.keys(F_TRAIT).find((k) => c.traits[k]);
        if (trait && chosen.length < 7) chosen.push(F_TRAIT[trait]);
        const list = [...new Set(chosen)].slice(0, 7);
        if (list.length < 5) continue;
        const sig = `features|${[...list].sort().join("|")}`;
        if (run.sigs.has(sig)) continue;
        run.sigs.add(sig);
        keyFeatures = list;
    }
    if (!keyFeatures) throw new Error(`${c.slug}: could not find a unique feature list`);

    return { overview, challenge, solution, keyFeatures };
}
