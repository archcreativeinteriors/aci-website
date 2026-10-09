// The maintenance page (owner, 2026-10-07). OFF unless MAINTENANCE_MODE=1.
//
// HOW IT IS SWITCHED ON: next.config.mjs adds a rewrite that sends every page
// to /maintenance, but only when MAINTENANCE_MODE=1 is set at BUILD time (on
// Vercel: set the variable, then redeploy). With the variable unset there is
// no rewrite at all, so the site pays nothing — no Proxy runs on each request.
// Full steps: docs/vercel-deploy.md → "Maintenance mode".
//
// WHY A ROUTE HANDLER, NOT A PAGE: search engines must be told the outage is
// temporary, which means HTTP 503 + Retry-After. A page cannot set its status
// (it would answer 200, and Google could index "We'll be back" in place of
// the real pages); a route handler can.
//
// SELF-CONTAINED ON PURPOSE: inline CSS, system fonts, the logo from /public.
// Nothing here depends on the app's CSS bundle, so the page still works while
// the rest of the site is being rebuilt. Phone, WhatsApp and email come from
// Site settings like every other NAP on the site; if Sanity cannot be reached
// the page still renders, just without them.

import { getSiteSettings } from "../lib/content";
import { SITE_NAME } from "../lib/site";

export const dynamic = "force-dynamic";

const isOn = () => process.env.MAINTENANCE_MODE === "1";

// Seconds a crawler should wait before trying again (default one hour).
const retryAfter = () => {
    const n = Number.parseInt(process.env.MAINTENANCE_RETRY_AFTER || "", 10);
    return Number.isFinite(n) && n > 0 ? String(n) : "3600";
};

const esc = (v) =>
    String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

async function contactDetails() {
    try {
        return (await getSiteSettings()).contact;
    } catch {
        return null;
    }
}

function page(contact) {
    const actions = contact
        ? `
      <div class="m-actions">
${contact.callNumbers
    .map((n) => `        <a class="m-btn m-btn--solid" href="tel:${esc(n.tel)}">Call ${esc(n.display)}</a>`)
    .join("\n")}
        <a class="m-btn" href="https://wa.me/${esc(contact.whatsappNumber)}">WhatsApp us</a>
      </div>
      <p class="m-mail">Or email <a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></p>`
        : "";

    return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Back shortly | ${esc(SITE_NAME)}</title>
<link rel="icon" href="/favicon.ico">
<style>
  :root { --primary: #264ea0; --primary-dark: #1b3a78; --ink: #0f1b3d; --muted: #5d6475; --canvas: #E9EFFA; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { min-height: 100%; }
  body {
    min-height: 100vh; display: flex; flex-direction: column;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
    color: var(--ink);
    background: radial-gradient(1100px 520px at 50% -60px, rgba(38, 78, 160, .10), transparent 70%),
                linear-gradient(180deg, #F8FAFE 0, var(--canvas) 900px);
  }
  .m-bar { background: var(--primary); padding: 16px 20px; display: flex; justify-content: center; }
  .m-bar img { height: 38px; width: auto; display: block; }
  main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 48px 20px 64px; }
  .m-inner { max-width: 640px; text-align: center; }
  .m-art { width: min(260px, 70vw); height: auto; display: block; margin: 0 auto 32px; }
  .m-art .arch { fill: none; stroke: var(--primary); stroke-width: 3; stroke-linecap: round; }
  .m-art .inner { fill: rgba(38, 78, 160, .07); stroke: var(--primary); stroke-opacity: .55; stroke-width: 1.5; }
  .m-art .scaff { stroke: var(--ink); stroke-opacity: .35; stroke-width: 2; stroke-linecap: round; }
  .m-art .floor { stroke: var(--ink); stroke-opacity: .35; stroke-width: 2; stroke-linecap: round; }
  .m-kick { font-size: 12px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: #2340a8; margin-bottom: 14px; }
  h1 { font-family: Georgia, "Times New Roman", serif; font-weight: 500; font-size: clamp(30px, 5vw, 46px); line-height: 1.15; text-wrap: balance; }
  .m-text { margin: 16px auto 0; max-width: 50ch; font-size: 16px; line-height: 1.65; color: var(--muted); }
  .m-actions { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 32px; }
  .m-btn {
    display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 28px;
    border-radius: 50px; border: 1px solid var(--primary); color: var(--primary);
    font-size: 14px; font-weight: 500; text-decoration: none;
    transition: background-color .25s, color .25s, transform .25s, box-shadow .25s;
  }
  .m-btn--solid { background: var(--primary); color: #fff; }
  .m-btn:focus-visible, .m-mail a:focus-visible { outline: 2px solid var(--primary); outline-offset: 3px; }
  .m-mail { margin-top: 18px; font-size: 14px; color: var(--muted); }
  .m-mail a { color: var(--primary); font-weight: 500; text-decoration: none; overflow-wrap: anywhere; }
  @media (hover: hover) {
    .m-btn:hover { background: var(--primary-dark); border-color: var(--primary-dark); color: #fff; transform: translateY(-2px); box-shadow: rgba(38, 78, 160, .22) 0 8px 18px; }
    .m-mail a:hover { text-decoration: underline; text-underline-offset: 3px; }
  }
  @media (max-width: 520px) { .m-btn { flex: 1 1 100%; } }
  @media (prefers-reduced-motion: reduce) { .m-btn { transition: none; } .m-btn:hover { transform: none; } }
</style>
</head>
<body>
  <header class="m-bar"><img src="/aci-logo.png" alt="${esc(SITE_NAME)}" width="180" height="60"></header>
  <main>
    <div class="m-inner">
      <svg class="m-art" viewBox="0 0 260 210" aria-hidden="true" focusable="false">
        <path class="inner" d="M80 186 V100 A50 50 0 0 1 180 100 V186 Z"/>
        <path class="arch" d="M66 186 V98 A64 64 0 0 1 194 98 V186"/>
        <g class="scaff">
          <line x1="44" y1="186" x2="44" y2="70"/><line x1="216" y1="186" x2="216" y2="70"/>
          <line x1="44" y1="120" x2="216" y2="120"/><line x1="44" y1="70" x2="216" y2="70"/>
          <line x1="44" y1="120" x2="66" y2="98"/><line x1="216" y1="120" x2="194" y2="98"/>
        </g>
        <line class="floor" x1="20" y1="186" x2="240" y2="186"/>
      </svg>
      <p class="m-kick">Scheduled maintenance</p>
      <h1>We&rsquo;re refurbishing our website.</h1>
      <p class="m-text">We&rsquo;re making a few improvements and will be back shortly. The studio is open as usual &mdash; call, WhatsApp or email us and we&rsquo;ll get back to you.</p>${actions}
    </div>
  </main>
</body>
</html>`;
}

async function respond(withBody) {
    if (!isOn()) {
        // Never linked while the switch is off; behave like any unknown URL.
        return new Response(withBody ? "Not Found" : null, {
            status: 404,
            headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" },
        });
    }
    const html = page(await contactDetails());
    return new Response(withBody ? html : null, {
        status: 503,
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Retry-After": retryAfter(),
            // Never cache the "back shortly" page anywhere: once the switch is
            // off, the real pages must come straight back.
            "Cache-Control": "no-store, max-age=0",
            "X-Robots-Tag": "noindex",
        },
    });
}

export function GET() {
    return respond(true);
}

export function HEAD() {
    return respond(false);
}
