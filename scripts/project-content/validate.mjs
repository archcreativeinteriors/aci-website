// Validation rules for project page text (owner, 2026-10-08). Shared by the
// generator (index.mjs) and its --audit mode, so both judge content the same way.

import { words } from "./compose.mjs";

export const FIELDS = ["overview", "challenge", "solution", "keyFeatures"];

// Word ranges for GENERATED text. Hand-written text is never rejected for its
// length — it is only listed for review.
export const RANGES = { overview: [50, 90], challenge: [35, 70], solution: [45, 80] };
export const FEATURES = [5, 7];

const PLACEHOLDERS = [/lorem ipsum/i, /coming soon/i, /description here/i, /^\s*project overview\s*$/i, /\btodo\b/i, /\btbd\b/i, /\bplaceholder\b/i, /\bxxx+\b/i];
const BANNED = [/state[- ]of[- ]the[- ]art/i, /world[- ]class/i, /best[- ]in[- ]class/i, /revolutionary/i, /unparalleled/i];

const text = (v) => (typeof v === "string" ? v.trim() : "");
export const filled = (rec, field) =>
    field === "keyFeatures"
        ? Array.isArray(rec.keyFeatures) && rec.keyFeatures.some((s) => text(s))
        : Boolean(text(rec[field]));

/**
 * Problems with the given fields of one record. `strict` (generated text) makes
 * the length and item-count rules errors; otherwise they are review notes.
 */
export function checkRecord(rec, { strict, fields = FIELDS }) {
    const errors = [];
    const review = [];
    for (const f of fields) {
        if (!filled(rec, f)) {
            errors.push(`${f} is empty`);
            continue;
        }
        const values = f === "keyFeatures" ? rec.keyFeatures : [rec[f]];
        for (const s of values) {
            if (PLACEHOLDERS.some((re) => re.test(s))) errors.push(`${f} contains placeholder text ("${s.slice(0, 40)}")`);
            if (BANNED.some((re) => re.test(s))) errors.push(`${f} uses a banned phrase ("${s.slice(0, 40)}")`);
        }
        if (f !== "keyFeatures") {
            const n = words(rec[f]);
            const [lo, hi] = RANGES[f];
            if (n < lo || n > hi) (strict ? errors : review).push(`${f} is ${n} words (target ${lo}–${hi})`);
        }
    }
    if (!fields.includes("keyFeatures")) return { errors, review };
    if (Array.isArray(rec.keyFeatures)) {
        const list = rec.keyFeatures.map(text).filter(Boolean);
        const [lo, hi] = FEATURES;
        if (list.length < lo || list.length > hi) (strict ? errors : review).push(`keyFeatures has ${list.length} items (must be ${lo}–${hi})`);
        if (new Set(list.map((s) => s.toLowerCase())).size !== list.length) errors.push("keyFeatures repeats an item");
    } else if (rec.keyFeatures != null) {
        errors.push("keyFeatures is not a list");
    }
    return { errors, review };
}

/** Exact duplicates across records: { overview: [[slug, …]], … }. */
export function duplicates(records) {
    const out = {};
    for (const f of FIELDS) {
        const seen = new Map();
        for (const r of records) {
            if (!filled(r, f)) continue;
            const key = f === "keyFeatures" ? JSON.stringify(r.keyFeatures.map((s) => s.trim().toLowerCase())) : r[f].trim().toLowerCase();
            seen.set(key, [...(seen.get(key) || []), r.slug]);
        }
        out[f] = [...seen.values()].filter((slugs) => slugs.length > 1);
    }
    return out;
}

// Near-duplicates, for the report only: word-trigram overlap (Jaccard). Shared
// short phrases are expected and never fail validation.
function trigrams(s) {
    const w = s.toLowerCase().replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(Boolean);
    const set = new Set();
    for (let i = 0; i + 2 < w.length; i++) set.add(`${w[i]} ${w[i + 1]} ${w[i + 2]}`);
    return set;
}

export function mostSimilar(records, field) {
    const items = records.filter((r) => filled(r, field)).map((r) => ({ slug: r.slug, g: trigrams(r[field]) }));
    let best = { score: 0, a: null, b: null };
    for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
            const A = items[i].g, B = items[j].g;
            let inter = 0;
            for (const t of A) if (B.has(t)) inter++;
            const score = inter / (A.size + B.size - inter || 1);
            if (score > best.score) best = { score, a: items[i].slug, b: items[j].slug };
        }
    }
    return best;
}

// Hand-written copy that names a different city, or calls a non-mall location a
// mall: a likely copy-paste from another project. Listed for review only.
export function placeMismatch(rec, allCities) {
    const body = FIELDS.filter((f) => f !== "keyFeatures").map((f) => text(rec[f])).join(" ");
    const issues = [];
    for (const city of allCities) {
        if (!city || city.length < 4) continue;
        if (new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(body) && !new RegExp(city, "i").test(`${rec.city} ${rec.location || ""}`)) {
            issues.push(`mentions ${city}, but the project is in ${rec.city}`);
        }
    }
    if (/\bmall\b/i.test(body) && !/mall|plaza|citywalk|walk|square|centre|center|place|promenade/i.test(rec.location || "")) {
        issues.push(`mentions a mall, but the location is "${rec.location}"`);
    }
    return issues;
}
