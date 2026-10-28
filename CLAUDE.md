@AGENTS.md

# Arch Creative Interiors — website

Marketing / portfolio site for a Delhi-NCR interior design firm (salon, commercial, residential).
SEO-focused, `en-IN`, no auth. The full history — Phases 1–27, the SEO work log, and the backstory
of every rule below — is in `docs/archive/CLAUDE.full.md`. Search it before re-deriving anything.

## Stack
- Next.js 16.4.2 App Router (upgraded from 16.2.4 on 2026-10-26 for security fixes), React 19.2.4, Node >= 20.9. **Next 16 breaks training-data habits**:
  `params` is a Promise (`const { id } = await params`); read `node_modules/next/dist/docs/` first.
- JavaScript / JSX only — keep new files `.js`/`.jsx`. Next reads `tsconfig.json` (so `jsconfig.json`
  and its `@/*` alias are inert); nothing uses `@/`, imports are relative.
- npm. Icons: prefer `lucide-react` (`react-icons` is legacy). Toasts `react-toastify`. Email `resend`.
- **Hosting: Vercel (planned; the site currently runs on localhost). Content and photos: Sanity.**
  Photos are delivered through the site's own `/_next/image` (resized by Vercel), never straight
  from `cdn.sanity.io` — owner's decision, re-confirmed 2026-10-01 (privacy; cost negligible).
  Vercel build command `npm run build` (keeps the `prebuild` hook); a failed Vercel build never
  replaces the live deployment. Checklist (env vars, token, CORS, images): docs/vercel-deploy.md.
  *(Outdated, 2026-10-01: the DigitalOcean VPS / nginx / `git pull && npm run build` /
  `build:safe` + pm2 deploy notes. That server is not used.)*

## Commands
- `npm run dev | build | start` — the site. `build` is the only gate: no tests, lint or CI.
- `npm run sanity:dev` — Studio on :3333 (standalone, not a route in the app).
- `npm run build:safe [-- --restart "<cmd>"]` — **local / self-hosted only, never Vercel's build
  command** (its output is not in `.next`). Builds into `.next-a`/`.next-b` in turn, and only after
  SUCCESS points `.next-live` at it; `npm start` (scripts/start.js) serves that folder (plain
  `.next` when there is no `.next-live`). A failed build changes nothing running. Never rename
  these folders — Next bakes the folder name into the build. Written for the old VPS (outdated);
  `npm start` and `images:warm` are not used on Vercel either.
- `npm run check-photos` — read-only, no token: brands with / without photos, projects to shoot.
- `npm run projects:content [-- --dataset staging] [--apply] [--audit]` — each project page's
  Overview / Challenge / Solution / Features, written from the project's own data
  (scripts/project-content/). Dry run by default (full text + report saved to
  C:\dev\project-content\); fills EMPTY fields only, never overwrites; `--apply` needs an explicit
  `--dataset`, skips projects with an open Studio draft, refuses on any validation failure.
- `npm run photos:upload` — the owner's photo folders → Sanity (optimized, EXIF/GPS stripped,
  staged in `C:\dev\project-photos-optimized`, never in the repo). Dry run unless `--apply`;
  never removes/reorders images, skips duplicates, writes published docs. Plan: docs/project-photos-plan.md.
- `npm run sanity:backup` — `sanity dataset export` (documents, drafts, images) to
  `C:\Backups\arch-sanity\`, newest 8 kept. Weekly: Task Scheduler "Arch Creative - Sanity backup".
- `node scripts/optimize-images.js` after adding a site asset to `public/` (content images go to Sanity).
- Archived in Phase 6 (they worked on the local content): `projects:import`, `sanity:seed`,
  `sanity:scaffold`, `sanity:import`, `sanity:pages`, `logos`, `logos:sharpen` — see `archive/`.

## Layout
```
src/app/            routes, api/contact, components/, styles/ (one CSS file per component, all
                    imported in layout.js — every stylesheet is global)
  lib/content/      THE data layer — the only code that reads content (all from Sanity, no local
                    fallback): sanity.js (client), queries.js, one getter module per area,
                    stats.js (derived counts), image.js. Pages import from "lib/content".
                    See DATA_SOURCES.md.
  lib/map/          India map geometry + city coordinates (code, not content)
  lib/site.js       SITE_URL / SITE_NAME / SITE_DESCRIPTION — configuration only
  lib/contact.js    every phone format derived from the typed number
sanity/             the Studio: schemas/, scripts/backup.mjs
archive/            everything moved out in Phase 6 (old local content, images, tools) — not deleted
sanity.config.js, sanity.cli.js   must stay at the repo root (the CLI resolves config from cwd)
scripts/            asset / data generators
docs/               HANDOFF.md (current state + open decisions — read it), vercel-deploy.md,
                    project-photos-plan.md, project-field-map.md; SESSION_HANDOFF.md and
                    PRODUCTION-READINESS-REPORT.txt are September history (VPS era); archive/
```
Project photos come from the owner's folders via `npm run photos:upload` (straight to Sanity) or
are added in the Studio. Nothing content-like is kept in the repo.

## Standing rules
These apply to every agent working here, not only Claude (AGENTS.md points here).
- **Never commit, push, merge or deploy unless the owner asks.** Work on branches; do not merge
  anything until the owner says so.
- **Never delete anything.** A file that is no longer wanted moves to `archive/` at the same path
  (e.g. `src/app/styles/x.css` → `archive/src/app/styles/x.css`).
- **Never print `RESEND_API_KEY` or any `.env.local` value.** The key is live and unrotated. Do not
  edit or copy `.env.local` either; list variable NAMES only.
- **Do not touch `C:\dev\arch-creative-website`** (the previous site's code), nor `node_modules/`,
  `.next/` or `.sanity/`.
- **Port 3000 is the owner's IDE dev server — never kill it.** Run production checks on 3100
  (`npx next start -p 3100`) and confirm `curl -s localhost:3100/ | grep -c next-devtools` is `0`.
  Stop such a test server only by matching its command line (`*next*start -p 3100*`). Build
  checks into a separate folder (`NEXT_DIST_DIR=.next-build`) so the dev server's `.next` is left
  alone — Next then appends `.next-build/types` lines to `tsconfig.json`; never commit those.
- **Git** (2026-10-09): the repo is `github.com/archcreativeinteriors/aci-website`. Its `main` is a
  single fresh commit (no old history) pushed from the local branch `new-main`, which tracks
  `origin/main` — **work from `new-main`**. The 11 older local branches (`page-titles-descriptions`,
  `main`, `perf/*`, …) carry the previous account's history and ~250 MB of old photos: **never
  push them, and never `git push --all`.** This repo commits as "Arch Creative Interiors"
  (repo-local `user.name` / `user.email`), and its remote URL names the `archcreativeinteriors`
  user so Git signs in with that GitHub account.
- **Sanity content goes live on its own** (owner, 2026-10-01; it was "only on a rebuild"): every
  Sanity answer is cached under the tag `sanity` with a 1-hour fallback (`lib/content/sanity.js`),
  and the Sanity webhook → `POST /api/revalidate` (signed with `SANITY_REVALIDATE_SECRET`) marks
  it stale. Setup: docs/vercel-deploy.md. Under `npm run dev` the revalidate is 0 (every load
  reads Sanity fresh — there is no webhook locally and the dev fetch cache lives on disk, so an
  hour hid Studio edits even across restarts; 2026-10-07). Vercel's environment MUST have the same
  `NEXT_PUBLIC_SANITY_*` values: since Phase 6 there is no local content, so without them the build
  stops (and on Vercel the previous deployment stays live).
- **Maintenance mode** (2026-10-07): `MAINTENANCE_MODE=1` at build time → `next.config.mjs`
  rewrites every page to `/maintenance` (`src/app/maintenance/route.js`, a route handler so it
  can answer 503 + Retry-After; self-contained HTML). Owner bypass:
  `/api/maintenance-bypass?key=<MAINTENANCE_BYPASS_SECRET>`. Off = no rewrite and no Proxy, on
  purpose (a Proxy would run on every request). Steps: docs/vercel-deploy.md.
- **Always `npm run build`, never a bare `next build`.** Its `prebuild` hook
  (`scripts/clear-fetch-cache.js`) empties `.next/cache/fetch-cache`; without it Next reuses the
  previous build's cached Sanity answers (1-year lifetime) and Studio edits never appear.
- **No dot in a Sanity document `_id`.** A dotted id is PRIVATE: the Studio shows it, the site's
  public reads never see it. Use `<type>-<slug>` (projects: `project-<listNo>`).
- **No writes to Sanity** (`--apply`, `sanity deploy`, dataset import) without the owner's OK.
  Test any workflow on the `staging` dataset first — never on production while testing.
  `npm run photos:upload -- --apply` writes to whatever `NEXT_PUBLIC_SANITY_DATASET` says
  (production in `.env.local`); it does not ask for `--dataset`, so pass it deliberately.
  Keep photos out of the repo: the pushed history is ~23 MB and should stay small.
- **`npm run build` does not exercise `scripts/` or `sanity/scripts/`.** After touching one,
  run it (dry run) before relying on it.
- **A `staging` dataset exists** (copy of production, 2026-09-28) for testing changes before
  production: build against it with `NEXT_PUBLIC_SANITY_DATASET=staging`.
- Write real commit messages (the old history was all "add"); one topic per commit.
- Owner decisions — don't reverse them: no GA4; keep `@vercel/analytics` mounted (behind consent);
  CTAs and the floating buttons stay as they are; the project TOTAL appears nowhere on the site (nor
  any share-of-total %), and state pages show no counts; real locations only; the three phone
  fields are separate channels — don't consolidate (2026-10-07: call button = WhatsApp =
  95992 99980, 95992 99979 retired; the site shows TWO call numbers, call button's first then
  the contact number, via `contact.callNumbers` in lib/contact.js; JSON-LD keeps only the
  contact number); the 0124 landline is gone; FAQ copy ships
  only after owner approval; never invent the Grievance Officer's name; the headline cities /
  states / spaces numbers are TYPED in Site settings, not derived (2026-09-24).

## Conventions (don't regress)
- Server Components by default. Content must be complete with no JS; client components only
  layer behaviour on top, and controls that need JS are mount-gated out of the SSR HTML.
- `<ScrollReveal>` is CSS-based. Never reintroduce a framer-motion `opacity: 0` reveal.
- Exactly one `<h1>` per rendered page.
- List order: a new PROJECT shows at the TOP (`listNo` descending; the txt and the Studio both
  give it the next number), a new CLIENT logo at the BOTTOM (appended to the last row).
- Images: `import` local assets and set `alt`, `sizes`, `fill`/dimensions (client logos are the
  exception). Sanity images render via `<CmsImage>`/`<SanityImage>` through our own
  `/_next/image` — NEVER an `<img>` pointed at `cdn.sanity.io` (a third-party request the privacy
  policy says does not happen; owner, 2026-09-25) — and must query `lqip`. Any `q` must be in
  `images.qualities` (75, 90) or Next 16 answers 400.
- Every route exports metadata (title, description, `alternates.canonical`, openGraph); no
  `keywords`. Detail pages are SSG; a missing slug calls `notFound()`.
- JSON-LD: breadcrumbs pair with a visible `<Breadcrumbs>` using the same `items`; no
  `reviewRating` / `aggregateRating`; FAQPage only where the FAQ is visible (`/about`). No
  `Review` nodes at all (2026-10-09): the testimonials review this business itself, which
  Google excludes as self-serving.
- **Legacy redirects** (`next.config.mjs`): `/services/salon|residential|commercial` → `/services#<slug>`
  (2026-10-27 — the detail pages were folded into /services; file in `archive/src/app/services/`), and
  (2026-10-09) 17 project URLs of the previous live site
  whose slug changed are 308'd to the matching page. Never remove them, and never rename a
  project slug in the Studio without adding a redirect the same way.
- NAP: address, hours, email and phones all from `getSiteSettings()`; never hard-code any of them.
  It must match the Google Business Profile exactly.
- Header clearance is only `body { padding-top }` in `globals.css` (96px, 64px at ≤767px; the nav is 64px since 2026-10-07 — the mobile menu `top`, `#main-content` / `#all-projects` scroll-margins, the home `.preview` sticky top and the toast offset follow it).
- Global CSS collisions have bitten this repo eight times. Verify styling by measuring the rendered
  box or screenshotting, not by reading CSS; scope with `>` and beware specificity TIES.
- The floating button tower is four files hand-tuned per breakpoint: move one, re-derive all four.
  `.footer-bottom`'s wide right padding reserves its column.
- Sections alternate via `data-tone`; check for adjacent repeats after adding a section.
- Consent gate: no third-party request (Google Maps) before consent; banner and scrim never in SSR
  HTML; images are first-party (Sanity's included, via `/_next/image`) and are not gated.
- The India map must draw the official boundary (northernmost point ~37.08°N) — a legal
  requirement. `STATE_PATHS` and `CITY_POINTS` are regenerated together, never edited alone.
- Headings Newsreader, everything else Geist. Loading a font? Check a CSS rule names it.

## Open issues
- **ALL content is in Sanity (Phase 6, 2026-09-28)** and the site reads nothing else — see
  DATA_SOURCES.md. 16 types; a project has a page when its Status is "published" (40 today).
  `clientDisplayConsent` is still UNTICKED on every project until the owner confirms each client.
  The old local files, tools and images are in `archive/`.
- **Pending owner decisions:** the 1,179-photo upload (`npm run photos:upload`, dry run in
  docs/project-photos-plan.md); #5 The Bimini Road was changed in the Studio to Salon/"Salon" (it
  is a restaurant in the What-we-do copy) and #7 Naturals Retail→Salon — intended?
- **Owner-blocked:** rotate
  `RESEND_API_KEY`; confirm a contact-form test email arrives; 18 clean photographs (the rest
  carry a trial watermark); confirm 24-month retention; Grievance Officer's name; approve FAQ
  additions; two guessed logo names (`ps`, `rain`); legal review of `/privacy-policy`, `/terms`.
- **Code:** `next` upgraded to 16.4.2 on 2026-10-26 (`npm audit --omit=dev`: 0 vulnerabilities;
  the Studio dev tooling still has some, owner to decide); no security headers in `next.config.mjs` (there is no nginx on Vercel —
  add them in `next.config.mjs` before launch); no
  `global-error.js`; no `engines` field; the site email (Site settings) is a Gmail address;
  `CONTACT_FROM` is not a verified domain. With the project ID set, a Sanity outage during a
  build FAILS it, with a plain "Sanity could not be reached" error (`sanityFetch()`, by design:
  photos live only in Sanity) — on Vercel a failed build never replaces the live deployment.
- **Project pages:** title = Page title (else name), location = Location on the project page
  (else Location), category derived from Format; the meta title/description are built from the
  project's own name, place and format (the Overview is pasted on several pages, and ~150 have
  none) — every page's title and description is unique (2026-10-05); the three `-2` pages
  sharing a name and address with another get "(2)" until given their own Page title in the
  Studio; the four text sections (Overview / Challenge / Solution / Features) are stored in
  Sanity, written ONCE per project by `npm run projects:content` (2026-10-08) — an empty field
  gets a last-resort line from `fallbackCopy()` in lib/content/projects.js, never a blank
  section and never runtime AI; 23 hand-written texts are still pasted verbatim on several
  projects (4 groups) — kept unless the owner approves `--replace-shared`; gallery
  placeholders only when the gallery is empty. JSON-LD Organization/CreativeWork point at
  `/og-image.jpg`, which does NOT exist in public/ (pre-existing; only og-image-landscape.jpg does).
- **Unscheduled:** per-route CSS splitting (~13 KB; only with per-route visual checks);
  `react-icons` → `lucide-react`; a11y 93 (`.tN` caption contrast, footer link target size).
