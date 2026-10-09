# Deploying to Vercel — checklist

Status (2026-10-01): **planned, not deployed.** The site runs on localhost today. Content and
photos live only in Sanity; nothing content-like is in the repo. This page is a checklist —
nothing here has been done on Vercel yet.

## Build settings

| Setting | Value |
|---|---|
| Framework preset | Next.js |
| Build command | `npm run build` (the default) — it runs the `prebuild` hook, which empties cached Sanity answers so every build reads Sanity fresh |
| Output directory | default (`.next`) |
| Install command | `npm ci` |
| Node.js | 20.x or newer |

**`npm run build:safe` is not for Vercel.** It was written for the old self-hosted server: it
builds into `.next-a` / `.next-b` in turn, switches a `.next-live` pointer only when the build
succeeded, and can restart pm2, carry the image cache over and warm the photos — so a failed
build never took the running `next start` down. Vercel does all of that itself (a failed build
never replaces the live deployment; its CDN caches the photos), and `build:safe`'s output is not
in `.next`, so it would break a Vercel build. Keep it for local / self-hosted use only. `npm start`
and `npm run images:warm` are not used on Vercel either.

**Do not set `NEXT_DIST_DIR` on Vercel** (it moves the build output; `build:safe` uses it locally).

## Environment variables (names only — never paste values into the repo)

| Name | Where | Needed on Vercel |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | public — inlined into the browser bundle (it is not a secret) | **yes** — without it the build stops |
| `NEXT_PUBLIC_SANITY_DATASET` | public | **yes** (`production`) |
| `RESEND_API_KEY` | server-only (contact form, `api/contact`) | **yes** |
| `CONTACT_FROM` | server-only, optional (has a default) | recommended — a Resend-verified domain sender |
| `CONTACT_TO` | server-only, optional (has a default) | optional |
| `SANITY_REVALIDATE_SECRET` | server-only (`/api/revalidate`, the Sanity webhook) | **yes**, once on-demand revalidation is live |
| `MAINTENANCE_MODE` | build-time switch (`1` = maintenance page) | only during maintenance — see "Maintenance mode" |
| `MAINTENANCE_BYPASS_SECRET` | server-only (owner's bypass link) | recommended — set once, harmless when off |
| `MAINTENANCE_RETRY_AFTER` | server-only, optional (seconds, default 3600) | optional |
| `SANITY_WRITE_TOKEN` | local scripts only | **NO** — see below |
| `SANITY_STUDIO_PROJECT_ID` | the Studio only | no |
| `NEXT_DIST_DIR`, `PORT`, `WARM_URL`, `IMAGE_CACHE_MAX_MB`, `IMAGE_CACHE_MAX_AGE_DAYS` | local / self-hosted scripts | no |

Set each one for Production (and Preview, if previews should build) in Vercel → Project →
Settings → Environment Variables.

### The Sanity write token stays local

`SANITY_WRITE_TOKEN` is used only by `scripts/project-photos.mjs` (`npm run photos:upload`) and
`sanity/scripts/backup.mjs` (`npm run sanity:backup`), both run on your own computer. The site
never reads it: in `src/` it appears only in a comment in `lib/content/sanity.js`, which reads
Sanity without any token (the dataset is public; published documents only). It has no
`NEXT_PUBLIC_` prefix, so it can never be inlined into the browser. **Do not add it to Vercel** —
nothing there needs it, and a token that is not deployed cannot leak from a deployment.

## Sanity CORS origins

The site never calls Sanity from the browser: pages are built on the server, and photos reach
visitors through our own `/_next/image`. **So the site needs no CORS origins** — not for the
production domain, the custom domain, or preview deployments.

- The hosted Studio (`*.sanity.studio`, `npm run sanity:deploy`) is allowed by Sanity
  automatically; the local Studio is `http://localhost:3333` (with credentials — it logs in).
- Only if the Studio were ever **embedded in the site** (a `/studio` route) would the site's exact
  domains need adding, **with credentials** — the production domain and the custom domain, never
  a wildcard like `https://*.vercel.app` with credentials (any Vercel site would then be trusted).

## Photos: `/_next/image` and what it costs on Vercel

**Why photos go through `/_next/image`, not Sanity's image CDN.** A deliberate owner decision
(2026-09-25), for privacy: the visitor's browser never contacts `cdn.sanity.io`, so the privacy
policy can say images are served from our own website with no third party. It is not about
watermarks (those are in the photo files) and it does not hide asset addresses (the Sanity URL is
visible in the `url=` parameter).

**Vercel's limits** (vercel.com/docs/image-optimization/limits-and-pricing, read 2026-10-01):

- Hobby: 5,000 transformations / month — and Hobby is for **non-commercial use only**, so this
  business site needs **Pro**.
- Pro: on demand, $0.05–$0.0812 per 1,000 transformations; cache reads $0.40–$0.64 per 1M and
  writes $4.00–$6.40 per 1M (8 KB units).
- A transformation is billed only on a cache MISS / STALE. The cache key is the source URL + width
  + quality + the browser's image format; redeploys do not clear it; the lifetime follows Sanity's
  long `max-age` (Sanity photo URLs are content-addressed, so a changed photo is a new URL).

**Estimate.** 1,082 photos are shown (173 main photos, 909 gallery). A main photo is requested at
about 8 sizes (tiles, cards, previews, hero, viewer), a gallery photo at about 4; nearly every
browser takes AVIF. Filling the cache once is about 5,000–6,500 transformations (~$0.30–0.50 on
Pro); after that, new uploads plus rarely seen sizes dropping out of the cache, about 1,000–3,000
a month (~$0.10–0.25). Cache reads and writes are cents. Negligible next to the Pro plan itself.

**Switching to Sanity's CDN** (a custom `next/image` loader with the already-installed
`@sanity/image-url`) would make Vercel's image cost zero, but every visitor's browser would then
contact `cdn.sanity.io` — reversing the privacy decision and requiring a privacy-policy change —
and it changes `next.config.mjs`, the photo viewer, the /projects hover preview and the client-logo
URLs. **Decided (owner, 2026-10-01): stay on `/_next/image`** — photos are stored in Sanity and
delivered through the site on Vercel. Do not switch to Sanity's CDN without the owner's approval.

## On-demand revalidation (the Sanity webhook)

Every Sanity answer is cached under one tag, `sanity`, with a 1-hour fallback
(`src/app/lib/content/sanity.js`). When a document is published, changed or deleted, Sanity calls
`POST /api/revalidate` (`src/app/api/revalidate/route.js`), which checks the signature and marks
the tag stale. Each page that read Sanity — home, /projects, brand, project and state pages,
`sitemap.xml` — is rebuilt in the background on its next visit, including the OLD brand / state
page when a project moved or was deleted. Without the webhook, pages still refresh within an hour.

**Create the webhook** (once the site is on Vercel):

1. Pick a secret: a long random string (e.g. 40+ characters from a password manager).
2. Vercel → Project → Settings → Environment Variables → add `SANITY_REVALIDATE_SECRET` = that
   secret, for **Production** (and Preview if you want previews to accept webhooks). Redeploy so
   the running site has it.
3. sanity.io/manage → your project → **API** → **Webhooks** → **Create webhook**:

   | Field | Value |
   |---|---|
   | Name | `Revalidate website` |
   | URL | `https://<your production domain>/api/revalidate` (the custom domain once it is live, e.g. `https://www.archcreativeinteriors.com/api/revalidate`) |
   | Dataset | `production` |
   | Trigger on | **Create**, **Update**, **Delete** |
   | Filter | `!(_id in path("drafts.**"))` — published documents only (leave the document types open: every type the site shows is covered) |
   | Projection | `{_type, _id, "slug": slug.current}` |
   | Status | Enabled |
   | HTTP method | `POST` |
   | API version | `v2021-03-25` |
   | Include drafts | **off** |
   | Secret | the same secret as step 2 |

4. Save, then publish any small change in the Studio. In the webhook's **Attempts log** the call
   should show `200` with `{"revalidated":true,…}`. A `401` means the two secrets differ.

The `staging` dataset needs no webhook unless a separate staging site is deployed — then create a
second webhook (dataset `staging`) pointing at that site.

## Maintenance mode

Normal releases need no maintenance page: Vercel switches to a new version only after its
build succeeds, every branch gets a preview link to check first, and **Deployments → (previous
version) → Instant Rollback** undoes a bad release in seconds. Sanity edits go live without
downtime. Use maintenance mode only for a real outage (a big rebuild, a domain move).

**Turn it on**

1. Vercel → Project → Settings → Environment Variables (Production):
   - `MAINTENANCE_MODE` = `1`
   - `MAINTENANCE_BYPASS_SECRET` = a long random string (once; you can leave it set)
   - optional `MAINTENANCE_RETRY_AFTER` = seconds crawlers should wait (default `3600`)
2. Deployments → the current deployment → **Redeploy**. The switch is read at build time, so
   it takes effect when that build finishes (about a minute).
3. To see the real site meanwhile, open
   `https://<domain>/api/maintenance-bypass?key=<your secret>` — it sets a 12-hour cookie in
   that browser. `/api/maintenance-bypass?leave` removes it.

**Turn it off:** delete `MAINTENANCE_MODE` (or set it to anything but `1`) and **Redeploy**.

**What visitors and Google get:** every page answers **503 Service Unavailable** with
`Retry-After`, `Cache-Control: no-store` and `X-Robots-Tag: noindex` — the signal that the
outage is temporary, so search rankings are kept. The page (`src/app/maintenance/route.js`)
shows the logo, a short note and the phone, WhatsApp and email from Site settings. Still
served normally: `/_next/*`, `/api/*` (the Sanity webhook and the contact form), and every file
with an extension (logo, icons, `robots.txt`, `sitemap.xml`). Keep it short — a 503 for hours
or a day is fine; after several days Google starts dropping pages.

**Cost when off:** none. With `MAINTENANCE_MODE` unset `next.config.mjs` adds no rewrite and
there is no Proxy, so no code runs per request.

Locally: add `MAINTENANCE_MODE=1` to `.env.local`, restart `npm run dev` (or rebuild), and remove
it afterwards.

## Before the first deploy

- `perf/3g-optimisation` is not merged into this line yet — merge it if those changes should go
  live.
- Add security headers in `next.config.mjs` (there is no nginx on Vercel).
- Set the environment variables above; then create the Sanity webhook (on-demand revalidation).
