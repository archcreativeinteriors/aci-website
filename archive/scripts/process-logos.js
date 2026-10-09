const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const INPUT_DIR = path.join(__dirname, "../public/images/all-clients");
const OUTPUT_DIR = path.join(__dirname, "../public/images/all-clients-processed");

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 250;
const PADDING = 30;

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const files = fs.readdirSync(INPUT_DIR).filter(file =>
    /\.(png|jpg|jpeg|webp)$/i.test(file)
);

(async () => {
    for (const file of files) {
        const input = path.join(INPUT_DIR, file);
        const output = path.join(OUTPUT_DIR, file.replace(/\.(jpg|jpeg)$/i, ".png"));

        try {

            let image = sharp(input).trim();

            const meta = await image.metadata();

            const maxWidth = CANVAS_WIDTH - PADDING * 2;
            const maxHeight = CANVAS_HEIGHT - PADDING * 2;

            image = image.resize({
                width: maxWidth,
                height: maxHeight,
                fit: "inside",
                withoutEnlargement: false,
            });

            const resized = await image.toBuffer();
            const resizedMeta = await sharp(resized).metadata();

            const left = Math.round((CANVAS_WIDTH - resizedMeta.width) / 2);
            const top = Math.round((CANVAS_HEIGHT - resizedMeta.height) / 2);

            await sharp({
                create: {
                    width: CANVAS_WIDTH,
                    height: CANVAS_HEIGHT,
                    channels: 4,
                    background: { r: 255, g: 255, b: 255, alpha: 0 }
                }
            })
                .composite([
                    {
                        input: resized,
                        left,
                        top
                    }
                ])
                .png()
                .toFile(output);

            console.log(`✓ ${file}`);

        } catch (err) {
            console.log(`✗ ${file}`, err.message);
        }
    }

    console.log("Done!");
})();