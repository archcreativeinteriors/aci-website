/**
 * Regenerates the favicon set from the "ACI" monogram in public/aci-logo.png.
 *
 *   node scripts/generate-favicon.js
 *
 * Outputs (picked up automatically by Next's app/ file conventions):
 *   src/app/icon.png        512×512  — primary <link rel="icon">
 *   src/app/apple-icon.png  180×180  — <link rel="apple-touch-icon">
 *   src/app/favicon.ico     16/32/48 — legacy /favicon.ico
 *
 * The logo artwork is white, so it's composited on the brand blue (#264ea0).
 */
const path = require("path");
const sharp = require("sharp");
const pngToIco = require("png-to-ico").default;
const fs = require("fs/promises");

const APP = path.join(__dirname, "..", "src", "app");
const LOGO = path.join(__dirname, "..", "public", "aci-logo.png");
const BG = { r: 0x26, g: 0x4e, b: 0xa0, alpha: 1 };

async function run() {
  const meta = await sharp(LOGO).metadata();

  // The "ACI" mark is the left ~28% of the wordmark. Extract it, then trim the
  // transparent margins so it sits tight.
  const markWidth = Math.round(meta.width * 0.34);
  const cropped = await sharp(LOGO)
    .extract({ left: 0, top: 0, width: markWidth, height: meta.height })
    .toBuffer();
  const mark = await sharp(cropped).trim().toBuffer();

  const SIZE = 512;
  const INSET = 96; // padding inside the square

  const icon = await sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: BG },
  })
    .composite([
      {
        input: await sharp(mark)
          .resize(SIZE - INSET * 2, SIZE - INSET * 2, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .toBuffer(),
        gravity: "center",
      },
    ])
    .png()
    .toBuffer();

  await fs.writeFile(path.join(APP, "icon.png"), icon);
  await sharp(icon).resize(180, 180).png().toFile(path.join(APP, "apple-icon.png"));

  const icoSizes = await Promise.all(
    [16, 32, 48].map((s) => sharp(icon).resize(s, s).png().toBuffer())
  );
  await fs.writeFile(path.join(APP, "favicon.ico"), await pngToIco(icoSizes));

  console.log("wrote src/app/{icon.png, apple-icon.png, favicon.ico}");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
