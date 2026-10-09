/**
 * One-off / re-runnable image optimizer.
 *
 *   node scripts/optimize-images.js            # optimize in place
 *   node scripts/optimize-images.js --dry      # report only
 *
 * Walks public/, and for every raster image over THRESHOLD_KB:
 *   - downscales so the longest edge is <= MAX_EDGE (hero gets HERO_MAX_EDGE)
 *   - re-encodes (JPEG q80 mozjpeg / PNG q80 / WebP q80), strips metadata
 *   - overwrites in place (git keeps the originals)
 *
 * Small assets (logos, og-image, favicons) stay untouched — they're under the
 * threshold. next/image blur placeholders regenerate on the next build.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..", "public");
const THRESHOLD_KB = 400;
const MAX_EDGE = 2000;
const HERO_MAX_EDGE = 2560;
const DRY = process.argv.includes("--dry");

const EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function run() {
  let count = 0;
  let before = 0;
  let after = 0;

  for (const file of walk(ROOT)) {
    const ext = path.extname(file).toLowerCase();
    if (!EXT.has(ext)) continue;

    const startBytes = fs.statSync(file).size;
    if (startBytes < THRESHOLD_KB * 1024) continue;

    const rel = path.relative(ROOT, file);
    const isHero = /(^|\/|\\)hero/i.test(rel);
    const maxEdge = isHero ? HERO_MAX_EDGE : MAX_EDGE;

    // Read into memory first so we never hold a read handle on a file we then
    // overwrite (Windows locks it otherwise).
    const input = fs.readFileSync(file);
    const img = sharp(input, { failOn: "none" }).rotate();
    const meta = await img.metadata();
    const longest = Math.max(meta.width || 0, meta.height || 0);

    let pipeline = img;
    if (longest > maxEdge) {
      pipeline = pipeline.resize({
        width: meta.width >= meta.height ? maxEdge : undefined,
        height: meta.height > meta.width ? maxEdge : undefined,
        withoutEnlargement: true,
      });
    }

    if (ext === ".png") pipeline = pipeline.png({ quality: 80, compressionLevel: 9 });
    else if (ext === ".webp") pipeline = pipeline.webp({ quality: 80 });
    else pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });

    const out = await pipeline.toBuffer();

    before += startBytes;
    count += 1;

    if (out.length >= startBytes) {
      after += startBytes;
      console.log(`  skip  ${rel}  (already optimal, ${(startBytes / 1024).toFixed(0)}KB)`);
      continue;
    }

    after += out.length;
    console.log(
      `  ${DRY ? "would " : ""}shrink ${rel}  ${(startBytes / 1024).toFixed(0)}KB -> ${(out.length / 1024).toFixed(0)}KB`
    );
    if (!DRY) fs.writeFileSync(file, out);
  }

  console.log(
    `\n${DRY ? "[dry] " : ""}${count} images  ${(before / 1024 / 1024).toFixed(1)}MB -> ${(after / 1024 / 1024).toFixed(1)}MB`
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
