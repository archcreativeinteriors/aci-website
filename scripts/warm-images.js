/**
 * npm run images:warm [-- --url http://localhost:3000] [--limit 300]
 *
 * Asks the running site for the photos at the TOP of every page (the ones a
 * visitor sees first), so the server prepares them before real visitors
 * arrive. Run after a deploy's restart; `npm run build:safe -- --restart ...`
 * runs it for you. Read-only: it only makes GET requests to our own site.
 *
 * Most answers are instant cache hits when scripts/image-cache.js carried the
 * cache over; the ones it prepares are new or changed photos.
 *
 * WHICH IMAGES: per page, the above-the-fold ones — <link rel="preload"
 * as="image">, <img loading="eager"> / fetchpriority="high", and <picture>
 * sources — at the widths phones and desktops actually pick from their
 * srcset (WIDTHS below). With the Accept header modern browsers send, so the
 * AVIF version is the one prepared.
 *
 * Never fails a deploy: every error is logged and skipped. Two requests at a
 * time, so a small server is not swamped right after a restart.
 */

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
    const i = argv.indexOf(name);
    return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};

const BASE = (arg("--url", process.env.WARM_URL || `http://localhost:${process.env.PORT || 3000}`)).replace(/\/$/, "");
const LIMIT = Number(arg("--limit", 300)); // pages
const WIDTHS = [750, 828, 1080, 1920]; // phones at DPR ~2-3, tablets, desktops
const CONCURRENCY = 2;
const ACCEPT = "image/avif,image/webp,image/apng,image/*,*/*;q=0.8";

const decode = (s) => s.replace(/&amp;/g, "&");

/** "url 360w, url 640w" -> Map(width -> url) */
function parseSrcSet(srcset) {
    const out = new Map();
    for (const part of decode(srcset).split(",")) {
        const [url, w] = part.trim().split(/\s+/);
        if (url && w && w.endsWith("w")) out.set(Number(w.slice(0, -1)), url);
    }
    return out;
}

/** The srcsets of the above-the-fold images in one page's HTML. */
function aboveTheFold(html) {
    const sets = [];
    for (const m of html.matchAll(/<link[^>]*rel="preload"[^>]*as="image"[^>]*>/g)) {
        const s = m[0].match(/imageSrcSet="([^"]*)"/i);
        if (s) sets.push(s[1]);
    }
    for (const m of html.matchAll(/<img[^>]*>/g)) {
        const tag = m[0];
        if (!/loading="eager"|fetchPriority="high"/i.test(tag)) continue;
        const s = tag.match(/srcSet="([^"]*)"/i);
        if (s) sets.push(s[1]);
    }
    for (const m of html.matchAll(/<source[^>]*srcSet="([^"]*)"[^>]*>/gi)) sets.push(m[1]);
    return sets;
}

async function waitForServer(timeoutMs = 60000) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
        try {
            const r = await fetch(`${BASE}/robots.txt`);
            if (r.ok) return true;
        } catch {
            /* not up yet */
        }
        await new Promise((r) => setTimeout(r, 1000));
    }
    return false;
}

async function main() {
    const started = Date.now();
    if (!(await waitForServer())) {
        console.log(`images:warm — ${BASE} did not answer within 60 s; skipped.`);
        return;
    }

    // Page list from the sitemap (it names the public domain; ask our server).
    const xml = await (await fetch(`${BASE}/sitemap.xml`)).text();
    const pages = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
        .map((m) => new URL(m[1]).pathname)
        .slice(0, LIMIT);

    const urls = new Set();
    for (const page of pages) {
        try {
            const html = await (await fetch(BASE + page)).text();
            for (const set of aboveTheFold(html)) {
                const byWidth = parseSrcSet(set);
                for (const w of WIDTHS) if (byWidth.has(w)) urls.add(byWidth.get(w));
            }
        } catch (err) {
            console.log(`images:warm — ${page}: ${err.message}`);
        }
    }

    const list = [...urls].filter((u) => u.startsWith("/_next/image"));
    let hit = 0;
    let prepared = 0;
    const failures = [];
    let next = 0;
    const worker = async () => {
        while (next < list.length) {
            const url = list[next++];
            try {
                const r = await fetch(BASE + url, { headers: { Accept: ACCEPT } });
                await r.arrayBuffer();
                if (!r.ok) failures.push(`${r.status} ${url}`);
                else if (r.headers.get("x-nextjs-cache") === "HIT") hit++;
                else prepared++;
            } catch (err) {
                failures.push(`${err.message} ${url}`);
            }
        }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    console.log(
        `images:warm — ${pages.length} pages, ${list.length} above-the-fold images: ` +
            `${hit} already prepared, ${prepared} prepared now, ${failures.length} failed ` +
            `(${((Date.now() - started) / 1000).toFixed(1)} s)`
    );
    for (const f of failures.slice(0, 5)) console.log(`  failed: ${decodeURIComponent(f).slice(0, 160)}`);
}

main().catch((err) => console.log(`images:warm — stopped: ${err.message}`));
