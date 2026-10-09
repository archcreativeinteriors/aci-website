/**
 * Regenerate public/images/new-clients/*.png at high resolution.
 *
 * Why: the shipped logos were ~250-300px wide but the /clients grid renders them
 * around that same CSS size, so on any 2x/3x display the browser upscales and they
 * look soft. Sharper originals of the same artwork already exist in
 * public/images/all-clients/ (many 400-6900px wide).
 *
 * For each logo this:
 *   1. trims the baked-in background padding off the current file (that padding
 *      makes a logo render optically smaller inside a `object-fit: contain` box,
 *      so trimming is also what makes the wall look evenly sized),
 *   2. looks for a same-artwork original in all-clients/, trims it too, and uses it
 *      only when it is meaningfully larger AND its trimmed aspect ratio matches
 *      (the guard against silently swapping in differently-cropped art),
 *   3. writes the result back in place, fitted to TARGET and never enlarged.
 *
 * Safe to re-run after adding a logo — but not byte-for-byte idempotent. Most files
 * settle on the second pass and are then skipped untouched; a handful wobble by a few
 * pixels each run, because the trim threshold reads the re-padded margin slightly
 * differently once the PNG has been palette-quantized. Harmless: clientLogos.js is
 * re-synced in the same pass, so the declared dimensions always match the files.
 * For a deterministic result, reset first:
 *   git checkout -- public/images/new-clients && npm run logos:sharpen
 *
 *   node scripts/upscale-client-logos.js
 *   node scripts/upscale-client-logos.js --dry
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const NEW_DIR = path.join(ROOT, "public/images/new-clients");
const SRC_DIR = path.join(ROOT, "public/images/all-clients");
const DATA_FILE = path.join(ROOT, "src/app/lib/data/clientLogos.js");

// Display box on /clients is ~190x92 CSS px (460x64 for the full-width banner).
// 720x300 keeps every logo comfortably above 2x density without bloating the repo.
const TARGET = { width: 720, height: 300 };

// A candidate original is only used when it is this much wider than what we have...
const MIN_GAIN = 1.25;
// ...and its trimmed aspect ratio is within this much of the current trimmed art.
// The ratio check is a proxy for "same artwork" — a loose name match alone is not
// enough, several brands here share a name prefix.
const MAX_AR_DIFF = 0.1;

// Reviewed by eye (side-by-side render of both files). These are the same logo,
// just framed differently in the original — so the ratio check would reject them
// even though the sharper source is correct.
const FORCE = new Set([
    "beauty.png", "black-express.png", "cosmo.png", "dopulence.png", "geetanjali.png",
    "geetanjali-studio.png", "hakim.png", "he-she.png", "headlines.png", "hob.png",
    "iza.png", "la-adorable.png", "magn.png", "martina.png", "northwood.png",
    "ps.png", "revitall.png", "strike.png", "studio.png", "toni.png", "trendz.png",
    "tweak.png", "ups.png", "verma.png",
]);

// Also reviewed by eye — here the fuzzy name match found a DIFFERENT brand, or the
// current file is the better variant. Never take an original for these.
//   geet          -> matched Geetanjali-studio (Geet's Make Up Studio is its own brand)
//   la            -> matched La.jpg / La Adorabelle (this one is La Fleur)
//   verma-acadmy  -> matched Verma.jpg (that's "Unisex Salon", this is "Salon & Academy")
//   extension     -> original is a smaller, stacked lockup
//   fab-u         -> original drops the wood-texture background of the real mark
//   encanto       -> the gold "Nail Cafe by Encanto" mark; all-clients/Encanto.jpg is the
//                    BLUE one, which is already encanto-second. Without this both tiles
//                    render the same logo.
const DENY = new Set([
    "geet.png", "la.png", "verma-acadmy.png", "extension.png", "fab-u.png", "encanto.png",
]);

const DRY = process.argv.includes("--dry");

const normalize = (name) =>
    name
        .replace(/\.[^.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

/** The top-left pixel — the colour sharp's trim() treats as the background. */
async function cornerColour(input) {
    const { data } = await sharp(input)
        .extract({ left: 0, top: 0, width: 1, height: 1 })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
    return { r: data[0], g: data[1], b: data[2], alpha: data[3] / 255 };
}

/**
 * Trim the uniform border sharp detects from the top-left pixel, and report the
 * colour it trimmed against so we can put a margin back in that same colour.
 */
async function trimmed(input) {
    const background = await cornerColour(input);
    try {
        const out = await sharp(input).trim({ threshold: 12 }).toBuffer({ resolveWithObject: true });
        if (out.info.width > 8 && out.info.height > 8) return { ...out, background };
    } catch {
        /* a fully uniform image throws — fall through */
    }
    const out = await sharp(input).toBuffer({ resolveWithObject: true });
    return { ...out, background };
}

/**
 * Give the trimmed art a small margin back, in its own background colour.
 *
 * Trimming to the content edge is what makes the wall size evenly, but on the
 * logos built as a coloured bar (black/gold/navy) it leaves the type touching
 * the edge, which reads as clipped. Re-padding in the sampled corner colour
 * keeps the even sizing and puts the breathing room back.
 */
async function padded(data, info, background) {
    const pad = Math.max(4, Math.round(Math.max(info.width, info.height) * 0.04));

    return sharp(data)
        .extend({ top: pad, bottom: pad, left: pad, right: pad, background })
        .png({ compressionLevel: 9, palette: true, quality: 92, effort: 8 })
        .toBuffer({ resolveWithObject: true });
}

async function main() {
    if (!fs.existsSync(SRC_DIR)) {
        console.error(`missing ${SRC_DIR} — nothing to upscale from`);
        process.exit(1);
    }

    const originals = [];
    for (const file of fs.readdirSync(SRC_DIR)) {
        const full = path.join(SRC_DIR, file);
        try {
            const meta = await sharp(full).metadata();
            originals.push({ file, full, key: normalize(file), width: meta.width, height: meta.height });
        } catch {
            /* skip anything sharp can't read (e.g. an animated gif) */
        }
    }

    const files = fs.readdirSync(NEW_DIR).filter((f) => /\.(png|jpe?g)$/i.test(f));
    let upgraded = 0;
    let trimOnly = 0;
    let skipped = 0;
    let bytesBefore = 0;
    let bytesAfter = 0;

    for (const file of files) {
        const full = path.join(NEW_DIR, file);
        bytesBefore += fs.statSync(full).size;

        const meta = await sharp(full).metadata();
        const current = await trimmed(full);
        const key = normalize(file);

        const candidate =
            originals.find((o) => o.key === key) ||
            originals.find((o) => o.key.startsWith(key) || key.startsWith(o.key)) ||
            originals.find((o) => o.key.includes(key) || key.includes(o.key));

        let source = current;
        let note = "trim";

        if (candidate && !DENY.has(file)) {
            const other = await trimmed(candidate.full);
            const gain = other.info.width / current.info.width;
            const arCurrent = current.info.width / current.info.height;
            const arOther = other.info.width / other.info.height;
            const arDiff = Math.abs(arCurrent - arOther) / arCurrent;

            if (gain >= MIN_GAIN && (arDiff <= MAX_AR_DIFF || FORCE.has(file))) {
                source = other;
                note = `${candidate.file} ${other.info.width}x${other.info.height} (${gain.toFixed(1)}x)`;
            }
        }

        // Resize the trimmed artwork first, then pad. Padding first would make the
        // margin part of what the size cap shrinks, so every re-run would trim the
        // pad off, shrink the content a little more, and pad again — a slow drift.
        const fitted = await sharp(source.data)
            .resize({ ...TARGET, fit: "inside", withoutEnlargement: true })
            .toBuffer({ resolveWithObject: true });

        const out = await padded(fitted.data, fitted.info, source.background);

        // A file that already trims+pads back to its own dimensions is done. Skip it
        // rather than re-encoding — repeated palette quantization of an already
        // quantized PNG loses a little every pass, and this script is meant to be
        // safe to re-run after adding a logo.
        const settled = note === "trim" && out.info.width === meta.width && out.info.height === meta.height;

        if (settled) {
            bytesAfter += fs.statSync(full).size;
            skipped++;
            continue;
        }

        if (!DRY) fs.writeFileSync(full, out.data);
        bytesAfter += out.data.length;

        if (note === "trim") trimOnly++;
        else upgraded++;

        console.log(
            `${file.padEnd(24)} -> ${String(out.info.width).padStart(4)}x${String(out.info.height).padEnd(4)}  ${note}`
        );
    }

    const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;
    console.log(
        `\n${files.length} logos — ${upgraded} re-sourced from a sharper original, ` +
            `${trimOnly} trimmed in place, ${skipped} already settled.`
    );
    console.log(`${mb(bytesBefore)} -> ${mb(bytesAfter)}${DRY ? "  (dry run, nothing written)" : ""}`);

    // The width/height in clientLogos.js are the <img> intrinsic size — if they
    // drift from the real files the browser reserves the wrong aspect-ratio box
    // and the grid shifts on load. Keep them in step here rather than by hand.
    const synced = await syncDataDimensions();
    console.log(`clientLogos.js: ${synced} dimension${synced === 1 ? "" : "s"} updated`);
}

async function syncDataDimensions() {
    const lines = fs.readFileSync(DATA_FILE, "utf8").split("\n");
    let changed = 0;

    for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/src:\s*"\/images\/new-clients\/([^"]+)"/);
        if (!match) continue;

        const meta = await sharp(path.join(NEW_DIR, match[1])).metadata();
        const next = lines[i]
            .replace(/width:\s*\d+/, `width: ${meta.width}`)
            .replace(/height:\s*\d+/, `height: ${meta.height}`);

        if (next !== lines[i]) {
            lines[i] = next;
            changed++;
        }
    }

    if (!DRY && changed) fs.writeFileSync(DATA_FILE, lines.join("\n"));
    return changed;
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
