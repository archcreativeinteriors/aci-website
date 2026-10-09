@AGENTS.md

# Arch Creative Interiors — website

Marketing / portfolio site for a Delhi-NCR interior design firm (salon, spa, commercial,
residential). Content-driven, SEO-focused, single locale (`en-IN`). No auth, no user accounts.

## Stack

- **Next.js 16.2.4** App Router, **React 19.2.4**. Node **>= 20.9**.
- JavaScript / JSX only. TypeScript is configured (`tsconfig.json`) but unused and `strict: false`.
  Keep new files in `.js` / `.jsx` to match the codebase unless a change is explicitly a TS migration.
- Package manager: **npm** (`package-lock.json`). Scripts: `npm run dev | build | start`.
- Animation: `framer-motion`. Counters: `react-countup`. Toasts: `react-toastify`.
- Icons: both `lucide-react` and `react-icons` are in use — prefer **`lucide-react`** for new code.
- Email: `resend` (contact form only).

## Deployment

Self-managed **Ubuntu VPS on DigitalOcean** (BLR1), **nginx** reverse proxy → a Node `next start`
process. **Not Vercel**, despite `@vercel/analytics` in the tree. Deploy is manual:
`git pull && npm ci && npm run build` then restart the Node process (PM2 / systemd / cPanel app).

Implications:
- The API route runs in a **long-lived Node process**, not serverless — connection pools are fine.
- Env vars live in `.env.local` on the server (or the host's app-manager UI). `.env*` is gitignored —
  never commit secrets. Read today: `RESEND_API_KEY` (required); `CONTACT_FROM` / `CONTACT_TO`
  (optional — override the contact-email sender/recipient; `CONTACT_FROM` should be a
  Resend-verified domain, not the `onboarding@resend.dev` fallback).
- `next.config.mjs` has the bare-domain → www redirect; consider `output: "standalone"` for a
  slimmer deploy.

**Planned migration to Vercel + Sanity (owner decision, 2026-09) — not done yet.** The site is
almost entirely SSG so it is a good fit, but this is a migration, not a continuation:
- The `redirects()` bare-domain → www rule in `next.config.mjs` currently overlaps whatever nginx
  does. On Vercel nginx is gone and `next.config.mjs` becomes the only place it happens — check
  it is not also configured as a Vercel domain redirect, or the two will fight.
- The API route stops being a long-lived Node process and becomes a serverless function. Nothing
  in `api/contact/route.js` holds state or a pool today, so it should port unchanged.
- Env vars move from `.env.local` on the VPS to the Vercel dashboard. `.env.example` lists what
  is needed. `NEXT_PUBLIC_SANITY_*` must be set at **build** time, not just runtime.
- **`.git` is a 258.91 MiB pack against a 23 MB `public/`** (Phase 26 measured it precisely: `public/images/` blobs are 258.1 MB of history — 95.3% — while all source code is 1.8 MB) — the 24MP originals are still in history
  (`optimize-images.js` only ever shrank the working tree, and re-encoding passes each added a
  fresh copy: `public/images/projects` has 8 versions in history, `team` 7). Vercel clones this
  on every build. With 86 commits all messaged "add", a `git filter-repo --path public/images
  --invert-paths` before the rebuild is cheap and drops it to a few MB — but it rewrites every
  SHA and needs a force-push to `archcreativeinteriors/aci-website`, so only while there is a single committer.
  **Do it before the Sanity migration starts, not after.**

## Layout of the code

```
src/app/
  layout.js            root layout — imports ALL 24 css files globally (was ~29 before the Phase 26 sweep), mounts Navbar/Footer/etc.
  page.js              home — composes 13 sections (static imports) each wrapped in <ScrollReveal>;
                       order is deliberate (see SEO work log Phase 10.8)
  globals.css, page.module.css
  robots.js            generated robots.txt (references the sitemap)
  sitemap.js           generated sitemap.xml — static routes + every project/blog/service
  not-found.js         custom 404 (real 404 status + noindex) — rendered by notFound() and
                       for any unmatched URL; links back to the main sections
  about|blogs|projects|services|costing|clients/   route segments
    blogs/[id]  projects/[id]  services/[slug]   detail pages — all SSG (generateStaticParams)
  projects/page.js      **typographic index, not a grid** (execution plan v5 §7) — one row per
                        project: name · city · state tag · year · arrow, newest first, top 6
                        badged "Recent". Replaced the thumbnail grid: at 192 near-identical
                        salon interiors a grid reads as a dump.
                        **All 192 rows, newest first — the owner's list read bottom-to-top**
                        (Rawls Salon #192 first, Esskay Beauty Resources #1 last). The order
                        comes from `listNo` in `data/projectsData.js`, sorted descending, NOT
                        from array position — so the sort survives any re-generation.
                        Rows are plain server-rendered <Link>s and are complete with **no JS**;
                        `components/ProjectIndex.jsx` only layers the cursor-following photo
                        on top (one delegated listener, not 192). Never move row content into
                        that client component — see Phase 10.11.
                        **Year headings appear only when >1 distinct year exists**
                        (`hasMultipleYears`). Every seed record currently reads "2025", which is
                        placeholder data — §13 lists year_completed as outstanding for all 187
                        rows. Fill the column and the headings turn on by themselves.
                        Canvas is white: it was white-on-#264ea0, but §14 specifies the row name
                        turns *accent blue* on hover, which is invisible on a blue background.
  projects/brand/[brand]/page.js   one page per brand — every project for that brand, SSG
                        (66 pages, `generateStaticParams` over `brandsByCount()`). This is
                        what the home "The brands we build for" tiles open.
                        **A static route, not a `?brand=` query on /projects** — reading
                        `searchParams` there would make the prerendered index dynamic on
                        every request. Each brand gets a canonical, shareable, indexable URL
                        that works with JS disabled; a client-side filter would not.
                        Slug comes from `brandSlug()` in `lib/projectStats.js` (derived, not
                        stored — brand names carry "&" and apostrophes). Verified
                        collision-free across all 66; **two brands colliding would silently
                        merge two collections into one page rather than erroring**, so
                        re-check if brands are added.
                        Rows reuse `components/ProjectRow.jsx` — the same component
                        /projects renders. Not the demo's 4-up card grid: §16 means most
                        rows have no photograph, and Geetanjali alone would be 104 empty
                        tiles.
  clients/page.js       full logo wall — all 82 client logos + a dashed "You can be here"
                        CTA tile → /contact. In navbar + footer nav + sitemap; home
                        "Trusted By" links here.
                        **`lib/data/clientLogos.js` `clientLogoRows` IS the layout** — an
                        array of rows, each an array of `{ src, width, height }`, matching
                        the company-profile PDF page for page (`// ── PDF page N` marks the
                        breaks). **A row's length is how many logos render in it** (2, 3 or
                        4), so the grid reproduces the PDF's varying density rather than
                        forcing a uniform 3-up. Move a line between rows to re-sequence;
                        change a row's line count to change its density. Nothing else to
                        update — `clientLogos` / `allClientLogos` are `clientLogoRows.flat()`
                        (derived, not a second list to keep in step — that split bit us once).
                        The grid is **12 columns**; `data-cols` (the row length) picks the
                        span via CSS (1→12, 2→6, 3→4, 4→3), and every row sums to exactly 12
                        so a row can never straddle two lines. `wide: true` (UPS only) adds
                        `.client-tile--wide` for a taller band on its full-width row.
                        At ≤768px the whole thing collapses to a straight 2-up wall — the
                        PDF's 4-up rows are unreadable at phone width.
                        Each logo sits in a fixed-height `.client-logo` band that scales with
                        the row density (2-up 132px / 3-up 108px / 4-up 94px on desktop), so
                        mismatched marks size evenly — don't go back to letting them render
                        at natural size. `width`/`height` must match the real files;
                        `npm run logos:sharpen` rewrites both (see Conventions).
                        **Gotcha:** a media query adds no specificity, so every `[data-cols]`
                        rule has to be overridden by an equally-specific `[data-cols]` rule
                        inside the breakpoint — a plain `.client-tile` loses to it regardless
                        of source order.
  about/page.js         **the single company page.** Who we are (+ the 1000+/20+/98% stats)
                        · Founder · "How a project runs" (5 stages) · The team (the 6 real
                        people from Team.jsx, with photographs) · Common questions.
                        **/studio was merged in here (Phase 22) and 308s to it** — the two
                        repeated the founder's name, both paragraphs and his quote word for
                        word. Do not recreate a second one.
                        The FAQ is `<details>/<summary>`, not a JS accordion — a click-gated
                        accordion would hide every answer without JS (Phase 10.11) *and* make
                        the FAQPage schema on this page dishonest.
                        Sections use the `sd`-prefixed classes in `styles/studio-page.css`
                        (name kept after the merge): the reference demo's own names collide
                        with `faq.css` (`.faq`) and `how-we-work.css` (`.step-*`), and every
                        stylesheet is global.
  contact/page.js       real /contact page — two-column: NAP/hours info panel + <Contact> form,
                        then <StudioLocation>. No breadcrumb. Neutralizes <Contact>'s section
                        styling via `.contact-page .contact` overrides in styles/contact.css.
  privacy-policy/, terms/   draft legal pages — see Known issues (need legal review)
  api/contact/route.js  POST → Resend email
  components/*.jsx      presentational sections; "use client" only where hooks/motion are needed
  components/JsonLd.jsx  tiny helper: renders a <script type="application/ld+json"> (escapes "<")
  components/Breadcrumbs.jsx  visible breadcrumb trail; pass it the same `items` used for
                              breadcrumbJsonLd() so the visible trail and schema can't diverge
  lib/
    site.js             SITE_URL / SITE_NAME / SITE_DESCRIPTION + BUSINESS (NAP/geo/hours) +
                        CALL_NUMBER / WHATSAPP_NUMBER (separate real channel numbers)
    jsonld.js            builders: organizationJsonLd / breadcrumbJsonLd / faqJsonLd / articleJsonLd
                        / creativeWorkJsonLd / reviewJsonLd
    projectSource.js    **the only module that knows where project data comes from.**
                        Index rows come from `data/projectsData.js` (the owner's 192-row
                        list, generated by `npm run projects:import`); photo/copy/detail
                        pages come from `data/projects.js` for the 34 rows that have one,
                        joined on `detailSlug`. A row without a `detailSlug` renders as
                        inert text — never emit an <a> to a page generateStaticParams does
                        not build. `data/projectRoster.js` + `scripts/build-projects.js` +
                        `scripts/data/project-list.txt` were superseded (179
                        screenshot-transcribed rows, ~17 short) and were DELETED in
                        Phase 26. Nothing should read a roster again.
                        Maps data/projects.js into the shape the Sanity schema defines
                        (execution plan v5 §12) — slug/projectName/brand/sector/city/state/
                        yearCompleted/tier/heroImage. When Sanity lands, ONLY the two
                        functions at the bottom of this file change (local map -> GROQ).
                        getProjects() index-ordered · getPublishedProjects() (no
                        placeholders — use for generateStaticParams/sitemap) · getProject()
                        Also derives `state` from the free-text `location` via a city map,
                        since data/projects.js has no state field.
    data/*.js           ALL site content is hardcoded here (see below)
  styles/*.css          one file per component/section, all imported in layout.js
scripts/
  optimize-images.js   downscale/re-encode oversized public/ images in place (see Conventions)
  generate-favicon.js  rebuilds src/app/{favicon.ico,icon.png,apple-icon.png} from the ACI
                       monogram in public/aci-logo.png (needs `png-to-ico`, a devDep)
  process-logos.js     `npm run logos` — client-logo processing (pre-existing)
  upscale-client-logos.js  `npm run logos:sharpen` — re-sources public/images/new-clients/*
                       from the sharper originals in public/images/all-clients/, trims the
                       baked-in padding, re-pads slightly, and syncs the width/height in
                       lib/data/clientLogos.js (see Conventions)
```

**All Sanity work lives in two folders, and they are NOT interchangeable** (reorganised
2026-09-23 — it used to be scattered across nine locations):

```
sanity/                    THE STUDIO — ships with `sanity deploy`, the site imports none of it
  README.md                the map of both halves; read it first
  schemas/                 brand.js · project.js · index.js
  scripts/                 scaffold.js · import.js  (npm run sanity:scaffold | sanity:import)
  content-pack.md          owner-facing hand-over instructions
src/app/lib/cms/           THE WEBSITE'S READ LAYER — ships with `next build`
  client.js                sanityFetch() + isSanityConfigured()
  image.js                 URL builder + the per-instance next/image loader
  queries.js               the GROQ projections
```

The split follows the **deployable**, not the vendor name: the Studio is standalone, not a
route in the Next app, so the site's runtime data layer must not sit inside a folder that
deploys to `<projectId>.sanity.studio`.

**The app-side folder is `cms/`, NOT a second `sanity/`.** It was briefly the latter and
two identically named folders in one repo is a navigation trap — it was the first thing
that got flagged. `cms` also describes the job: `projectSource.js` is the only module that
knows where project data comes from, so what sits behind it is the CMS read layer, and the
name survives if the CMS is ever not Sanity.

**`sanity.config.js` / `sanity.cli.js` stay at the REPO ROOT, and this was tested rather
than assumed.** `sanity build` has no `--config` flag; the CLI resolves config from the
cwd. With both files moved into `sanity/`, running from the root gives
`ProjectRootNotFoundError: No project root found`, and running from inside `sanity/` gives
`Failed to read "…/sanity/package.json"` — the CLI treats the config's directory as the
project root and wants a `package.json` beside it. Moving them in therefore means making
`sanity/` a **separate npm package** plus `cd sanity` in three npm scripts. Not worth it;
they sort next to `sanity/` at the root anyway. Both were restored byte-identical after
the experiment and `npx sanity build` re-verified.

**⚠ `npm run build` DOES NOT COVER THE TWO SCRIPTS.** They resolve the repo root as
`path.resolve(__dirname, "..", "..")` — two levels, because they sit at `sanity/scripts/`.
The 2026-09-23 move broke both (`ROOT` was still one level) and **the build stayed green**;
it surfaced only on `npm run sanity:scaffold`. Re-run both dry runs after moving either
file. Expected: scaffold reports 192 projects / 66 brands, import reports 192 with a
details.txt and `with a YEAR: 0`.

## The content pack — how project photographs and copy come in

**`../sanity-import` (a SIBLING of the repo, never inside it)** is the hand-over format for the
owner's ~960 project photographs and their written details. `sanity/content-pack.md` at the repo
root is the owner-facing instructions; this is the engineering summary.

- **`npm run sanity:scaffold -- --apply` generates it**: 192 project folders + 66 brand folders,
  each project pre-filled with a `details.txt` template carrying its own name, brand and location.
  Generated, not hand-made, because the import **joins on the folder's NUMBER PREFIX**
  (`080-` → `listNo` 80), not its name — one transposed digit files a Lucknow salon's photographs
  under a Gurugram one, and the import still succeeds, because `080` is a valid number.
  Safe to re-run: it never overwrites an existing `details.txt` unless `--force`.
- **It lives outside the repo on purpose.** ~5 GB of camera originals, against a `.git` that is
  already a 258 MB pack of exactly this kind of file. One `git add -A` would make it permanent.
- **Per project**: `hero.jpg` (required to publish) · `01.jpg`, `02.jpg` … gallery · `before-NN.jpg`
  · `details.txt`. Any other image filename is reported and skipped — including `1.jpg`.
- **`details.txt` labels**: `CONSENT` `YEAR` `AREA_SQFT` `DURATION_WEEKS` `SCOPE` `CREDITS`
  (single-line) · `OVERVIEW` `CHALLENGE` `SOLUTION` `TESTIMONIAL` (blocks) · `FEATURES` (`- ` list).
  `CONSENT: yes` + a hero + the file is what flips a project from draft to published.
- **⚠ THE PARSER CAPTURES EVERY LINE AFTER A LABEL UNTIL THE NEXT KNOWN LABEL**, so the template
  must carry ALL its guidance ABOVE the first label, where it is discarded. The first version put
  a `# explains the next field` comment between each pair and the dry run reported
  **"with a YEAR: 192"** — every file had `YEAR` set to `# Built-up area in square feet, digits
  only`. That would have written a line of instructions into 192 documents. Adding a field means
  adding its explanation to the legend at the top, never inline.
- **Batches are the intended workflow, not a workaround.** Document ids are deterministic
  (`project.<listNo>`, `brand.<slug>`), so re-importing updates rather than duplicates.
- **Verified end to end** by filling one folder in a throwaway copy of the pack: 192/192 folders
  join, 0 errors, and a filled project produces `_id project.80`, a `brand.geetanjali` reference
  and correctly typed `yearCompleted` / `areaSqft` / `features`. Do this in a COPY — a test
  project left in the real pack is fabricated content sitting in the owner's hand-over folder.
- **Still outstanding before the first `--apply`**: no Sanity project exists
  (`NEXT_PUBLIC_SANITY_PROJECT_ID` empty, no `SANITY_WRITE_TOKEN`); the git history rewrite should
  run FIRST (see Deployment); and only `brand` and `project` have schemas — the importer reports
  and skips every other folder type rather than inventing a document type.

## Content model — everything is a static JS module in `src/app/lib/data/`

- `projects.js` (~1200 lines) — array of project objects. Images are `import`ed from
  `public/images/watermark-images/` and passed to `next/image` (enables `placeholder="blur"`).
  Shape: `{ id, displayOrder, title, location, image, category, year, area, client, desc,
  challenge, solution, features[] }`. `id` is the URL slug for `/projects/[id]`.
  Lists are sorted by `displayOrder` ascending.
- `selected-projects.js` — DELETED in Phase 26. It held the 4 featured items for the home
  Portfolio section, and `Portfolio.jsx` was its only importer. The home page now uses
  `selectedProjects()` in `lib/projectStats.js`, which filters the 192-row list to rows with a
  `detailSlug` — so Home can never show an unphotographed project.
- `blogs.js` — `{ id, title, image, date, author?, category, excerpt, metaDescription?,
  relatedService?, content: [{ heading, paragraphs[] }] }`.
  `date` is a plain string ("June 12, 2026") — `jsonld.js` parses it for `Article.datePublished`.
  `author` (optional string, e.g. "Ms. Shivani Rawat") shows in the blog byline and becomes a
  `Person` in the Article JSON-LD. `excerpt` is the longer on-page teaser (card + intro paragraph);
  `metaDescription` (optional, ~150 chars) is what `<meta description>`/OG/Article JSON-LD actually
  use — falls back to `excerpt` if omitted, so always add one for a new post (Google truncates
  around 155–160 chars). `relatedService` (optional service slug: `salon`/`residential`/`commercial`)
  drives the end-of-post CTA block on `blogs/[id]`. `content` paragraphs are plain strings — no
  inline links/lists (a content-model limitation, not just a convention).
- `testimonials.js` — `{ name, role, text }`.
- `faqs.js` — `[{ q, a }]`. Rendered by `components/FAQ.jsx` **and** emitted as FAQPage JSON-LD on
  the home page — always import, never copy.
- `demo.js` — DELETED in Phase 26 (stray scratch notes, never imported).
- `services.js` — **single source of truth for all service content.** `services` = the 3 that
  have detail pages (`{ slug, icon, title, tagline, label, image, description, features[],
  process[] }`; `icon` is a key mapped to a lucide component in each consumer).
  Consumed by `services/page.js`, `services/[slug]/page.js` (+ its
  `generateStaticParams`/`generateMetadata`), and `sitemap.js`.
  The former `homeServices` export — the 4 broader items for the home "Our Services" list —
  was DELETED in Phase 27 along with its only consumer, `components/Services.jsx` (Phase 26).
  The home page's service section is now `components/home/WhatWeDo.jsx`, which derives its
  counts from the project data rather than reading a second list.

To add a project/blog/testimonial: add the image to the right `public/images/...` folder, add an
`import` + object to the data file. No build step or CMS. New projects/blogs/services are picked up
by `generateStaticParams` and `sitemap.js` automatically — no separate slug list to maintain.

## Known issues / gotchas (fix opportunistically, don't regress)

- **Next.js 16 has breaking changes vs. training data** (see AGENTS.md). `params` is a Promise —
  `const { id } = await params`. Read `node_modules/next/dist/docs/` before using an unfamiliar API.
- **768px is the desktop / mobile line for the whole header + hero.** `Navbar.jsx` renders a
  `.topbar` (address/phone/email, from `BUSINESS`) above the main nav — no scroll collapse.
  **Shown at ≥768px** (`.navbar` then sits at `top: 32px`); at ≤767px the topbar is
  `display:none`, `.navbar` moves to `top: 0`, and the three floating buttons cover contact.
  All three topbar items show at every width ≥768 (they fit). This has flip-flopped a couple of
  times (hidden <768 → shown everywhere → hidden <1024 → **hidden <768**, current).
- **Floating buttons** — four of them, `position: fixed` in one right-hand column, mounted in
  `layout.js`, **one CSS file each** (`whatsapp-btn.css` / `call-button.css` / `email-button.css` /
  `scroll-top.css`). Stack bottom-up: **WhatsApp · call · email · scroll-to-top**
  (email is `#c0392b`, `IoMail`, `mailto:BUSINESS.email`; scroll-top only appears past 400px of
  scroll). Positions are hand-tuned per breakpoint in each file (desktop / ≤768 / ≤480), so a
  button's `bottom` must clear the one below it (`bottom + height`) **at all three breakpoints** —
  there is nothing enforcing this, and nothing four separate files can tell you. This has broken
  twice: call + WhatsApp both at `bottom: 18px` in the 481–768 band, and scroll-top overlapping
  email on desktop while sitting exactly on top of WhatsApp at ≤768. Current bands (px from the
  viewport bottom): desktop 25/100/170/240 → tower 298px; ≤768 18/100/182/264 → 334px;
  ≤480 30/95/155/215 → 267px; all at `right: 18px` (25 on desktop). **If you resize or reposition
  any one of them, re-derive all four.** The tower is tall — if a fifth button is ever added,
  move scroll-to-top to the bottom-left instead of extending the column.
  Note the failure mode: a collision here doesn't look like a collision, it looks like a *missing*
  button — WhatsApp (`z-index: 1000`) covered scroll-top (`999`) exactly, so scroll-top simply
  never appeared on any 481–768px viewport while looking fine on desktop.
  `ScrollTop.jsx` also calls its scroll handler **once on mount** — browsers restore scroll
  position on reload/back-nav without firing a scroll event, so without that the button stays
  hidden on an already-scrolled page.
- **Navbar breakpoints** (`styles/navbar.css`, all `max-width` unless noted): topbar hidden at
  ≤767; the **6**-link row + CTA collapse to the hamburger at **1024px**. Blogs was dropped from
  `NAV_LINKS` to the footer (owner's call, 2026-09), so the row is one link shorter than the
  breakpoint was tuned for — 1024 is therefore safe but no longer tight, and could likely go back
  to 992. **Verify by measuring a real browser at 1025–1200px before changing it**; it has been
  wrong in both directions before, plus a `≤1200px` tighten block
  (gap 22, 12px links, 38px logo, smaller CTA). `.mobile-menu` opens at `top: 122px` (768–1024,
  topbar still there) or `top: 90px` (≤767). **If you add/remove a nav link, re-check the
  1025–1200px range** — that's the tight band.
- **The contact form has a REQUIRED agreement checkbox, directly above the submit button**
  (owner, 2026-09-22). `.form-consent-check` in `Contact.jsx` / `contact.css`.
  - **It replaced a passive "By submitting, you agree to our Privacy Policy" line that sat
    BELOW the button** — which asks for agreement after the decision is made and gives the
    visitor nothing to act on. The checkbox is in the tab order immediately before the button
    it gates, and links both `/privacy-policy` and `/terms`.
  - `consent` lives in the same `form` state object but is **not sent to the API and not
    stored** — it is an on-screen affirmation. `handleChange` had to learn checkboxes
    (`type === "checkbox" ? checked : value`); `.value` on a checkbox is the literal "on",
    which would have made the box permanently truthy. The reset after a successful send clears
    it too, or the next enquiry starts pre-agreed.
  - Validated **last**, after name/email/phone/projectType, so nobody is asked to agree to
    terms before the form they are agreeing about is even valid. Failure is the same
    `toast.error` pattern as every other field, not native `required` — the other four fields
    do not use it and a browser tooltip mid-way through a toast-based form is a different UI.
  - **TWO GLOBAL-CSS COLLISIONS, both found by screenshotting the form, not by reading CSS.
    They have DIFFERENT mechanisms and therefore different fixes — do not reach for "add
    specificity" on both.** Seventh and eighth time this repo has hit the trap.
    1. **Scope, not specificity.** `.contact-box span` is the card's "GET FREE CONSULTATION"
       eyebrow; the descendant selector also matched the `<span>` inside the new label, so it
       rendered as 11px uppercase letter-spaced grey. Raising `.form-consent-check`'s
       specificity would NOT have helped: that rule sets font on the `<label>` and the span only
       INHERITS it, and **a directly-matching rule always beats an inherited value at any
       specificity.** The fix has to remove the match — `.contact-box > span`. The eyebrow is a
       direct child, so unlike the `.secEyebrow` case the `>` fix works here.
    2. Worse, and subtler: `.contact-form input { width: 100% }` and `.form-consent-check
       input` are **both (0,1,1)** — a TIE, decided by source order, and the generic rule is
       further down the file. The checkbox rendered **384px wide** and crushed its label into a
       63px column overflowing the card. Fixed with `input[type="checkbox"]` (0,2,1), which
       wins on merit rather than position, plus an explicit reset of the text field's padding /
       border / background.
    **A tie is the dangerous case** — it looks like a working selector and moving an unrelated
    rule can flip it. Measure the rendered box (`getBoundingClientRect`) rather than trusting
    that a rule "should" apply.
  - Verified over CDP without sending mail (**`window.fetch` stubbed — the Resend key is live**
    and unrotated): unticked submit reaches the API **0 times** and shows "Please accept the
    Privacy Policy and Terms to continue"; ticked submit calls `/api/contact` once and the box
    resets. Checkbox confirmed before the button in the DOM *and* above it on screen.
- **CONSENT GATE: no third-party request fires until the visitor agrees (owner, 2026-09-22).**
  `lib/consent.js` is the contract · `components/CookieConsent.jsx` is the banner (and exports
  `ConsentSettingsButton`, the footer's reopen control) · `components/MapEmbed.jsx` replaces both
  Google Maps iframes · `components/ConsentedAnalytics.jsx` wraps `<Analytics />` ·
  `styles/cookie-consent.css`.
  - **WHAT WAS MEASURED, because the word "cookies" is misleading here.** Chrome net-log against
    a production build: `/contact` fired **146 requests to Google-controlled hosts**
    (`maps.googleapis.com` 112, `www.google.com` 23, `maps.gstatic.com` 11), and the footer map
    put that on **every one of the 140 routes**. A fresh profile persisted **ZERO cookies**. So
    the thing being consented to is the **third-party request** — it hands Google the visitor's
    IP before they asked for a map — not a cookie. After the gate: `maps.googleapis.com` and
    `maps.gstatic.com` are **0**. The residual `www.google.com` hits are Chrome's own startup
    traffic — **confirmed with an `about:blank` control run that produced the same hosts**.
    Copy on the site says "loaded from Google", not "we use cookies", for this reason.
  - **`loading="lazy"` never solved this.** Phase 9 added it and it only delayed the request
    until the footer scrolled into view. It is kept on the iframe for when consent IS given.
  - **THE GATE CARRIES A DECORATIVE PHOTOGRAPH (owner, 2026-09-22)**, so it reads as a designed
    panel rather than an empty grey box. `hero4.jpg`, rendered `fill` behind a
    `rgba(12,22,48,.62 -> .74)` scrim with the text, button and link above it on `z-index: 2`.
    - **IT IS NOT A PHOTOGRAPH OF THE STUDIO AND MUST NOT BECOME ONE BY ACCIDENT.** There is
      no studio photo in the repo — the only files matching "studio" are client brand logos
      (Geetanjali Studio). A project interior placed under "Visit Our Studio" beside the street
      address would read as the studio itself: the Phase 20.6 mistake, and what spec §26
      forbids. It is therefore `alt=""` + `aria-hidden` — decoration, announced to nobody,
      asserting nothing. If a real studio or shopfront photograph arrives, swap the import.
    - `og-image-landscape.jpg` was the obvious candidate and is **unusable here**: it has the
      "ARCH CREATIVE INTERIORS / www…" watermark and a logo badge baked in, which fight the
      gate's own text. Checked by looking at it.
    - **The two gates now share ONE theme.** They used to be coloured separately for the
      footer's blue and StudioLocation's light card; both now sit on the same photo behind the
      same scrim, so a second theme would only be a second thing to keep in step.
    - Cost, measured: the footer gate is a 261px box on all 140 routes and pulls **w=360, 9 KB
      AVIF**, lazy and below the fold; the 800px studio gate pulls w=750, 29 KB. `sizes` is
      `300px` when `compact`, else `(max-width: 992px) 100vw, 720px` — audited against the
      rendered boxes, not guessed.
  - **Images are NOT gated and must not be.** Every photograph is first-party from
    `/_next/image` off local files — no cookie, no third-party request. Gating them would blank
    the site and wreck LCP for zero privacy gain. **The one future exception is `cdn.sanity.io`**
    (already in `images.remotePatterns`, no project yet): when project photography moves there it
    becomes a real third-party host and belongs behind ALL, alongside the map.
  - **Three states, and the no-JS one is the reason this is safe.** With no JS, or before mount,
    `MapEmbed` renders `.mapGate` — copy plus a real `<a>` to `BUSINESS.mapsUrl`, so directions
    always work. The "Load map" button and the banner and "Cookie settings" are all
    **mount-gated and absent from the SSR HTML** (verified: 0 occurrences), because a control
    that cannot act is worse than no control (Phase 16.1).
  - **"Load map" is per-instance and never touches the cookie.** Verified over CDP: clicking it
    loads that ONE map, leaves the footer's gated, and after a reload both are gated again.
  - **`/contact`'s map is 460 / 400 (≤992) / 320 (≤768) px tall** (owner, 2026-09-22; was
    550/450/350 — it stood taller than the address card beside it). `StudioLocation` renders on
    `/contact` ONLY, so `.location-map` is not shared with any other route.
    **All THREE blocks must list both `.location-map iframe` AND `.location-map .mapGate`.**
    The ≤768 block originally resized the iframe alone, leaving the placeholder on the ≤992
    height — a 100px jump on phones the moment the map loaded, which is the exact drift the
    shared box rule exists to prevent. Verified after: gate height == loaded map height at
    1440 / 1280 / 992 / 768 / 375, zero shift at every one.
  - **The gate and the iframe share ONE box rule** — `.mapGate` was added to the existing
    `.footer-map iframe` and `.location-map iframe` selectors (and the ≤992 height override) in
    `footer.css` / `studio-location.css`, rather than being given its own size in
    `cookie-consent.css`. Two rules that must stay equal are one rule; if they drift, accepting
    shifts the layout. Add new map geometry there, not to `.mapGate`.
  - **The banner is bottom-LEFT with `right: auto`** because the floating button tower owns the
    right edge (298/334/267px tall at three breakpoints — see the floating-buttons entry). Below
    768px it spans the gutters and does cover the lower buttons while open; that is accepted, it
    is one click to dismiss. Don't move it up — a consent bar mid-screen reads as an error.
  - **Accept and Decline are the same size and the same weight.** Only the fill differs. A loud
    Accept beside a greyed-out decline is the pattern regulators single out.
  - **IT IS A BLOCKING MODAL (owner, 2026-09-22).** `.ccScrim` dims and blurs the page until
    Accept or Decline is chosen — z-index 1001, over the floating button tower (1000) and under
    the dialog (1002), so the WhatsApp/call/email buttons dim with everything else rather than
    floating brightly over a dimmed page.
    - **THE SCRIM MUST NEVER REACH THE SSR HTML.** It is rendered by the same mount-gated
      component as the banner, so it cannot — but a server-rendered scrim with no JS to remove
      it would lock every visitor out of the entire site, which is the worst bug this file
      could ship. **Verified 0 occurrences of `ccScrim` across 13 page types**; re-check that
      if the render gating is ever touched.
    - **Clicking the scrim does NOTHING, and Escape does nothing.** Dismissing on an outside
      click would record no choice while looking like it had; there is no "cancel" for a
      question with two free answers. Both verified: dialog stays open, cookie stays empty.
    - **Focus moves into the dialog and is trapped**, or a keyboard user would be tabbing
      around a page they can neither see nor click. Focus lands on the CONTAINER
      (`tabIndex={-1}`), not on Accept — landing on a control makes it look pre-selected and
      skips the sentence saying what is being agreed to. The container is index 0 of the trap
      cycle so shift-Tab from it wraps to the last control. Measured cycle: Privacy Policy ->
      Accept -> Decline -> dialog -> Privacy Policy. Focus returns to the previously focused
      element on close.
    - Scroll is locked with `body:has(.ccScrim)`, matching how `navbar.css` locks it for the
      mobile menu. Progressive: without `:has` the page still scrolls behind the scrim, untidy
      but not broken.
    - **A real mouse click must still reach the buttons** — the scrim is full-viewport and it
      would be easy to ship one that swallows them. Hit-tested at 1280 and 375:
      `elementFromPoint` over Accept returns `.ccBtn`, and a dispatched click writes the cookie.
    - This is the site's **third** non-user-triggered animation (after the hero cross-fade and
      `.cbFill`) and the only one that fires on arrival. `prefers-reduced-motion` drops the fade
      but KEEPS the scrim — hiding it would unblock the page, which is not what that preference
      asks for.
    - **SEO:** Google exempts legally-required consent dialogs from the intrusive-interstitial
      demotion, which is why blocking is safe here. Do not extend the same treatment to a
      marketing pop-up.
  - **THE BANNER COPY IS DELIBERATELY GENERIC (owner, 2026-09-22).** It reads "Cookies /
    We use cookies and content from other services to run this site and to see how it is used."
    plus a Privacy Policy link. An earlier version named Google, the map and the IP address it
    carries — accurate, but it read as an essay at the moment of first contact. **The detail did
    not disappear, it moved** to the two places it is useful: the privacy policy, and the map's
    own `.mapGate` placeholder, which explains itself where the map would have been. Keep the
    banner to one sentence; if a category is added, add it to the policy, not to the bar.
  - Cookie is `aci-consent=<version>:<all|essential>`, 180 days, `SameSite=Lax`, `Secure` only on
    https (a Secure cookie is silently dropped on `http://localhost` and the banner would then
    reappear on every page). A version bump invalidates old answers so the banner re-asks.
  - **`<Analytics />` is gated too, and it is currently dead weight anyway** — `@vercel/analytics`
    beacons to `/_vercel/insights/*`, a path only Vercel's edge serves, and this site is on the
    VPS. Gated so the policy can make one claim with no exception in it.
  - **THE PRIVACY POLICY MOVES WITH THIS.** Its cookies section asserted "this site does not ask
    you to accept a cookie banner" — false the moment this shipped. Rewritten, along with "Who
    we share it with", which still said the map was on "our contact and studio pages" (the
    footer map has been site-wide since Phase 18). If the categories change, `lib/consent.js`,
    the banner copy and that section change together.
  - Verified after: build green (140 pages), all **132 sitemap URLs** 200, one `<h1>` each, zero
    heading skips, **0 iframes and 0 banner markup in SSR on all 132**, all 132 carrying the
    gate, 135 internal links / 0 broken; and the full flow driven over CDP — Accept loads both
    maps live without a reload and survives a reload, Decline keeps them gated, "Cookie
    settings" reopens the banner and changing the answer takes effect immediately.
- **The desktop nav's hover effect is ONE travelling underline — no glow, no pointer light**
  (owner, 2026-09-22). `.nav-links::after` is a 2px white bar that rests under the current
  page's link and slides to whichever link the pointer is over; `--pill-x` / `--pill-w` are
  measured by `Navbar.jsx`, the easing lives in CSS.
  **Two things were removed and should not come back without the owner asking:**
  a `.nav-links::before` radial "spotlight" — two stacked white gradients that eased toward
  the cursor on a rAF loop, with `.is-lit` and `--spotlight-x` driving it — and a
  `box-shadow: 0 0 12px 2px rgba(255,255,255,.45/.5)` on both the travelling and the static
  active underline. The JS went with the CSS: the effect no longer writes `--spotlight-x`,
  and `prefers-reduced-motion` is no longer read there (it only ever gated the light).
  `mouseleave` is still bound — it is what slides the underline back to the active link.
  **Verify a change here in the SERVED stylesheet, not the source**: grep the
  `/_next/static/chunks/*.css` bundle for `.nav-links` and for `box-shadow` on any `.nav*`
  rule. Both came back clean after this change, and the shipped JS contains `--pill-x` and
  zero `--spotlight-x`.
  The static per-link underline (`.nav-links a::after`, 1px, width 0→100% on `li:hover`) is
  still there and is deliberate — it is what a no-JS reader gets, and
  `.nav-links.has-pill` zeroes it once the travelling one is measured, so there are never two.
- **`.footer-bottom` has an ASYMMETRIC right padding that reserves the floating button tower's
  column — do not trim it back to `20px`.** `padding: 20px 92px 20px 20px`, and `20px 78px` in
  the ≤600px block.
  The tower (WhatsApp / call / email / scroll-top) is `position: fixed` to the bottom right of
  the **viewport**, so at the end of the document it sits on top of the footer's legal row.
  **Measured across seven widths after "Cookie settings" was added as a third item: below
  1400px the last item lands under the tower, and at 1280px and below `elementFromPoint`
  returned `.whatsapp-btn` instead of the link** — the control was genuinely unclickable at
  1280, 1024, 768 and 375. 92px clears `right: 25` + a ~56px button; 78px clears `right: 18` +
  a ~50px one. Re-measure both if any floating button is resized or repositioned.
  **This was latent before** — `Terms & Conditions` sat in the same spot — so it is not only
  the new link that this fixes. It is also the fix that does NOT touch the tower, whose four
  files are hand-tuned per breakpoint (see the floating-buttons entry above).
- **Nav clearance is one rule, not per-page padding.** `globals.css` `body { padding-top: 122px }`
  (32px topbar + 90px nav), dropping to **90px at ≤767px** where the topbar is hidden — these two
  rules are the *only* thing clearing the fixed header; every page relies on them.
  Don't also add nav-clearance padding to an individual page/section; that double-counts. A page's
  own top padding (e.g. `.about`, `.blogs-page`) is purely extra visual breathing room on top of
  the body rule, not a second clearance mechanism. If the header's total height ever changes,
  change it in exactly one place: this `body` rule (+ its `@media (max-width: 767px)` pair).
- Internal navigation uses `next/link` throughout (Navbar/Footer from `NAV_LINKS` / `FOOTER_LINKS`
  arrays; Hero, Services, blog cards, service cards, detail-page CTAs all converted). Only
  **same-page hash anchors** (`<a href="#contact-form">` in `Hero`) stay as `<a>`. Use `next/link`
  for any new internal navigation.
- `api/contact/route.js` — hardened (P6): server-side validation, HTML-escaped interpolation,
  real status codes (400/500/502), no raw `error` echo, plaintext + `replyTo`. Sender is
  `Arch Creative Interiors <onboarding@resend.dev>` unless `CONTACT_FROM` (a verified domain) is
  set — the explicit display name stops the "From" inheriting the Resend account owner's personal
  name (that Resend key belongs to a teammate's account). Local `.env.local` has only
  `RESEND_API_KEY`; `CONTACT_FROM` / `CONTACT_TO` live on the server.
- `home page.js` imports the `/about` **route** as a component (`<About embedded />`); its
  `export const metadata` is dead in that context. The `embedded` prop switches the section
  heading between `<h1>` (standalone `/about`) and `<h2>` (on the home page) — see `about/page.js`.
- All 24 CSS files load on every route via `layout.js` — no per-route CSS splitting.
- **`/privacy-policy` and `/terms` are starting drafts (P7)**, built from what the codebase actually
  does (Resend, Vercel Analytics, the Maps embed) — not legal advice. Have a lawyer/CA confirm the
  DPDP-specific sections (retention period, grievance process) before relying on them, especially
  before running paid ads (Google/Meta require a reachable privacy policy to approve campaigns).
- **Three phone numbers, owner-confirmed as intentional (2026-09)**: `BUSINESS.telephone`
  `+91 98111 41227` is the **primary line** — footer, topbar, `/contact`, and the Organization
  JSON-LD all use it. `CALL_NUMBER` (`+91 95992 99979`) and `WHATSAPP_NUMBER`
  (`+91 95992 99980`) are **separate real channels** on the floating buttons and stay as-is.
  All defined once in `site.js`; don't "consolidate" them.
  **The `0124` landline was REMOVED on the owner's instruction (2026-09-16)**, reversing the
  earlier decision to keep it as a secondary line. `BUSINESS.landlineDisplay` is gone, with it
  the Footer's second `tel:` link and `/contact`'s "Landline" sub-line. It was never in the
  JSON-LD. **If it is still on the Google Business Profile, remove it there too** — NAP has to
  match character-for-character and the site is now the odd one out.
- **NAP is defined once, in `BUSINESS` (`site.js`), and read from there everywhere** — Footer,
  Navbar topbar, `/contact`, `StudioLocation.jsx`, `privacy-policy`, the JSON-LD. Nothing hardcodes
  an address or phone. It must match the Google Business Profile character-for-character.
- **The PROJECT TOTAL is no longer shown anywhere on the site (owner, 2026-09-17).**
  `1000+ spaces delivered` (the h1) and `192 Documented` (a stat tile) sat in the *same block*,
  inches apart, on both Home and `/about` — one claim five times the other. The owner kept the
  headline and removed the total site-wide. Replacement copy is qualitative, by their choice.
  Removed from: the Home hero stat row (4 tiles → 3) · `/about`'s stat row (same, and
  `.about-stats` went `repeat(4,1fr)` → `repeat(3,1fr)` with the first tile spanning both columns
  inside the two breakpoints, so three items don't orphan) · `SelectedProjects`' "6 of 192" ·
  `/projects`' 76px `.pcountN` mega-number, with `.pcountL::before` (the hairline that joined
  number to label) and the 600px stacking block, all of which existed only to serve it ·
  `ProjectFilters`' "All 192" chip and "Showing N of N projects" (the unfiltered case now reads
  "Showing all projects", because `shown === total` there would have printed the number back) ·
  `/services`' lede · the brand and state CTAs' "All 192 projects" · Home's `description` and
  `og:description`.
  **Share-of-total percentages went with it** — BrandHero's "53% Of our work" and the state
  page's "· 32% of everything we have built". A percentage *of* the total encodes the total:
  104 ÷ 0.53 hands it straight back, and the wording asserts a figure the site no longer states.
  **Everything else still renders and is still derived** — cities (42), states (16), brands (66),
  the 16 "Where we build" bar counts, per-brand counts, the sector chips (185/6/1), format bars.
  Scope was the project total only.
  `PROJECT_STATS.projects` still EXISTS and is still passed to `ProjectFilters` — it is what
  distinguishes "unfiltered" from a real subset — but it must not reach the page. §7's
  "derive, never hard-code" rule is unchanged for every count it still covers; the answer to
  "how many projects" is simply that the site does not say. Don't re-derive it for consistency
  with the neighbouring tiles — that is exactly the conflict this removed.
  Verified by crawling all 132 sitemap URLs: zero occurrences in rendered HTML or in any
  `description` / `og:description` / `twitter:description`.

- **`/projects/state/[state]` shows NO counts and NO bar chart (owner, 2026-09-17).** This is
  the second pass of the removal above, extended to the page a state link opens. Three things
  went, on all 16 pages:
  the **"61 projects in 6 cities"** line under the `<h1>` · the **`.bfmtBars` brand chart** (a
  proportional bar and a count per brand, 35 rows on Haryana) · the **counts in
  `generateMetadata`'s description**, which otherwise asserted "61 interior projects" above a
  page that states no total — the same inconsistency the site-wide removal was about. The
  description now names up to three cities instead; cities are a fact, not a figure.
  The brand names briefly stayed as a plain `.covCopy` line, then **the whole "The brand(s) we
  build for here" section was removed too** (owner, same day) — heading, names and the derivation
  behind it. Stripped of its chart and its counts what remained was a section heading over a run
  of brand names, which on a single-brand state announced one word. Nothing is orphaned: every
  card in the grid names its own brand, and the 7 brands with collection pages have their own
  routes.
  **Then the page was merged to ONE header section** (owner, same day). It had a title block
  ("Delhi" + the city line) and a second full section headed "Every project in {state}" above the
  grid — two headings naming the same state, a hairline and ~200px of whitespace between them,
  and the second saying nothing the first had not. Now: eyebrow · `<h1>{state}</h1>` · city list ·
  grid, in one `.sec`. The "Every project in X" `<h2>` is gone, so the only `<h2>` left on the
  page is the CTA. The `band` hairline went with the merged section — with one section there is
  nothing for it to separate. **A section that carries the only rule between two blocks is worth
  checking before deleting it**; that was true at the intermediate step here.
  The city list uses `SectionHead`'s **`subtitle`** slot (stacked under the heading), not
  `description` (right-aligned on the heading's row by `space-between`). `description` looks
  deliberate beside "Haryana" and six cities and strands "Odisha"'s single city at the far end of
  a 1280px row — and six of the 16 states have one project. Checked by screenshotting the
  shortest and longest cases, not the average one.
  **`.bfmt*` is still live** — `components/brand/BrandFormatBreakdown.jsx` renders the identical
  chart on the 7 brand collection pages, and those were NOT in scope. Don't delete the CSS.

- **Two font families: `Newsreader` (serif) for HEADINGS ONLY, `Geist` (sans) for everything
  else.** Both declared in `layout.js`; the split is two rules in `globals.css` — `*` sets
  Geist, then an `h1..h6` rule (more specific, so no `!important`) sets Newsreader. Anything
  that wants the serif and is not a heading must name it: `.wwbHeading`, `.wwbCity` and
  `.wwbDotLabel` do.
  It was briefly Newsreader on *every element* (owner's call, reversed the same day) — a serif
  at 14–15px down the 192-row project index and across the legal pages reads materially worse
  than a sans.
  **The bug this uncovered is the part worth remembering.** `globals.css` asked for
  `font-family: "Poppins", sans-serif` and **Poppins was never loaded** — that declaration was
  its only mention in the entire repo, no `<link>`, no `next/font` call. So every page fell
  through to generic `sans-serif` and the site rendered in the browser default, Arial on
  Windows. Meanwhile `Geist` and `Geist_Mono` *were* loaded and shipped on all 131 routes and
  between them were named by exactly **one** CSS rule — two families downloaded per page to
  style nothing. Geist is back because a rule now names it; `Geist_Mono` is gone, nothing is
  monospaced.
  **Adding a family? Check a CSS rule actually names it.** That is the exact check Poppins and
  Geist each failed, in opposite directions, and neither failure was visible without measuring.
  Newsreader loads 400/500/600/700; fewer and the browser synthesises the rest, which smears a
  serif's stems.
- **EVERY section heading on the site is set like the "Where we build" one (owner, 2026-09-17):**
  Newsreader, weight **400**, `--heading-ink` (#0f1b3d), `clamp(34px, 4.4vw, 64px)`, with a small
  uppercase `--eyebrow` (#2340a8) label + 64px rule above it. `components/SectionHead.jsx` owns the
  markup (`<SectionHead eyebrow=…>` for a `.secHead` row, `<Eyebrow>` for a centred CTA block);
  `.secHead h2` + `.secEyebrow` in `home.css` own the type. `.wwbHeading` and the `.wwb` local
  tokens now **alias** the shared values instead of holding their own copies.
  - **The eyebrow's class is DOUBLED — `.secEyebrow.secEyebrow` — and that is deliberate.** The
    eyebrow is a `<p>`, and **nine** existing rules across six stylesheets match a `<p>` nested in
    the blocks it appears in (`.ctaBand p`, `.bcta p`, `.svpCta p`, `.location-header p`,
    `.about-content p` ×3, `.contact-hero p`, `.service-cta-box p`). All are (0,1,1) and beat a
    plain `.secEyebrow` (0,1,0), so it rendered as **16px grey body copy with its rule line still
    attached**. Doubling makes it (0,2,0). Rescoping the nine parents to `> p` — normally this
    file's advice — would BREAK several: `.ctaBand`'s description is not a direct child.
    **This was found by screenshotting the page, not by reading the CSS**: "GET ADVICE" came out
    grey where "PORTFOLIO" came out blue. It is the sixth instance of this trap here.
  - Same trap on the label's own spans: `.about-top span` / `.contact-hero span` /
    `.location-header span` set `color`, and `.secEyebrowRule` paints itself with
    `background: currentColor` — so they turned the new rule line grey. All three are scoped to
    `.secEyebrow > span:first-child` now.
  - **Six page titles were raised, because 64px section headings overtook them.** `.xhero h1`,
    `.svpHero h1`, `.about-top h1` and `.contact-hero h1` are all `clamp(42px, 6vw, 72px)`;
    `.secHead h1` is `clamp(40px, 5.6vw, 78px)`. Every term beats the h2's (40>34, 5.6>4.4,
    78>64), which is the point — **`.about-top h1` and `.contact-hero h1` were fixed-px step
    lists (64/54/46/36/30 and 40/30/26) that crossed BELOW the h2's 34px floor at phone width
    only.** Those steps were deleted, not re-tuned. Check any heading change at **1440, 1024 and
    375** — the /about and /contact inversions existed at 375 alone.
  - **NOT every `<h2>` is a section heading, and four kinds were deliberately left alone**:
    legal-page and blog-article document subheads (26 of them), card/row titles (blog cards,
    `/services` row titles, the `/projects` year headings), the footer column headings (12px on
    blue), and `.contact-box h2` — the contact form's card heading, where 64px inside a 460px
    card would break the form. `costing`'s `<h2>` is a price figure. Applying the style by a
    blunt `h2 {}` rule would have hit all of them.
  - `.secHead` is `align-items: flex-end`, not `baseline`: with an eyebrow stacked above, baseline
    aligned the right-hand description to the **eyebrow's** baseline, pinning the caption level
    with a 12px label instead of the heading it describes.
  - `.secHead > p` (not `.secHead p`) for the description, or it captures the eyebrow — the same
    collision, caught before it shipped this time.

- **SECTIONS ALTERNATE TINTED / WHITE on every multi-section page (owner, 2026-09-22).**
  `--tone-tint` (#E9EFFA, identical to `--bg`) and `--tone-plain` (#fff) in `globals.css`;
  the two rules live under "SECTION TONES" at the top of `home.css`. Both values were already
  on the site — the canvas tint and the white "Where we build" block — so this continues a
  rhythm that existed for two sections rather than introducing a colour.
  - **It is `data-tone`, NOT a class and NOT `:nth-of-type`.** `:nth-of-type` is the obvious
    implementation and is wrong here: sections are not consistent siblings. On Home they are
    direct children of `<main>`; on `/about` `<ScrollReveal>` wraps the intro in a
    `<div data-reveal>`, so `main > section:nth-of-type()` skips it and every stripe after it
    lands on the wrong block. **The rendered DOM of all 15 page types was dumped and read
    before choosing.** An attribute also cannot collide with the ~285 global class selectors
    that have caused six specificity accidents here, and matches `data-flip` / `data-cols`.
  - **This REVERSES the old "sections separate with a hairline, never with background colour
    blocks" rule.** `.band` still exists for untoned sections, but a toned section drops it —
    a hairline on top of a colour change reads as a seam. 9 `sec band` usages became 0 on the
    toned pages.
  - **Toned:** Home (6) · `/about` (5) · `/services` (4, the three rows from `i % 2` so adding
    a service cannot break the rhythm) · state pages (2) · brand pages (3) · `/contact` (1).
    **Verified by reading `data-tone` out of the rendered HTML of every page including all 66
    brand pages — zero adjacent repeats.** Do that again after adding a section; a conditional
    section that returns `null` is what would produce two tinted blocks in a row.
  - **NOT toned, and why:** `/projects`, `/clients`, `/costing`, `/blogs`, the legal pages and
    `/projects/[id]` are single-block pages — there is nothing to alternate. On `/contact` only
    `.studio-location` turns: `.contact-hero` (700px) and `.contact-layout` (980px) are
    **centred columns, not full-bleed**, so a background on them is a floating panel, not a
    stripe.
  - `.wwb` no longer hardcodes `background: #ffffff` — it carries `data-tone="plain"`, or that
    one section would stop tracking the pair the moment either value changed.
  - `.ctaBand` is deliberately outside the system: it is an inset floating block, already white
    (its own comment records that #E7ECF7 measured 1.02:1 on the tinted canvas and vanished),
    and it sits on the body tint with the page showing around it.
  - The pair is **1.15:1** — deliberately quiet. The body gradient `--bg-grad` is now mostly
    covered by opaque sections and only shows behind the hero.

- **The home "Where we build" section has been rebuilt three times. Read this before a fourth.**
  Bar chart (16 states, proportional bars, project counts) → photo cards + chips → the current
  India map with a derived state/city grid. Each rewrite deleted the previous CSS; `.cov*`,
  `.cb*`, `@keyframes cbGrow` and the whole `.wb*` set are gone. **`.covCopy` and `.covLink`
  survive on purpose** — `StudioBlock.jsx` and `projects/state/[state]/page.js` adopted them.
  - **The map is generated, not hand-drawn.** `scripts/generate-india-map.mjs` →
    `lib/data/indiaMap.js` (36 states, 4,766 points, 60 KB raw / ~22 KB gzipped).
  - **THE MAP MUST DRAW INDIA'S OFFICIAL BOUNDARY. This is a legal requirement, not a style
    preference.** Publishing a map of India without its full claimed boundary — Gilgit-Baltistan,
    Azad Kashmir, Aksai Chin — is an offence under the Criminal Law Amendment Act 1990 and the
    2021 Geospatial Guidelines. Source is `udit-001/india-maps-data`, filtered to its
    **state-level** features (that file holds districts *and* state outlines; the state ones
    have no `district` property, plus the single-district UTs where `district === st_nm`).
    **Verify any replacement by measuring the northernmost latitude: it must be ~37.08°N.**
    Everything else tried stops at **35.50°N** and is therefore unusable, however convenient:
    Natural Earth (CC0, clean, but de-facto boundary — and Pakistan has *zero* admin-1 units in
    the 50m file, so the missing territory cannot be merged back either), `geohacker/india` and
    `Subhash9325` (both GADM: 35.50°N, *and* GADM forbids commercial redistribution, *and* it
    still says "Orissa"/"Uttaranchal"), datameet (ships `.shp`, needs a parser dependency).
    ⚠ The chosen repo has **no LICENSE file** — published for reuse and government-derived, but
    not an explicit grant. Flagged to the owner; revisit if a licensed official-boundary source
    appears.
  - **`STATE_PATHS` and `CITY_POINTS` are ONE output.** The dots are pre-projected through the
    same Mercator fit as the outlines. Regenerating or editing either alone moves the dots off
    the map. Verify with the bbox check: every city point must fall inside its own state's
    bounding box (all 14 do).
  - **A flat simplification tolerance silently deletes small states.** At 0.035° Chandigarh
    collapsed below 4 points and vanished with no error. The generator retries per state at
    finer tolerances; Lakshadweep survives only on that path.
  - **The country outline is two stacked passes, not a dissolve.** A thick-stroked layer under
    a white-filled thin-stroked layer: internal edges get painted out, the coastline survives.
    Dissolving properly would need a topology dependency.
  - **The grid shows 8 of 16 states, so `.wwbAlso` links the other 8.** Without that line those
    pages lose every internal link on the site — they still return 200 and stay in the sitemap,
    so nothing looks broken; a full crawl dropping 131 → 123 pages was the only symptom. If the
    layout changes again, something must still link all 16.
  - **All 16 project states are TINTED on the map** (`.wwbMapStates path.isActive`), not just
    the 8 with a column — 14 dots on an otherwise blank map understates the coverage, which is
    what the old bar chart got wrong with "Odisha 1". A **flat** tint, never per-state
    intensity: shading Haryana darker than Odisha puts the removed ranking back in visual form.
    Matching is normalised through `isProjectState()`, because three vocabularies collide — the
    data says `J&K`, the state list says `Jammu & Kashmir`, the map says `Jammu and Kashmir`.
    Get that wrong and 15 of 16 tint, with a green build. **Ladakh is deliberately NOT tinted**:
    the J&K projects are in Udhampur, Jammu and Srinagar, and Natural Earth splits Ladakh out
    correctly.
  - **Locations are DERIVED.** The brief asked for Manesar, Udaipur, Mumbai, Bengaluru and
    Hyderabad under states including Karnataka and Telangana — the firm has projects in none of
    them and neither state is among its 16. It also filed Chandigarh under Punjab; in the data
    Chandigarh is its own UT. Owner's call (2026-09-17): real locations only. `CITY_COORDS` in
    `lib/data/locations.js` is the single edit point — a city needs a coordinate to appear,
    because every city carries a map dot.
  - **The map is pushed down 80px on desktop (`.wwbMapCol { padding-top: var(--s4) }`, owner,
    2026-09-23), and that padding is ZEROED below 1100px.** `.wwbInner` is `align-items:
    start`, so without it the SVG's top edge sat at exactly the same y as the 12px
    "WHERE WE BUILD" eyebrow — measured at 140px for both — while the left column ran **185px
    taller** than the map, so all the slack piled up underneath it. 80px drops the map below
    the heading's first line and halves that bottom gap; the section's own height does not
    change, because the map column is still the shorter of the two.
    **The reset matters as much as the padding**: below 1100px the map is `order: -1` and
    stacks ABOVE the text, where the same padding is just dead space at the top of the
    section. Verified at eight widths — 80px and a 190-220px offset from 1101px up, 0px and a
    64-110px offset from 1100px down, switching cleanly on that boundary.
  - **`Newsreader` is loaded for this section's headings only** (`--font-newsreader`, two
    weights). The brief wanted Newsreader *and* Figtree; Figtree's job is what Geist already
    does, so one family was added, not two, on all 131 routes.
  - It is a Client Component, and that is unavoidable: linking a city link to an SVG dot in the
    other column needs shared state. **Everything except the highlight is in the SSR HTML** —
    all 8 states, 14 city links with real hrefs, the full map and all 14 dots.
  - City links point at `/projects/state/[state]`, not the `"#"` the brief asked for. 14
    placeholder anchors on the home page is 14 dead controls (Phase 16.1).
  - **Pointing at a state name in `.wwbAlso` highlights that state on the map** (owner,
    2026-09-17), the same way a city link highlights its dot. Deliberately **one-way**
    (text → map): only 8 of the 16 tinted states have a link in that line, so making the
    polygons hoverable would give half the map a response and half of it none.
    `hotState` is a second piece of state, separate from `active` — one holds a city slug and
    the other a normalised state key, and a single variable holding either makes every
    comparison ambiguous. Matching goes through `stateKey()`, the same normaliser the tint
    uses; all 8 were verified to resolve to a real polygon, because a name that matches
    nothing highlights nothing **silently, with a green build**.
  - **A fill highlight does not work for small states, and a thicker stroke does not fix it.**
    Chandigarh is 4.4 × 3.4 user units — about **2 × 2 px** at the map's 560px render width.
    This was rasterised and looked at: at a 2.2 stroke the highlight is an invisible speck, and
    at a 5 stroke it is still an invisible speck. States under 25 user units get a **locator
    ring** instead (`smallStateMarkers` in `data/locations.js` → `.wwbHotMark`), reusing the
    city dots' ring so the map keeps one vocabulary for "this is what you are pointing at".
    Currently that classifies Lakshadweep, Delhi and Chandigarh; only Chandigarh can be hot
    today, and Delhi picks a ring up automatically if `STATES_SHOWN` ever drops it from the grid.
    The ring's centre is the bounding-box centre of the **already-projected path data**, never a
    fresh lat/long projection — `STATE_PATHS` and `CITY_POINTS` are one generated output and a
    second projection written by hand would drift from them on the next regeneration.

## Conventions

- Server Components by default; add `"use client"` only for hooks, `framer-motion`, or browser APIs.
- Wrap scroll-in sections in `<ScrollReveal>` (`ServiceReveal`/`AboutReveal`/`CostingReveal` are
  thin aliases of it). It's a **CSS-based** reveal — content is `data-reveal="idle"` (fully
  visible) in SSR; JS adds `armed` then `in`. Never reintroduce a framer-motion `initial={{opacity:0}}`
  reveal — that left the whole page blank on slow connections until the JS bundle loaded (Phase 10.11).
- One CSS file per component in `src/app/styles/`, added to the import list in `layout.js`.
- Images: `import` local assets (don't use string `src` for `public/` files) so blur placeholders
  work; always set `alt`, `sizes`, and `fill`/explicit dimensions. Client logos (`Clients.jsx`,
  `clients/page.js`) are the exception — string `src` from `clientLogos.js`, plain `<img>`
  (`allClientLogos` + `clientLogoAlt(src)` are the shared exports), alt derived from
  the filename.
- **Project photography is moving to Sanity's CDN; `public/` is for small, stable assets only.**
  Two tracks coexist deliberately:
  **local** — `import` + plain `<Image>` (blur placeholder from the static import), for logos,
  favicon, hero, OG fallback; **Sanity** — `<SanityImage image={...}>`
  (`components/SanityImage.jsx`), for the ~1,500 planned project photos.
  `lib/cms/image.js` holds the URL builder + the `next/image` loader.
  **Never set `images.loaderFile` in `next.config.mjs`.** It is global, so it would also be
  handed the `/_next/static/media/...` src of the 47 statically-imported images and produce
  broken URLs. The loader is passed **per-instance** via the `loader` prop (which is why
  `SanityImage` is `"use client"` — next/image can only serialize a loader from a Client
  Component). That is what lets the migration go project-by-project instead of in one cutover.
  The loader exists for cost, not preference: on Vercel each distinct (image, width, format)
  through the *default* loader is a billed Image Transformation, and ~1,500 photos x ~4 widths
  is ~6,000 of them just to warm the cache once. Routing to `cdn.sanity.io` makes Vercel
  optimize nothing. Sanity asset URLs are content-addressed (dimensions + hash in the filename),
  so they cache at the edge forever and `sanityImageDimensions()` can read intrinsic size off
  the URL — no extra query, no CLS. Sanity's per-asset `metadata.lqip` is the drop-in
  replacement for the static-import blur placeholder; **query it, or migrated images silently
  lose their placeholder.** Requires `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET`
  (see `.env.example`) and the `cdn.sanity.io` entry in `images.remotePatterns`.
- Marquee sections (`Clients.jsx`, `NewCollection.jsx`) are pure-CSS: a `width: max-content` flex
  track with the item list rendered **twice** (2nd copy `alt=""` + `aria-hidden`), animated
  `translateX(0 → -50%)`, `animation-play-state: paused` on `:hover`. `Clients.jsx` also freezes
  under `@media (prefers-reduced-motion: reduce)` and becomes horizontally scrollable.
- **After adding images to `public/`, run `node scripts/optimize-images.js`** (downscales to
  ≤2000px / ≤2560px for hero, re-encodes, overwrites in place). Source images here were 24MP
  camera originals; `public/` went 330 MB → 55 MB in the P5 pass and → 23 MB in the Phase 26 sweep.
  **Client logos are the exception — use `npm run logos:sharpen`, not `optimize-images.js`.**
  It re-sources each `new-clients/*.png` from the sharper original in `all-clients/` (name match
  + a trimmed-aspect-ratio check, since several brands share a name prefix), trims the baked-in
  padding, fits to 720×300, re-pads ~4% in the sampled background colour, and rewrites the
  `width`/`height` in `clientLogos.js` in the same pass (so the two can't drift). Safe to re-run,
  though not byte-identical — reset with `git checkout -- public/images/new-clients` first if you
  want a deterministic result. `FORCE`/`DENY` at the top of the script are eyeball-reviewed
  exceptions: `DENY` exists because fuzzy name matching found the *wrong brand* for `geet`, `la`
  and `verma-acadmy`, and because `encanto` (gold "Nail Cafe by Encanto") and `encanto-second`
  (blue) would otherwise both resolve to the same `all-clients/Encanto.jpg` and render as
  duplicates. Verify any change to those lists by rendering the logos, not by reading filenames —
  every one of these was found by eye and none of them is visible from the filename.
- **Exactly one `<h1>` per rendered page.** Section components use `<h2>`+ (the `Hero` splash text
  is a `<div>`, `HowWeWork`/embedded `About` are `<h2>`). Don't add an `<h1>` to a component that
  can render inside another page.

## SEO

The canonical host is **`https://www.archcreativeinteriors.com`** — defined once as `SITE_URL` in
`src/app/lib/site.js` and consumed by `layout.js` (`metadataBase`), `sitemap.js`, and `robots.js`.
`next.config.mjs` `redirects()` 308s the bare domain → www (nginx is the better long-term place
for this; keep them from fighting).

- **Every route exports metadata.** Static pages use `export const metadata`; dynamic segments use
  `export async function generateMetadata({ params })` (`params` is a Promise — `await` it).
  Each provides `title` (short — the `%s | Arch Creative Interiors` template is applied by
  `layout.js`), `description`, `alternates.canonical` (relative path, e.g. `/projects/${id}`), and
  `openGraph` with `url` + `images`. Do **not** add a `keywords` array — Google ignores it.
- **Detail pages are SSG** — `projects/[id]`, `blogs/[id]`, `services/[slug]` all export
  `generateStaticParams`. A missing slug calls `notFound()` (real 404), never an inline div.
- `sitemap.js` enumerates static routes + every project/blog/service, all from the data modules —
  no hand-maintained slug lists.
- Unmatched URLs and every `notFound()` render `app/not-found.js` — a **real 404** with `noindex`
  (auto-injected). Never ship an inline "not found" `<div>` that returns 200.
- **The footer is a four-column block: brand · Explore · Studio (NAP) · map** (`Footer.jsx` +
  `styles/footer.css`), 1280px to line up with `.wrapx`. It carries the **only site-wide Google
  Maps embed** — `loading="lazy"` on that iframe is load-bearing, not decoration: the footer is
  mounted in `layout.js`, so without it every one of the 125 routes would make a third-party
  request to Google on load. It also needs a `title` (Lighthouse flags an untitled iframe —
  Phase 9.2). The embed URL is `BUSINESS.mapsEmbedUrl` in `site.js`, shared with
  `StudioLocation.jsx`; **`/contact` therefore renders two maps** — the footer's and
  StudioLocation's. Deliberate for now, but it is the one page where the pair is redundant.
- Every top-level route is reachable from the persistent footer nav (`Footer.jsx` `FOOTER_LINKS`).
  `/blogs` is **footer-only** — deliberately removed from the navbar (2026-09), so the footer link
  is now its *only* site-wide internal link. Don't remove it.
  (`/studio` used to be footer-only too; it was merged into `/about` in Phase 22 and now
  308s there. `NAV_LINKS` stays at six — the row collapses at 1024px and a seventh link pushes
  the 1025–1200px band back into the tight range. See Navbar breakpoints.)
  The one genuine exception is **`/costing`**, whose footer link was removed on the owner's instruction (2026-09).
  It is still in `sitemap.xml` and still exports metadata, so it stays indexable, but its only
  remaining internal link is on `not-found.js`. Re-add the `FOOTER_LINKS` entry to restore it.

### JSON-LD structured data (`lib/jsonld.js` + `components/JsonLd.jsx`)

- **`organizationJsonLd()`** — `Organization` + `HomeAndConstructionBusiness` node, `@id`
  `${SITE_URL}/#organization`. Rendered **once** in `layout.js` `<head>`, so it's on every page;
  `Article`/breadcrumb nodes reference it by `@id`. Data comes from `BUSINESS` in `lib/site.js`,
  the **canonical NAP** that `Footer.jsx`, `StudioLocation.jsx`, the topbar, `/contact` and the
  legal pages all read from (nothing hardcodes NAP). Hours: Mon–Sat 09:30–18:30.
- **`faqJsonLd(faqs)`** — `FAQPage` from `lib/data/faqs.js`; rendered on **`/about`** only
  (that's where the questions show; it was the home page until Phase 14, then `/studio` until
  that page was merged into `/about` in Phase 22). The questions *and answers* are in the SSR HTML, so the markup is honest. It must
  move with the section: FAQPage on a page with no visible questions is a policy violation.
- **`articleJsonLd(blog)`** + **`breadcrumbJsonLd([...])`** — on `blogs/[id]`.
- **`breadcrumbJsonLd([...])`** — also on `projects/[id]` and `services/[slug]`
  (Home › Section › Current). Both also render a visible `<Breadcrumbs items={...}>` with the
  **same** `items` array, so the schema and the UI can never disagree. (`/contact` dropped both —
  it's a one-level page with a custom two-column layout.)
- **`creativeWorkJsonLd(project)`** — on `projects/[id]`, alongside the breadcrumb.
- **`reviewJsonLd(testimonial)`** — one per entry in `lib/data/testimonials.js`, rendered on the
  home page (only the 3 rendered ones). Deliberately **no `reviewRating` and no site-wide
  `aggregateRating`** — a rating a business declares about itself, on its own site, with no real
  review mechanism, is ineligible for review rich results and marking it up invites a manual
  action. If a genuine on-site review system is ever built, ratings can be added then.
  **The visible stars on the home testimonial cards do NOT change this.** They render from a
  `rating` field the owner set in `lib/data/testimonials.js`; the field is presentation only and
  must stay out of the schema. Do not "fix" the mismatch by adding `reviewRating`.
- Adding a new detail route? Emit a matching `<JsonLd>` (breadcrumb at minimum) **and** a visible
  `<Breadcrumbs>`. Validate with Google's Rich Results Test.

Still open (not scheduled): per-route CSS splitting (measured in Phase 27: all 24 stylesheets
load on all 59 routes, ~15 KB compressed, of which Lighthouse says 11-13 KB is unused per page —
see the caution in that entry before attempting it), consolidating the two icon libraries onto
`lucide-react` (`react-icons` is down to 7 subpath imports — `Footer` socials, the floating
Call/Email/ScrollTop buttons, two `BsArrowRight`), `CONTACT_FROM` verified-domain sender, a real
branded mailbox to replace the Gmail address in `BUSINESS.email`, richer client-logo `alt` (needs
a `name` field in `clientLogos.js`), legal review of `/privacy-policy` and `/terms`,
GA4 lead-conversion tracking, and the content-growth work from the outside SEO audit (location
landing pages, expanded service-page copy, a published cost page, ongoing blog cadence) — all real
opportunities but content/business work, not code fixes.

**Closed in Phase 26:** the dead-code sweep (14 components, 3 data modules, 14 CSS files and the
unreferenced `public/images/*` folders — 239 files, `public/` 54 → 23 MB) and the contact-form
honeypot, which shipped with server-side rate limiting alongside it. `public/images/all-clients`
was **kept** despite having no code importer: it is the source `scripts/upscale-client-logos.js`
re-sources the client logos from.

### SEO work log — which change came from which phase

Trace any SEO change to its phase here. All phases: `npm run build` green, nothing committed yet.

- **Phase 1 — indexing foundations**
  1. `lib/site.js` (new) — `SITE_URL` / `SITE_NAME` / `SITE_DESCRIPTION`; `layout.js` `metadataBase` uses it.
  2. `robots.js` (new) — `/robots.txt`, disallow `/api/`, sitemap + host.
  3. `sitemap.js` (new) — `/sitemap.xml`, 45 URLs from the data files.
  4. `next.config.mjs` — `redirects()` 308 bare-domain → www.
  5. `generateMetadata` added to `projects/[id]`, `blogs/[id]`, `services/[slug]`.
  6. `metadata` added to `projects/page.js`, `blogs/page.js`, `costing/page.js`.
  7. `projects/[id]` + `services/[slug]` — `notFound()` instead of a 200 "not found" div; `generateStaticParams` added (both now SSG).
- **Phase 2 — crawl correctness & nav**
  1. `not-found.js` + `styles/not-found.css` (new) — real 404, `noindex`, links to main sections.
  2. `Navbar.jsx` — fixed Blogs `active` bug (`=== "/costing"` → `startsWith("/blogs")`); all `<a>` → `next/link`; `NAV_LINKS` array; hamburger `<div>` → `<button>`; mobile menu closes on click.
  3. `Footer.jsx` — added `FOOTER_LINKS` nav (includes `/costing`, previously unlinked); dropped `"use client"`; social links got `rel`/`aria-label`. `styles/footer.css` — `.footer-links`.
- **Phase 3 — structured data**
  1. `components/JsonLd.jsx` + `lib/jsonld.js` (new); `lib/site.js` — `BUSINESS` (NAP/geo/hours).
  2. `layout.js` `<head>` — `organizationJsonLd()` sitewide.
  3. `page.js` — `faqJsonLd()`; `lib/data/faqs.js` (new), `FAQ.jsx` imports it.
  4. `blogs/[id]` — `articleJsonLd()` + breadcrumb. `projects/[id]`, `services/[slug]` — breadcrumb.
  5. `Footer.jsx` address corrected to match the canonical NAP (Mon–Sat 09:30–18:30).
- **Phase 4 — headings & content structure**
  1. `Hero.jsx` — splash-loader `<h1>ARCH CREATIVE</h1>` → `<div class="hero-loader-title">` (+ `aria-hidden`); selector renamed in `styles/hero-loader.css`. Homepage now has one `<h1>` (the hero title).
  2. `HowWeWork.jsx` — `<h1>` → `<h2>`; selector updated in `styles/how-we-work.css`.
  3. `about/page.js` — `embedded` prop; standalone `/about` renders `<h1>` (was `<h2>`), home page passes `<About embedded />` to keep `<h2>`. `styles/about.css` — `.about-top h1` shares the `h2` rule.
  4. `projects/page.js` — added `<h1>`; `styles/projects.css` — `.projects-header h1`.
  5. `LogoRow.jsx` — dropped `"use client"` + `IntersectionObserver`; 81 client logos now render in SSR HTML with filename-derived `alt` and native `loading="lazy"`.
- **Phase 5 — performance / Core Web Vitals**
  1. `scripts/optimize-images.js` (new) — ran it: `public/` **330 MB → 55 MB** (101 images, 308 MB → 33 MB). Downscales 24MP originals to ≤2000px (hero ≤2560px), re-encodes q80, in place. Re-run after adding images.
  2. `blogs/page.js` — list `<Image>` was intrinsic-size with no `sizes` → now `fill` + `sizes`; `styles/blogs.css` `.blog-image { position: relative }`. Fixes CLS.
  3. `page.js` — 12 `dynamic()` imports → static imports. Removed `BAILOUT_TO_CLIENT_SIDE_RENDERING` from the homepage HTML.
  4. `blogs/page.js` — wrapped in `<main class="blogs-page">` with an `<h1>` + intro (was a bare `<div>`, no heading); `styles/blogs.css` `.blogs-page` / `.blogs-header`.
- **Phase 6 — cleanup**
  1. Raw internal `<a href>` → `next/link`: `Hero.jsx` (`/projects`), `Services.jsx`, `blogs/page.js`, `services/page.js` (also dropped an invalid `<a><button>`), `projects/[id]` + `services/[slug]` CTAs. Same-page `#contact-form` anchor kept as `<a>`.
  2. Removed the legacy `keywords` arrays from `page.js` and `services/page.js`.
  3. `layout.js` — `lang="en"` → `lang="en-IN"`.
  4. `Achievement.jsx` — rewritten: real stat numbers now in the SSR HTML (was literal `"0"`), CountUp animates on scroll via `enableScrollSpy` render-prop; manual `IntersectionObserver` removed.
  5. `api/contact/route.js` — hardened (see Known issues).
  6. `services/page.js` — title had a doubled brand suffix → shortened; `canonical`/`openGraph.url` made relative.
- **Phase 7 — gaps found by an external SEO audit, cross-checked against the actual code**
  1. `NewCollection.jsx` — every one of 14 marquee images had `alt="collection"` **and** `priority`+`loading="eager"` (14 images preloaded as top-priority on every load). Now: real per-image `alt` text on the 7 genuine images, the duplicated second half of the marquee is `alt=""` + `aria-hidden="true"`, and nothing in the component is `priority`/`eager` any more (it's below the fold).
  2. `lib/site.js` — added `CALL_NUMBER` / `WHATSAPP_NUMBER` (the floating call/WhatsApp buttons' real numbers) and `telephoneDisplay`/`landlineDisplay`, so every phone number on the site is defined exactly once. `CallButton.jsx`, `whatsappButton.jsx`, `Footer.jsx` now import from there instead of hardcoding.
  3. `components/Breadcrumbs.jsx` (new) — visible breadcrumb nav added to `blogs/[id]`, `projects/[id]`, `services/[slug]`, `/contact`, built from the same `items` passed to `breadcrumbJsonLd`. `styles/breadcrumbs.css` (new).
  4. `lib/jsonld.js` — added `creativeWorkJsonLd(project)` (on `projects/[id]`) and `reviewJsonLd(testimonial)` (8×, on the home page) — no ratings, see the JSON-LD section above.
  5. `contact/page.js` (new) — a real `/contact` route: NAP block, the existing `<Contact>` form, `<StudioLocation>`. `Footer.jsx`'s "Contact" link now points here instead of `/#contact-form`.
  6. `Contact.jsx` — added a consent line under the submit button linking to `/privacy-policy`. `.contact-box` `height` → `min-height` so it can grow to fit.
  7. `privacy-policy/page.js` + `terms/page.js` (new, draft — see Known issues) + `styles/legal.css` (new). `Footer.jsx` — added a legal-links row.
  8. `sitemap.js` — added `/contact`, `/privacy-policy`, `/terms`.
- **Phase 8 — LCP / Speed Index / agentic browsing**
  1. `next.config.mjs` — `images.formats: ["image/avif", "image/webp"]`. Verified: the hero image now serves as `image/avif`, 81 KB at 1080px (was WebP-only).
  2. Every route now has **exactly one `<main>` landmark** (home, about, projects, projects/[id], services, services/[slug], blogs/[id], costing, not-found — blogs/contact/legal already had one from earlier phases). `about/page.js` uses a `Wrapper = embedded ? Fragment : "main"` so the homepage doesn't get a nested `<main>` when it embeds `<About embedded />`. Landmarks matter for screen readers **and** for agents/crawlers identifying "the actual content" vs. chrome.
  3. `Contact.jsx` — every field now has a real `<label htmlFor>` (visually hidden via a new `.sr-only` utility in `globals.css`, paired by `id`), plus `autoComplete` hints. Placeholder-only inputs aren't a reliable accessible name and vanish once a field has a value — a real gap for screen readers and for agents that fill out forms programmatically.
  4. `robots.js` — added explicit `Allow: /` rules for `GPTBot`, `ChatGPT-User`, `ClaudeBot`, `Claude-Web`, `PerplexityBot`, `Google-Extended`, `CCBot`. The wildcard rule already permitted them; naming them is the recognized signal and future-proofs against a later blanket disallow with no AI-bot carve-out.
  5. Removed unused dependencies — `axios`, `dotenv`, `mongodb`, `boneyard-js` (44 packages out of `node_modules`) — and deleted the dead `lib/mongodb.js`.
  6. **Correction, same session:** the `Navbar.jsx` topbar (address/phone/email, added this session) was changed from auto-collapsing on scroll to **always visible**. That briefly led to bumping nav-clearance padding on ~10 individual pages — wrong layer. Reverted all of those; the real fix is the single `body { padding-top }` rule in `globals.css` (see Known issues) — one rule, not per-page padding.
- **Phase 9 — Lighthouse-reported bugs (heading order, iframe title, link text)**
  1. **Heading order was broken in 4 places**, all the same shape: a component/page had a heading immediately followed by one *two* levels deeper (e.g. `h2` → `h4`, `h1` → `h3`), which Lighthouse's Accessibility audit flags. Found by diffing the full heading sequence of every route against a "never jumps by more than one level" rule — do this again if the audit resurfaces after adding a new heading anywhere.
     - `Founder.jsx` — founder name `h4` → `h3` (`styles/founder.css` `.founder-signature` selector updated to match).
     - `Testimonials.jsx` — each testimonial name `h4` → `h3` (`styles/testimonials.css` `.testimonial-user` selector updated).
     - `projects/page.js` — project card titles `h3` → `h2` (`styles/projects.css` `.project-content` selector updated). Page only has one heading level below its `h1`, so cards are `h2`, not `h3`.
     - `blogs/page.js` — blog card titles `h3` → `h2` (`styles/blogs.css` `.blog-content` selector updated), same reasoning.
     - `about/page.js` — the `embedded` prop (Phase 4) made the top heading `h1`/`h2` but left the sub-heading hardcoded `h3` and the stats hardcoded `h4`, so standalone `/about` (`h1`) skipped straight to `h3`. Fixed by deriving all three from one `level` variable (`embedded ? 2 : 1`) — `Heading`/`SubHeading`/`StatHeading` are now `h${level}`/`h${level+1}`/`h${level+2}`, so both the embedded (`h2→h3→h4`) and standalone (`h1→h2→h3`) cases stay sequential. `styles/about.css` `.about-content`/`.stat` selectors updated to match both tag variants.
     - Verified with a full-site sweep (every route) after the fix: zero skips anywhere.
  2. `StudioLocation.jsx` — the Google Maps `<iframe>` had no `title`; added one. Used on `/` and `/contact`.
  3. `Services.jsx` — the homepage's one non-descriptive link (`"Read More"` → `/services`) reworded to `"Explore Our Services"`.
  4. `next.config.mjs` `images.formats` (Phase 8) confirmed a real win: hero LCP image now serves `image/avif` at ~81 KB.
  5. **Not acted on:** a pasted Lighthouse report this session showed very large "unused/unminified JavaScript" and 171 `User Timing` marks — both are hallmarks of testing against `npm run dev` (unminified, HMR/dev-instrumented) rather than a production build. Re-test with `npm run build && npm run start` before trusting those specific numbers; don't chase them based on a dev-mode run.
- **Phase 10 — `Clients` section length**
  1. The "Trusted By" section stacked all 82 client logos in 28 flex rows (~3,500 px of scroll).
     Replaced with a **3-row auto-scrolling CSS marquee** (`Clients.jsx` rewritten as a server
     component; `styles/clients.css` rewritten): flatten `clientLogos.js` → deal into 3 rows →
     each row a `width: max-content` track with the list rendered twice (2nd copy `aria-hidden` +
     `alt=""`), `translateX(0 → -50%)`, staggered durations, middle row reversed. Pause on hover;
     `prefers-reduced-motion` freezes it and makes the row scrollable. All 82 logos stay in SSR
     HTML. Logos render full colour (slight scale-up on hover). Section is now ~450 px.
  2. Deleted `components/LogoRow.jsx` (was only used by `Clients.jsx`).
  3. `Navbar.jsx` — added `/contact` to `NAV_LINKS` (shows in both desktop nav and mobile menu).
  4. `/contact` redesigned — removed the stranded `<Breadcrumbs>` + its JSON-LD; replaced the
     stacked centered blocks with a `.contact-hero` + a two-column `.contact-layout` (info panel ‖
     form). Also **shrank the `<Contact>` form globally** (used on the home page too): section
     padding `170 → 90px`, dropped the `558px` `min-height`, box `max-width 520 → 460`, smaller
     heading/inputs/gaps. `.contact-page` only tweaks the grey band away + left-aligns the card.
  5. **NAP consistency** — `StudioLocation.jsx` was the last place with a hardcoded address +
     business name; now reads `BUSINESS.address` / `SITE_NAME` / `BUSINESS.mapsUrl` from `site.js`.
     Owner confirmed the phone setup: `+91 98111 41227` primary (+ `0124-4144014` secondary) in
     footer/topbar/`/contact`/schema; the floating Call/WhatsApp buttons keep their own numbers.
     `site.js` comments updated to record the decision.
     ⚠ **The secondary landline was later removed (2026-09-16)** — see Known issues. The rest
     of this entry still stands; only that number is gone. The old *"V 1/3 V Block … Gurgaon"* footer
     wording only survives on the live deploy — gone from the codebase since Phase 3.
  6. **Home "Our Services" section + service-data unification.** `lib/data/services.js` (new) is
     now the single source: `services` (3 with detail pages) + `homeServices` (4 home-list items).
     `components/Services.jsx`, `services/page.js`, `services/[slug]/page.js`, and `sitemap.js` all
     read from it — the 3-way duplicated arrays (and `sitemap.js`'s hand-kept `SERVICE_SLUGS`) are
     gone. Home section: 5 items (Salon added, first), replaced the `01–0N` numbers with lucide
     icons in rounded tiles, made each `<div>` a `<Link>` (Salon/Residential/Commercial → their
     detail pages, Space Planning/Renovation → `/services`), added a hover arrow. `styles/services.css`
     `.service-icon` is scoped `.service-item .service-icon` to avoid colliding with the
     same-named class in `styles/services-all.css`. Detail-page hero label + `<title>` now use
     `service.label` (was the ambiguous `subtitle`); `services/page.js` cards use `service.tagline`.
  7. `Team.jsx` — team-card content: role pill moved above the name (eyebrow), explicit
     `gap`, name `24/500 → 21/600`, refined pill, dropped a `margin-left: -10px` mobile hack.
  8. **Home section order reworked** (`page.js`, one edit — all 13 sections kept). Was:
     Hero · Achievements · Services · Portfolio · About · Team · Testimonials · **Contact** · Clients ·
     FAQ · HowWeWork · StudioLocation · NewCollection — the contact form sat mid-page with 5
     sections after it, social proof + FAQ came *after* the ask, and NewCollection was stranded
     below the map. Now: Hero · Achievements · Services · **Portfolio · NewCollection** · About ·
     **HowWeWork** · Team · **Testimonials · Clients** · **FAQ** · **Contact** · StudioLocation —
     hook → credibility → offer → work → work → story → process → people → proof → proof →
     objections → convert → visit.
  9. `Hero.jsx` — single background image → a **3-image cross-fade slideshow** (`hero1.jpeg`,
     `heroo.jpg`, `hero4.png`, in an editable `SLIDES` array). Each is an `<Image fill>` stacked in
     `.hero-bg`; a `setInterval` toggles `.hero-slide.is-active` every 6 s → CSS `opacity`
     cross-fade + slow Ken-Burns zoom (`styles/hero.css` `.hero-slide`). First slide keeps
     `priority` (LCP preload) + the real `alt`; the rest are `alt=""` + `aria-hidden`.
     `prefers-reduced-motion` holds on slide 1. Splash-loader flow (Phase 4.1) unchanged — clears
     500 ms after slide 0's `onLoad`, then the interval starts.
  10. **Audit-checklist pass.** Favicon was a JPEG mislabeled `.ico` → `scripts/generate-favicon.js`
     (new) regenerates `src/app/{favicon.ico (16/32/48), icon.png (512), apple-icon.png (180)}` from
     the logo monogram (Next app-file conventions wire them automatically). `globals.css` — added
     `html, body { overflow-x: clip }` safety net (clip, not hidden, so `position: sticky` still
     works). `Footer.jsx` — phone/landline/email are now `tel:` / `mailto:` links (`.footer-info a`).
     Full internal-link crawl (49 URLs) + external social/map links: **zero broken**. Confirmed
     already-fine from the list: meta descriptions, page titles, mobile menu, form error/success
     toasts, `not-found.js`.

  11. **Mobile "blank page" bug — the whole site was invisible without JS.** Every section was
     wrapped in a framer-motion reveal (`ScrollReveal` + `HowWeWork`/`Team`/`Testimonials`' own
     `motion.div`s) with `initial={{opacity:0}}`, which renders `opacity:0` inline in the SSR HTML
     and only becomes visible once framer-motion's client JS runs. On a slow connection (user was
     on ~8 KB/s) the page stayed blank white for minutes and the hamburger was dead. Fix:
     `ScrollReveal` rewritten as a CSS reveal (visible by default, `IntersectionObserver` just
     toggles `data-reveal`); `ServiceReveal`/`AboutReveal`/`CostingReveal` now alias it;
     framer-motion stripped from `HowWeWork`/`Team`/`Testimonials` (all now plain server
     components); `globals.css` got the `[data-reveal]` rules. SSR now has **0** `opacity:0`
     inline styles.
  12. **Mobile hamburger now works without JS.** `Navbar.jsx` — the menu was a React `useState`
     toggle (dead until the JS bundle loaded). Added a visually-hidden `<input type="checkbox"
     id="nav-toggle">` as the first child of `<nav>` + a `<label htmlFor="nav-toggle">` for the
     icon; CSS `.nav-toggle:checked ~ .mobile-menu` (and `~ .nav-inner .menu-icon` for the
     ≡→✕ morph) drives it with **zero JS**. React still controls the checkbox (`checked`/`onChange`)
     so close-on-navigate (`useEffect([pathname])`) + `:has()` scroll-lock work once hydrated.
     The icon is three CSS `.menu-bar` `<span>`s (rounded "hotdog" bars), not an icon-font glyph —
     bars 1 & 3 rotate ±45° and bar 2 fades out on `:checked` to form the X. `react-icons`'
     `HiOutlineMenu`/`HiOutlineX` were dropped from `Navbar.jsx` when this went in.
  13. **Hero art direction for mobile.** Landscape hero images were cropped to a thin vertical
     strip on phones (+ a `transform: scale(1.1)` hack). Client supplied four portrait shots as
     `public/mob1–mob4.jpg`, resized to 1200×1600 / q80 mozjpeg in place (originals were up to
     4032px / 5 MB). `.hero-slide` is the wrapper `<div>` carrying the cross-fade; only the first
     slide keeps `priority` (LCP preload). To swap the mobile hero later, replace `public/mob1.jpg`
     (keep it 3:4) and re-run `node scripts/optimize-images.js`.
     **Final hero model (owner decision):** the 4-image wide cross-fade slideshow runs only on
     **landscape screens wider than 992px**. Everywhere else — `@media (max-width: 992px),
     (orientation: portrait)` — `.hero-bg` is `display:none` and a single **static** portrait image
     (`public/mob1.jpg`, rendered once as `.hero-mobile-img`, `loading="eager"`, no `priority` so it
     adds no preload on desktop) takes over. Reason: the wide landscape crops collapse to a useless
     vertical strip in any tall/portrait viewport (portrait tablets especially). The interval effect
     early-returns under the same `matchMedia("(max-width: 992px), (orientation: portrait)")`.
     `SLIDES` entries are `{ src, alt }` (wide only); `mob2–mob4.jpg` are unused (kept in `public/`
     for a possible future mobile slideshow). Breakpoint has moved around (≤480 → ≤992/portrait →
     **≤767px**, aligned with the header's 768px desktop line — owner's call, accepting that a
     portrait tablet ≥768 gets the wide slideshow cropped). In the `≤767px` block the hero copy is
     re-laid-out: `.hero-content` is `justify-content: flex-end` + `padding-bottom: 9vh` (text/CTAs
     in the lower frame so the photo shows above), overlay gradient goes light→dark top-to-bottom,
     `.hero-actions` is a centred `max-width: 340px` column (both buttons identical width). A
     `@media (min-width: 768px) and (max-width: 1100px)` step eases the desktop title 58→44px.
     **Slideshow robustness fixes (same session):** (a) the auto-advance `setInterval` was gated on
     the first image's `onLoad` firing — which silently never happens on a revisit when the image is
     served from cache (React attaches the handler after the `load` event during hydration), leaving
     the loader stuck and the slideshow frozen on slide 0. Added a 1400 ms hard-fallback timer that
     forces `loaded=true` regardless. (b) `prefers-reduced-motion` previously `return`ed out of the
     interval effect entirely (no rotation) — common on Android with battery-saver/"remove
     animations". Now it keeps a slow 12 s cross-fade rotation (CSS already drops the Ken-Burns
     zoom under that query); only motion-sensitive users see the slower cadence, nobody sees a
     dead slideshow. (c) **hero text was `opacity:0` until a JS `.hero.loaded` class** — same
     fragility ScrollReveal had (Phase 10.11). If the bundle stalled you got the cropped hero
     image with no heading/CTA. Now `.hero-content` and `.hero-overlay` are JS-independent:
     overlay visible by default, content revealed by a pure-CSS `heroContentIn` animation
     (`hero-loader.css`, 1.6 s delay to clear the splash, `forwards`, `prefers-reduced-motion`
     shows it instantly). All `.hero.loaded` style rules removed; the JS `loaded` state now only
     unmounts the splash `<div>` (whose own `loaderFade` animation hides it anyway).

- **Phase 11 — `/clients` logo sharpness + presentation**
  1. **The logos were soft on every HiDPI screen.** `new-clients/*.png` were ~250–300 px wide and
     the grid rendered them at roughly that same CSS size, so a 2× display upscaled all 82.
     `scripts/upscale-client-logos.js` (new, `npm run logos:sharpen`) re-sources 55 of them from
     the sharper originals already sitting in `public/images/all-clients/` (up to 6912 px). The
     folder got *smaller* — 2.4 MB → 2.1 MB — because PNG palette quantization outweighs the
     added resolution.
  2. The match is name-based, which is unsafe on its own: several brands share a prefix. A
     trimmed-aspect-ratio check gates it, and a reviewed `FORCE`/`DENY` pair handles the rest.
     `DENY` caught three genuinely wrong brands (`geet` → Geetanjali Studio, `la` (La Fleur) →
     La Adorabelle, `verma-acadmy` → Verma's Unisex Salon) plus two where the shipped art is the
     better variant (`extension`, `fab-u`). **These were found by rendering the pairs side by
     side** — the filenames give no hint.
  3. Logos are trimmed of baked-in padding, resized, then re-padded ~4% in the background colour
     sampled *before* the trim. Three ordering details, each found by rendering the result:
     sampling the colour *after* the trim picks anti-aliased edge pixels and paints a grey frame
     around dark-bar logos (visible on `black-express`); trimming without re-padding leaves the
     type touching the edge and reading as clipped (`iza`, `hob`, `toni`); and padding *before*
     the resize makes the margin part of what the size cap shrinks, so each re-run trimmed the
     pad, shrank the art a little more, and padded again.
  4. `clientLogos.js` `width`/`height` are now rewritten by that same script — the images and the
     numbers can't drift apart, which is the failure mode that produced the duplicate order list
     in Phase 10.
  5. **The grid follows the PDF's rows, not a uniform 3-up.** `clientLogos.js` became
     `clientLogoRows` — an array of rows whose *length* is the row's density (2/3/4), matching
     each company-profile page. Rendered on a 12-column grid where `data-cols` picks the span;
     rows sum to exactly 12 so they can't straddle. Collapses to 2-up at ≤768px.
  6. **`encanto` and `encanto-second` are different logos** (gold "Nail Cafe by Encanto" vs the
     blue one) that both fuzzy-matched `all-clients/Encanto.jpg`, so 10.x briefly rendered the
     same blue mark twice. `encanto` is now in `DENY`. Caught by comparing the two tiles against
     the PDF, not by anything in the code.
  7. `/clients` redesign — full-bleed tinted section (`.clients-page` gradient) with an inner
     `.clients-page-inner` container, pill eyebrow + gradient rule in the header, and each logo in
     a fixed-height `.client-logo` band so mismatched marks size evenly. Softer cards
     (18px radius, hairline border, lift on hover), `@media (hover: none)` so the lift doesn't
     stick after a tap on touch. The home marquee benefits from the trim too — it already
     normalized to a fixed 60px height.

- **Phase 12 — execution plan v5: projects index + navbar**
  1. **`lib/projectSource.js` (new) is the Sanity swap point.** Everything the index needs now
     comes through it in the §12 schema shape, mapped from `data/projects.js`. When the Sanity
     project exists, only the two functions at the bottom of that file change. `data/projects.js`
     stays the single source of truth in the meantime — this derives from it, it does not
     duplicate it. `/projects/[id]` and `sitemap.js` still read that file directly and move here
     when Sanity lands.
  2. `state` does not exist in `data/projects.js`, so it is derived from the free-text
     `location` by a city→state map (longest key wins, so "Sector 43 Faridabad Haryana" resolves
     on "faridabad"). All 34 records map; the distribution matches §1 (Haryana 10, Delhi 8, UP 7).
  3. **`/projects` is now the §7 typographic index**, replacing the grid. Rows are server-rendered
     links, complete without JS; `ProjectIndex.jsx` adds the cursor preview as pure enhancement.
     The preview goes through the image optimizer — a static import's `.src` is the *original*
     file (up to 560 KB here), so hovering a row would otherwise pull a full-size photo.
  4. **Placeholder rows** to review the layout at ~187-row scale, behind
     `NEXT_PUBLIC_SHOW_PLACEHOLDER_PROJECTS=1`, **default off** so they cannot reach production.
     They are excluded from `generateStaticParams` and `sitemap.js` unconditionally, and render
     as inert `<div>`s rather than links — otherwise the build emits 153 junk detail pages and
     the index links to 404s. Verified at 187 rows: 34 real links, 0 placeholder links, 10 year
     headings correctly grouped.
  5. Navbar: `/blogs` moved to footer-only. Collapse breakpoint left at 1024px — removing a link
     only frees space, so it stays safe; lowering it needs a real browser measurement.
  6. **Not done, flagged only:** "1000+ Projects Delivered" still appears in three places
     (`Achievement.jsx:6`, `about/page.js:87`, `Founder.jsx:59`) against a real figure of 187 —
     plan §2's top item. `NewCollection` still mounted. §5 design tokens, §6 homepage rebuild and
     §8 detail-page tiers are untouched.
  7. **Plan §2 is ~half stale** — it audits the live deploy, not this repo. The "0 counters" bug
     and "salon missing from services" were both fixed in Phases 6 and 10.

- **Phase 13 — the full project roster (179 rows)**
  1. `scripts/data/project-list.txt` (new) is the **reviewable master list** — one line per
     project, `Name (Location)`. `npm run projects:build` turns it into
     `data/projectRoster.js` (generated, never hand-edited). Fix a line, re-run.
  2. **⚠ The list was TRANSCRIBED FROM A SCREENSHOT, not the spreadsheet.** The owner's list is
     192 rows (187 after the 5 known duplicates); **170 were transcribed, so ~17 are missing**,
     including the only Odisha project — the roster covers 15 of the 16 states. It must be
     proof-read against `aci_project_inventory.xlsx` before launch. Confidence check: the derived
     state distribution tracks §1 closely (Haryana 56 vs 60, Delhi 41 vs 47, UP 29 vs 34), and
     65 brands vs the plan's 66 — consistent with a ~17-row shortfall, not with bad transcription.
  3. `state` is derived from the location text: explicit state token first (far more reliable),
     then a city map. All 179 resolve.
  4. **Only 34 rows are linkable** — the ones `data/projects.js` backs with a photo, copy and a
     `/projects/[id]` page. The other 145 render as inert `<div>`s (§16: 181 of 187 have no
     photograph). Never emit an `<a>` for a row `generateStaticParams` does not build.
  5. Matching the transcription to `projects.js` is **one-to-one and score-ranked** — a first
     attempt with a plain token-overlap threshold assigned 121 roster rows to the same 34 records,
     because "Geetanjali Salon" tokens are shared by half the list. 25 match automatically; the
     other **9 are appended by a safety net** and flagged `needsReconcile` in the build output,
     because a near-miss spelling ("Blackexpress"/"Black Express", "Hakim Ali"/"Hakim Aalim")
     must never orphan a live page from the index. Reconcile those 9 by hand when the real
     spreadsheet arrives.
  6. **Sorting ignores the year on purpose.** Every seed record reads "2025" and roster-only rows
     have none, so the column carries zero information and sorting on it just floated the 34
     photographed projects to the top by accident. Falls back to reverse list order per §7, and
     switches itself back on via `hasMultipleYears()` the moment real years land.
  7. The plan's inventory files (`aci_project_inventory.xlsx`, `aci-projects-index.html`,
     `DESIGN-localhost.md`) are **not on this machine**. `New ACI 08 MAY.xlsx` in Downloads is
     2022 accounting data, not the inventory — don't mistake it for the source.

- **Phase 14 — the `/studio` page (redesign brief §4)** — ⚠ **SUPERSEDED by Phase 22**: the
  page was merged into `/about` and `/studio` now 308s there. The decisions below still explain
  the sections' content and markup, which moved across intact; only the route is gone.
  1. `src/app/studio/page.js` + `styles/studio-page.css` (new). Home's "More about the studio"
     link pointed at `/about`; the brief's Studio page did not exist yet, so the link went to the
     wrong page rather than a missing one — which is why it looked like a working link.
     **`/about` was not replaced.** Two pages, two jobs: `/about` is the general marketing page
     and keeps the navbar link; `/studio` is the practice (founder, team, delivery process, FAQ).
  2. **Real content over the demo's placeholders.** The demo ships `[Founder name]`, four
     `[Name]` team members and "Portrait to be shot" tiles. The founder (`Founder.jsx`:
     Mr. Itinder Singh) and the six team members (`Team.jsx`, all with photographs) are real, so
     those are used. The same fix removed the two visible `[Founder name]` / `[N]` placeholders
     from the Home studio block — the `[N]` sentence was reworded to drop the number rather than
     invent a headcount the repo does not know.
  3. Only the **five delivery stages** are the demo's copy. `HowWeWork.jsx` describes a generic
     residential design process; these describe a salon fit-out (mall/landlord approvals, one
     site manager throughout). `HowWeWork.jsx` / `Team.jsx` / `FAQ.jsx` are now unused but were
     left in the repo, like the rest of the sections Home dropped.
  4. **FAQ is `<details>/<summary>`.** The demo's accordion is `display:none` until a click
     handler adds `.open` — that hides every answer from a no-JS reader (Phase 10.11) and makes
     the FAQPage schema assert content the HTML does not contain. All five answers are in the
     SSR HTML. `faqJsonLd` moved from Home to here in the same change.
  5. **Every class is `sd`-prefixed.** All ~30 stylesheets are global, and the demo's names
     collide with live components: `.faq` is `faq.css`'s section wrapper, `.step-*` is
     `how-we-work.css`. Copying the demo's class names would have silently restyled both.
  6. Numbers are derived, not the demo's prose. The demo's "a ninety-nine-space rollout across
     sixteen states" reads from `brandsByCount()[0]` instead — currently **104-space Geetanjali
     rollout across 15 states** (the site total is 16 states; Geetanjali is in 15 of them).
  7. `/studio` added to `FOOTER_LINKS` and `sitemap.js`. **Not** added to `NAV_LINKS` — the row
     already collapses at 1024px and a seventh link puts the 1025–1200px band back in the tight
     range. Footer + the Home studio block are its two internal links.

- **Phase 15 — `/projects` rewired to the owner's 192-row list**
  1. **The index and the home page were reading different datasets.** Home used
     `data/projectsData.js` (192 rows, the owner's txt); `/projects` still used
     `data/projectRoster.js` (179 rows transcribed from a screenshot, ~17 short, different
     order) via `projectSource.js`. So the site said "192 documented" on one page and listed
     179 in a different sequence on the next. `getProjects()` now reads `projectsData`.
  2. **Order is `listNo` descending, not array position.** `listNo` is the owner's own line
     number (1 = oldest, 192 = newest), so "the list read bottom to top" is expressed in the
     data rather than depending on the generated array's order surviving a re-import.
  3. A linkable row is addressed by the DETAIL record's id (`detailSlug`), not the
     list-derived `slug` — the two differ, and only the former is built.
  4. **The switch initially orphaned 7 detail pages** (`eesha-salon`,
     `geetanjali-salon-lucknow`, `geetanjali-salon-saket`, `hakim-ali-salon`,
     `peluqueria-salon-lucknow`, `punjabi-restaurant-gurugram`, `toni-and-guy`): live pages,
     in `sitemap.xml`, with no link anywhere on the site, because the importer's 0.5-Jaccard
     matcher cannot bridge "Hakim Ali"/"Hakim Aalim" or "Toni & Guy"/"Tony & Guy". Fixed with
     an explicit `MANUAL` map (detail slug -> list number) in `scripts/import-projects.js`,
     applied before the fuzzy pass and excluded from it. Back to 34/34 linked.
     **Only `geetanjali-salon-lucknow` is a judgement call** — the record is titled just
     "Geetanjali Salon Lucknow" and the list has three Lucknow Geetanjali rows; pinned to #80
     (Phoenix Palassio). Re-point it if the photographs say otherwise.
  5. Verify a source change here by **counting rendered rows and diffing the index's hrefs
     against every `id:` in `data/projects.js`** — a wrong join shows up as a page that still
     builds and still validates, just with nothing linking to it. The build stays green
     either way; it will not catch this for you.

- **Phase 16 — brand collections (`/projects/brand/[brand]`)**
  1. **The home brand tiles were dead on click.** `BrandWall.jsx` rendered 66 `<button>`s
     carrying only `onMouseEnter`/`onFocus` — hovering swapped the preview panel, clicking did
     nothing, and with no JS they were 66 inert controls. The panel's "View collection" link
     went to the unfiltered `/projects`. There was no per-brand page to go to.
  2. Tiles are now `<Link>`s to the new route (hover handlers kept, so the preview still
     works). `.tile` gained `text-decoration: none` — it had never needed it as a `<button>`.
  3. `components/ProjectRow.jsx` (new) — the index row, extracted out of `projects/page.js`
     so `/projects` and the brand pages cannot drift apart. Still a Server Component; the
     rows must stay complete without JS (Phase 10.11).
  4. `brandSlug()` / `brandBySlug()` added to `lib/projectStats.js`; 66 brand URLs added to
     `sitemap.js`, derived so a new brand appears on its own. Build goes 59 -> 125 pages.
  5. Fixed in passing: the section's subtitle read "Sixty-six of them, from a single salon to
     **ninety-nine** spaces" — the demo's figure. The data says 104 (Geetanjali). Both
     numbers are derived now, per §7.

- **Phase 17 — project names/locations stored verbatim**
  1. `import-projects.js` ran every name and location through `squash()`
     (`replace(/\s+/g," ")`), which **collapsed internal double spaces**. Four rows genuinely
     carry one: `Apex  D'Rio`, `Zora Mall  Raipur`, and `Alwar  Rajasthan` twice. Names and
     locations now use `trimOnly()` — ends trimmed, internal spacing untouched. `squash()`
     stays for the DERIVED fields (brand, match keys) where normalising is the point.
  2. **How to check this properly**: diff the generated data against the source txt, and diff
     the *rendered* `/projects` rows against it too. HTML collapses whitespace when it
     displays, so this particular class of bug is invisible on screen and only shows up in a
     byte comparison of the data. Verified: all 192 rows, name and location, identical to
     `scripts/data/projects-192.txt`.

- **Phase 18 — footer rebuilt (four columns + map)**
  1. It was a **900px centred stack** — seven links, three social icons and the NAP in a narrow
     ribbon with the whole page width unused either side. Now a four-column grid at 1280px
     (matching `.wrapx`): brand + tagline + social · Explore · Studio NAP · map.
  2. **Map added**, using `BUSINESS.mapsEmbedUrl` (new in `site.js`) so the embed URL is
     defined once — `StudioLocation.jsx` now reads it from there too instead of holding its own
     copy of the same 300-character URL.
  3. Hours are derived from `BUSINESS.openingHours` ("Mon–Sat · 09:30–18:30"), the same array
     the Organization JSON-LD uses, so the footer cannot claim hours the schema contradicts.
     The `© year` is `new Date().getFullYear()` at build time, not a literal.
  4. Colours are tokens now — the file hardcoded `#264ea0` (which *is* `--primary`).
  5. The logo works here because its ink is **white on transparency** — it needs a dark ground.
     Checked with sharp before using it, not assumed from the file name.
  6. Column headings are `<h2>`. Verified across 14 routes: still exactly one `<h1>` per page
     and **zero heading-level skips** — the check Phase 9.1 established. Re-run it if the
     footer's heading levels ever change, because a footer regression hits every page at once.
  7. **`CtaBand.jsx` reworked in the same pass, because the new footer made it redundant.**
     The band ended with a dim `.ctaBand-nap` line repeating the street address — sitting a few
     pixels above the footer's Studio column saying the same thing, so Home closed with the
     address twice. It is now a two-column block: the ask on the left (enquiry + WhatsApp),
     and an "Or reach us directly" panel on the right — studio line, enquiries line, email and
     hours, each with a label. The address lives once now, in the footer beside the map.
     All values still come from `site.js`; `dayRange` is derived from `openingHours` in both
     components, so the footer, the band and the Organization JSON-LD cannot disagree.
  8. **The footer borrows `.ctaBand`'s LAYOUT but not its colour** (owner's call: the footer
     stays on brand). Shared: the translucent panel around the map, the 12px/1.4px uppercase
     micro-headings, the `.bWhite` pill, the icon+text row shape. Not shared: the ground and
     therefore the alphas. `.ctaBand` sits on `--surface` (#151515) where white at `.5` reads
     fine; on the footer's mid-blue the same value measures **~3.2:1 and fails AA**, so muted
     text here is `.7` (4.75:1) and panels are `.08`/`.20` rather than `.06`/`.14`.
     **Do not "unify" the two alpha sets — they differ because the grounds do.**
  9. **The footer bookends the header**: `--primary` body over a full-bleed `--primary-dark`
     bottom strip, which is the topbar/nav pair inverted. `navbar.css` was on raw hex and one
     of them had drifted — `#264fa0` against the token's `#264ea0`, invisible but real. Both
     are `var(--primary)` / `var(--primary-dark)` now, so header and footer are the same
     colour by construction rather than by eye.
  10. `.ctaBand` keeps its §3.9 float (full `--r-lg` radius, `margin: 0 --s3 --s3`). It was
     briefly flush-and-square-bottomed while the footer was also `--surface`, because a gap
     between two same-coloured dark blocks read as a white sliver. That no longer applies.
     **If the footer's background ever changes again, re-check this pairing** — the two blocks
     are in different files and nothing links them.

- **Phase 19 — Home hero cross-fade (CSS only)**
  1. `components/home/HomeHero.jsx` shows four slides — `heroo.jpg`, `hero.webp`, `hero4.png`,
     `hero2.jpeg` — cross-fading on a 24s loop (6s each, 1s fade). Add or remove entries in its
     `SLIDES` array **and** adjust the `:nth-child` delays + the keyframe percentages in
     `styles/home.css`; the cycle length and the slide count have to agree or the fades drift.
  2. **It is pure CSS and the component stays a Server Component — keep it that way.** The old
     `Hero.jsx` ran the same effect on a `setInterval` gated behind the first image's `onLoad`,
     which never fires on a cache hit, so the slideshow froze on slide 1 and the splash loader
     never cleared (Phase 10.13a). A keyframe has no bundle to stall on.
  3. Slide 1 is `opacity: 1` in its **base rule**, not only inside the keyframe, so the hero has
     a visible image even if the animation never runs. Slides 2–4 start at 0, so there is no
     flash of four stacked photos before the timeline begins.
  4. `prefers-reduced-motion` cancels the animation and leaves slide 1 — a still hero, never a
     blank one. This is the site's *second* non-user-triggered animation (after `.cbFill`);
     don't add a third without a reason.
  5. Only slide 1 has `priority` (one `<link rel="preload">` in the head, verified). Preloading
     four full-bleed photographs would make the hero slower, not richer. The other three are
     `alt=""` + `aria-hidden` — the same subject, not four things to announce.
  6. **Not done, flagged:** `hero.webp` is 6144x3240 (the hero cap in `optimize-images.js` is
     2560) and `hero4.png` is a 550 KB PNG of a photograph. `next/image` re-encodes on demand
     so delivery is fine; the oversized sources only cost build time. Left alone rather than
     running `optimize-images.js`, which rewrites all of `public/` in place.

- **Phase 20 — `/projects/[id]` rebuilt to the demo's detail layout**
  1. Was a full-bleed hero with the title in an overlay, then a two-column body. Now the
     demo's shape: **photograph left, spec panel right** (`.pd` grid, 1fr / 360px), then the
     written sections. The reasoning is specific to this portfolio — at 192 near-identical
     salon interiors the *facts* separate one project from the next, so brand/location/city/
     state/format/sector sit beside the photograph instead of below a screen-height image.
  2. **Two sources, joined on the slug**: `data/projects.js` supplies the photograph and copy,
     `projectSource.getProject()` supplies the spec fields — so the panel agrees with the index
     and the derived counts by construction rather than restating them. The join is **guarded**
     (`record?.`): a detail page can exist before its roster row is reconciled, and that must
     degrade to fewer spec rows, never a crash. Rows with no value are filtered out.
  3. `projectSource` records gained `cityName` (the canonical city). `city` still carries the
     free-text location because the index column wants that; the detail page shows both, which
     is what the demo does.
  4. **There is NO "Completed" row on the spec panel (owner, 2026-09-17).** It read
     "To be confirmed" on all 34 pages, because every record literally says `year: "2025"` —
     placeholder data (§13 lists year_completed as outstanding) — and printing 2025 would assert
     a completion date the business has not given us. The owner's earlier call was to keep the
     placeholder wording (runbook Phase 3 item 2); **this reverses it**, so the panel omits the
     field instead of announcing a gap. `year` is untouched on every record in `data/projects.js`;
     only the panel changed. **If the real column is ever filled, add the row back** — the data
     side needs nothing.
  5. The brand eyebrow and "See all N *brand* projects" link to `/projects/brand/[brand]`
     (Phase 16). N is derived; the link is suppressed for single-project brands. Verified: all
     34 pages return 200 and every brand link resolves.
  6. **`.pdStrip` — the four tiles under the hero — shows THIS project and nothing else.**
     Images from the record's `gallery` array; spec §26's "Photograph to be shot" placeholder
     for every slot without one. Not links. Add a `gallery` array to a record and its
     placeholders are replaced one for one, no code change.
     **This was got wrong first and is worth not repeating.** With no gallery the strip fell
     back to four *other* projects, captioned and linked so they would read as related work.
     The owner caught it on Geetanjali Studio Ajmer: the strip showed Worldmark, Dehradun,
     Lucknow and Pacific Mall — four different cities, sitting directly under this project's
     photograph, where they read as more views of this space regardless of the caption. Spec
     §26: *"Do not use random project images as substitutes unless explicitly approved."*
     A caption does not fix a layout that says otherwise.
     No record has a gallery yet — `public/images/projects/` and
     `public/images/watermark-images/` are the same 34 pictures processed two ways, not extra
     angles.
     - The label is a `<p>` with `aria-label` on the `<ul>`, **not an `<h2>`** — the strip sits
       in the left column, which precedes the `<aside>` holding the `<h1>`, so a heading there
       made the document outline start at level 2 before the page's own title.
     - Verify with a **non-greedy** match on `<ul class="pdStrip">…</ul>`. A greedy
       `sed 's/.*\(<ul class="pdStrip".*<\/ul>\).*/\1/'` runs to the last `</ul>` on the page
       and swallows the footer, reporting images and links that are not in the strip at all.
  7. The written sections (overview / challenge / solution / features) are the demo's one
     omission — it was drawn assuming almost nothing had copy. These 34 do, and it is the only
     long-form text on the site about the actual work. Kept, restyled onto the tokens.
     `styles/project-detail.css` was rewritten; the old `.project-*` class names are gone with
     the old markup.
  8. **Two later fixes to that block, both worth knowing:**
     - **`.pdBody` must sit INSIDE `.wrapx`, not share an element with it.** On one element,
       `.pdBody`'s `max-width` applied to the wrapx box, whose `margin: 0 auto` then centred
       the entire text column — it floated mid-page instead of aligning with the photograph
       above. Same shape of bug as a specificity collision: the class did what it said, on the
       wrong box.
     - **Section spacing has to beat the heading's own bottom margin.** At `--s3` (40px)
       against a 1.75 line-height, a paragraph ran straight into the next `<h2>` and the page
       read as one block of text with big words in it. Now 64px between sections (48px under
       1000px) against a 16px heading margin.
     - **Area is not shown**, on the owner's instruction. `area` is still on every record in
       `data/projects.js` — only the panel changed. Spec §18's field list does not include it.

- **Phase 21 — the two portfolio experiences (`ACI_Brand_and_Project_Experience_Specification.md`)**
  Owner decisions taken before building, because the spec contradicts earlier instructions:
  **(a)** §12 bans the "1000+" claim — the owner had already chosen it and **keeps it**;
  **(b)** §22 wants `/work` + `/brands` — **URLs stay under `/projects`** (≈100 indexed URLs,
  no functional gain); **(c)** the spec's figures (187 projects, Geetanjali 99/36/16/53%) are
  the old demo dataset — the owner's 192-row list gives **192** and **104/35/15/54%**, and §4
  forbids hard-coding, so **the data wins everywhere**.
  1. **§23 is the big structural change: a brand gets a collection page only at 3+ projects.**
     That is **7 brands of 66** (Geetanjali 104, Bellance 4, Bon Temps 4, Looks 3, Simrann's 3,
     Toni & Guy 3, Tweak 3). Build went 125 → 66 pages. The threshold is
     `BRAND_COLLECTION_MIN` in `projectStats.js` and moves on its own — **nothing anywhere
     lists brand names**.
     Two things had to move with it or they would have pointed at 59 new 404s: the home brand
     wall now routes through `brandHref()` (3+ → collection page · 1–2 with a photo → that
     project · otherwise → `/projects`), and `sitemap.js` uses `brandsWithCollectionPage()`.
     **Verified by request, not by reading: every tile target and every sitemap URL returns 200.**
  2. **Brand collection page** (`projects/brand/[brand]`) rebuilt to §3: hero + derived stats ·
     format bars · every project grouped by state · CTA. Components in `components/brand/`.
     Bar width is the spec's own formula (`count / maxFormatCount * 100`), computed in
     `projectStats.formatBreakdown()`. The hero photograph is the brand's newest photographed
     project — not a stock image, and §26's placeholder when the brand has none.
  3. **`ProjectCard` / `ProjectGrid`** (`styles/project-cards.css`) are the §32 shared
     primitives; §29 columns 4/3/2 are defined once there. §26: a project with no approved
     photograph renders "Photograph to be shot", never a broken image and **never another
     project's photo as a substitute**. Hover only repeats the format, so touch loses nothing.
  4. **`/projects`** got §13's creative count (static — the spec's own fallback, and this repo
     has already shipped a counter that rendered a literal "0", Phase 6.4) and §15's sector
     filters. **The chips are rendered by the client component**, so with no JS there are no
     chips and the full 192-row index is still there — a dead control is worse than none
     (Phase 16.1). Filtering toggles `hidden` on server-rendered rows; it never owns them.
     Year headings became their own `<li data-year-group>` so filtering can hide a heading
     whose whole group is gone.
  5. **Sanity, written but not wired**: `sanity/schemas/{brand,project}.js` (§21) and
     `src/app/lib/cms/queries.js` (GROQ, §20). The projections already return the exact field names
     the components consume, so the migration is a change of source, not a redesign. Neither
     schema stores a project count — §21 and §4 both say derive it.
     **Two fields must never be dropped from the projections**: `metadata.lqip` (the blur
     placeholder, or migrated images silently lose it) and `metadata.dimensions` (or §28's
     "fixed aspect ratios" is lost across 192 cards). The card projection deliberately excludes
     `gallery` — §28 forbids pulling every image on the index.
  6. **A descendant selector ate the new count block.** `.projects-header span` (specificity
     0,1,1) outranked `.pcountN` / `.pcountL` (0,1,0), so the 104px editorial number rendered
     as 13px uppercase letter-spaced blue text — it looked like the markup was wrong, but the
     markup was fine. Scoped to `.projects-header > span`. **This is the third time this exact
     trap has bitten this repo** (client-logo `[data-cols]`, the navbar, now here): all ~30
     stylesheets are global, so a bare `.parent element` selector reaches into every component
     later nested inside it. Prefer `>` for wrapper-level typography rules.
     Two things travelled with it: `.pcount` is `display:flex`, which does **not** inherit the
     header's `text-align:center` — it needed `justify-content:center` or the block sits hard
     left under a centred heading; and the dead `.projects-count` rule was removed.
  7. **Not done:** no Sanity dataset exists yet (`NEXT_PUBLIC_SANITY_PROJECT_ID` empty), so the
     site still reads `data/projectsData.js`. §19's gallery is supported on the detail page but
     no record has one. **When the owner's 5-images-per-project arrive they must go to Sanity,
     not `public/`** — 960 files into a repo whose `.git` is already ~260 MB would be paid for
     on every Vercel build and make the history rewrite much harder.

- **Phase 22 — `/studio` merged into `/about`**
  1. **They were duplicating each other.** A text diff of the two rendered pages found the
     founder's name, *both* of his paragraphs and his quote repeated word for word, and the
     sizes were backwards: `/about` 155 words (navbar link), `/studio` 350 (footer-only). Two
     thin pages competing in search for the same terms.
  2. **`/about` kept the URL**, not `/studio`: conventional name, in the navbar and footer,
     existing search authority. `/studio` was three weeks old and footer-only. The *content*
     is the studio page's — which is the brief §4 "Studio" content; the brief was written
     assuming no `/about` existed in this shape. Merged page is 496 words:
     who we are · founder · how a project runs · the team · common questions.
  3. `next.config.mjs` — **308 from `/studio` to `/about`**. Verified against a real production
     server, not just the config: `curl /studio` → `308 → /about`, `/about` → 200.
     `/studio` removed from `sitemap.js` and from `FOOTER_LINKS`; the home studio block links
     to `/about`. **Full internal-link crawl after the merge: 61 distinct links, 0 non-200.**
  4. `faqJsonLd` moved with the questions — Home → `/studio` → `/about`. It goes wherever they
     are rendered; emitting it on a page without them is a policy violation.
  5. **`about/page.js` lost its `embedded` prop** and the `Heading`/`SubHeading`/`StatHeading`/
     `Wrapper` machinery around it. That existed so the old home page could render this route
     as a section; the Home rebuild dropped that call and left it dead.
  6. `styles/studio-page.css` **keeps its name and its `sd` prefix** — renaming both would
     touch every selector for no behavioural gain, and the prefix's job is collision avoidance
     (`.faq` is faq.css's wrapper, `.step-*` is how-we-work.css), not naming. Its unused
     `.sdHero` / `.sdCrumb` / `.sdStat` rules went with the merge.
  7. **14 of 45 components now have no importer**: `Achievement`, `Clients`, `FAQ`, `Founder`,
     `Hero`, `HowWeWork`, `Loader`, `NewCollection`, `Portfolio`, `PortfolioSkeleton`,
     `SanityImage`, `Services`, `Team`, `Testimonials`. Most were superseded by the Home
     rebuild and this merge — `Founder`/`Team`/`HowWeWork`/`FAQ` are the ones this phase
     retired. **`SanityImage` is NOT dead** in the same sense: it is waiting for the Sanity
     migration, keep it. Nothing was deleted; when clearing them out, resolve importers by
     basename across relative paths — a `grep` for `components/X"` misses `from "../X"` and
     will report live components as dead.
  8. **The home studio section now carries the founder block too** (owner's request): name,
     role, both paragraphs and the "In his words" quote, using `/about`'s own `sd*` classes so
     the same person is set the same way in both places. **This repetition is fine and the
     /studio one was not** — a homepage section previewing its own detail page and linking to
     it is normal; two competing top-level pages is not. `/about` is the canonical copy;
     **edit both together**. Verified by diffing the rendered markup: name, role, label, quote
     and both paragraphs match character for character.
     Fixed while there: the lede read "a ninety-nine-space rollout across sixteen states" —
     the demo's figure. Derived now (104 / Geetanjali / 15). `.studioMeta` went with it.
  9. **Spacing pass on that block, four fixes worth recording:**
     - **`.sdQuoteMark` needs `font-style: normal`.** The label sits INSIDE the italic
       `<blockquote>` and inherited the slant, so "IN HIS WORDS" rendered italic next to the
       quote instead of reading as a label above it.
     - **One measure for the column.** Lede 48ch, founder copy 52ch, divider full-width — so
       the rule ran a long way past the text it separated. All 52ch now.
     - **`margin-top: --s3` + `padding-top: --s3` stacked to 80px** of dead space between the
       lede and the founder's name. 30 + 30.
     - **`.studio` is 400px + a 3/4 portrait**, up from 360px + 4/5. The right column roughly
       doubled when the founder block moved in, and the shorter image left a well of white
       beside the quote. `align-self: start` lives on `.studioImg`, not as `align-items` on
       the grid, so only the photograph is pinned.
     `/about`'s Founder block shares all of these — it uses the same `.studio` / `.studioImg`
     / `sd*` rules, which is the point.
  10. **The home studio section is one subject now: the founder.** The "We started in Delhi
     building one salon at a time…" lede that opened it **moved to `/about`**, as the first
     paragraph of the intro. Above the founder it split the column into a paragraph, a rule,
     and a second unrelated paragraph block — spacing tweaks could not fix that because the
     problem was two subjects in one section, not the gaps between them.
     `.studioLede`, `.studioMeta` and the `.studioFounder` divider wrapper are all gone;
     `.sdQuote + .covLink` now carries the space before "More about the studio".
     The lede's numbers are still derived — `/about` imports `brandsByCount()` for them.

- **Phase 23 — CTA band on brand colour, rating stars on the testimonials**
  1. **`.ctaBand` is `--surface-soft` — light, floating, with a shadow.** Getting here took
     three tries and the reason is structural, not taste:
     - `--surface` (#151515) — the only near-black block on a blue-chrome site.
     - `--primary`, to match the theme — **wrong**: the footer is `--primary` too, so the band
       and the footer merged into one undifferentiated slab, and the contact card (white at 8%
       on blue) all but disappeared inside it.
     - `--surface-soft` — right direction, still wrong: at **1.08:1 against the white page**
       it has effectively no edge, so the band read as unstyled page rather than a block.
     - `#E7ECF7` (**1.18:1**) with `--sh-mid` — quiet, but the block has a shape.
     **Two adjacent full-width blocks cannot share a background and stay readable.** That is
     the rule; the specific colour is downstream of it.
     The §3.9 inset float and bottom margin are back, since the band no longer needs to dock
     into anything. Padding `--s5` → `--s4` (48px on phones) — at 120px the band was taller
     than the content needed.
     `#E7ECF7` is **the one raw hex in home.css**, noted in that file's header: a deeper tint
     of the same blue-grey surface family, not a second accent (§1). Promote it to a token if
     anything else needs it. `--sh-mid`, not `--sh-soft` — soft is a 4%-black haze that a
     block this size swallows whole.
  2. `.bWhite` / `.bGhost` are built for dark grounds — a white pill and white outlined text
     both vanish on the light band. Re-coloured **scoped to `.ctaBand`**, the same way
     `brand-page.css` re-colours `.bWhite` for its white CTA. The contact card is white with a
     border, a soft shadow and a hover lift (cancelled under `@media (hover: none)`).
     Contrast measured on `#F4F6FA`: `--text` 19.4:1, `--muted` 5.3:1, `--primary` 7.2:1 — all
     pass AA, which the translucent-white-on-blue version did not.
  3. **Stars on the testimonial cards come from a `rating` field**, not a hardcoded five — drop
     the field from a row and that card renders no stars. One `role="img"` label per row
     ("Rated 5 out of 5") with the five glyphs `aria-hidden`, so a screen reader hears the
     rating once instead of "star" five times.
     Amber `#f5a623`, the one colour outside the palette: a blue star does not read as a rating.
     Scoped to `.qStars` only. Empty stars are the same amber at `.35` opacity so a 4-of-5 reads
     as one missing rather than two different icons.
     **The schema was not touched** — see the `reviewJsonLd` note above for why.

- **Phase 24 — `/services` rebuilt in the site's language**
  1. It was the last page still on pre-redesign styling: a tinted full-width hero, boxed cards
     with icon chips, a filled arrow button. Now the same primitives every other page uses —
     `.wrapx` gutters, `.sec`/`.band` hairline breaks, `.link`, photographs in `--r-card`
     frames — as an editorial hero plus one alternating photo/copy row per service and a
     closing CTA.
  2. **Counts are derived (§7).** `SECTOR_FOR` in `services/page.js` maps a service slug to the
     sector label in the project data — the two vocabularies differ (`salon` vs
     `"Salon and studio"`) and that map is the only thing joining them. Each row prints its
     real total, linked to `/projects`: **185 salon · 6 commercial · 1 residential**.
     ⚠ **Residential shows 1**, because the owner's 192-row list contains exactly one
     residential project. If more residential work exists it is missing from the list, not from
     this page — fix the data, never the number.
  3. Content in `lib/data/services.js` is untouched (§0) — presentation pass only. That file
     stays the single source for the home section, these rows, the detail pages and the sitemap.
  4. `styles/services-all.css` was replaced wholesale and every class is `svp`-prefixed. Safe
     because nothing else used the old names: the detail page's list is
     `.service-features-grid` from `service-detail.css`, a different rule despite the similar
     name. **Side effect worth knowing:** `services-all.css` no longer defines `.service-icon`,
     so the `.service-item .service-icon` scoping in `services.css` (Phase 10.6) is no longer
     defending against anything. Harmless, and safe to simplify if that file is next touched.
  5. Alternating sides use `data-flip` on the row, not `:nth-child` — order comes from position
     in the data, so adding a service cannot silently flip every row after it. The image stays
     FIRST in the DOM either way, so reading order is photo-then-copy for a screen reader and
     on mobile; only the visual column swaps, and the flip is cancelled below 1000px.
     Verified: one `<h1>`, no heading skips, all 5 internal links 200.

- **Phase 25 — `/projects` header + filter alignment**
  1. **The count block read as cramped because the number and its label were set as two
     unrelated things that happened to touch.** A 104px digit baseline-locked to a 16px
     two-line label with an 18px gap: the label's second line dropped *below* the number's
     baseline, so the pair had no shared edge anywhere. Now `align-items: center` with a
     28px gap and a `.pcountL::before` hairline sitting in that gap — at 76px against 15px a
     gap alone is not a join, the rule is what says the label belongs to the number.
  2. **The number was 104px against a 42px `<h1>`** — two and a half times the page title, so
     the eye landed on the count before the heading it was supposed to support. Capped at
     `clamp(48px, 6.4vw, 76px)`: still the largest thing on the page, no longer competing.
     `.pcount` margin-top `--s2` → `--s3` for the same reason.
  3. **The filter chips did not line up with the rows they filter.** `.projects-page` pads to
     60px but `.project-index-wrap` is a centred `max-width: 1180px` column, so on a wide
     screen the chips started ~190px left of the first row's left edge. `.pfilters` and
     `.pfilterCount` now carry the same `max-width: 1180px; margin-inline: auto`.
     **Anything else added between the header and the index needs the same measure** — the
     page's own padding is not the content column.
  4. `.pfilterCount` had 16px above and nothing below, so "Showing N of N projects" sat
     directly on the index's top hairline and read as part of the first row rather than as a
     caption for the chips. `margin: 16px auto var(--s2)`.
  5. Under 600px the pair stacks and the hairline is hidden — stacked, it would sit beside a
     centred line instead of between the two halves.

- **Phase 26 — runbook execution: link/metadata bugs, form hardening, dead-code sweep, QA (2026-09-10)**

  Driven by two external documents that are **not in this repo**: `arch-site-analysis.md`
  (a page-by-page audit) and `arch-agent-runbook.md` (13 phases derived from it). The
  owner scoped this session to the runbook's **Phases 0–6 plus 13** and declined 7–12
  (the "premium" rebrand, the Sanity migration, growth work). See "Runbook status" below
  for exactly what that leaves.

  Two standing decisions made before any code changed, worth carrying forward:
  **(a)** where the runbook contradicts a decision recorded in this file, this file wins
  and the conflict is raised rather than silently applied — every such conflict lives in
  the declined Phases 7–9 (topbar removal, dropping the Call/Email/ScrollTop buttons,
  removing the testimonial stars, `/costing` noindex, a new `/brands` route that Phase 21
  already rejected). **(b)** Nothing was committed, on the owner's instruction.

  1. **Four dead `/#contact-form` links → `/contact`.** The form moved off Home in Phase 7
     and four links were never swept: `Navbar.jsx` (on *every* page), `services/[slug]`,
     `blogs/[id]`, `not-found.js`. A fifth occurrence in `Hero.jsx` was left alone — dead
     component, same-page anchor, deleted later in this phase. If you grep for this,
     expect five hits and four fixes.
  2. **`HomeHero` rollout figures derived.** The sub-copy read "a 99-space national rollout
     across sixteen states" — the old demo dataset's numbers, stale since the 192-row list
     landed in Phase 15. Now `brandsByCount()[0]`, exactly as `/about` already did it:
     **104 spaces across 15 states**. The component was already importing `PROJECT_STATS`
     for its stat row, so the data was one line away the whole time.
  3. **`/contact` hours derived from `BUSINESS.openingHours`** (was a hardcoded string).
     The footer prints 24h (`Mon–Sat · 09:30–18:30`); this page has always printed the long
     form. A local `to12h()` keeps that, so **only the values moved to the data — the
     rendered text is byte-identical to before**. Don't "unify" the two formats; they
     differ because the contexts do.
  4. `layout.js` — `ToastContainer` width `380px` → `min(380px, 92vw)`. It overflowed a
     360px phone.
  5. **`Contact.jsx` surfaces the server's own error text** (`data.error || …`) instead of a
     generic "Failed to send request". Safe because the route only ever returns vetted
     strings — it never echoes a raw upstream error. Success copy is now
     "Thank you — we'll be in touch shortly." The runbook proposed "we'll reply within one
     working day"; the owner chose the version that promises nothing the studio has to keep.
  6. **Duplicate `organizationJsonLd()` removed from `page.js`** — `layout.js` already emits
     it site-wide, so Home carried two identical nodes. Verify this by comparing Home's
     count against `/about`, not by counting `"@type":"Organization"` — three of those on
     Home come from `reviewJsonLd`, and Next inlines each script twice (HTML + flight
     payload), so raw counts mislead.
  7. **`BrandWall` preview shows the brand's newest photograph** instead of "photograph to
     be collected" for all 66 brands including the ones we have shot.
     **The map is derived on the SERVER in `page.js` and passed down as a prop.**
     `BrandWall` is `"use client"`; calling `getProjects()` inside it would pull all 34
     static image imports into the client bundle. `.pvFrame` was already
     `position: relative`, so no CSS change was needed.
  8. **Home had no `metadata` export at all** — the single most-linked page inherited
     `layout.js`'s generic title and one-line description. Added title, canonical, OG, and
     a description derived from `PROJECT_STATS` so it cannot drift the way item 2 did.
  9. `sitemap.js` — `lastModified: new Date()` removed from all 57 URLs. A date that
     changes on every deploy is noise. Only the three blog posts carry one now, from
     `blog.date`.
  10. **`public/og-image-landscape.jpg` (new, 1200×630).** `og-image.jpg` is 1200×**1600**
     portrait, which social cards crop badly. The portrait original is **untouched** —
     the landscape file sits alongside it rather than replacing it.
  11. `blogs/[id]` hero — added `priority` + `sizes="(max-width: 900px) 100vw, 900px"`.
     It is the LCP element and had neither. 900px because `.blog-details .container` is
     `max-width: 900px`; the runbook said 800.
  12. `ProjectFilters` — empty-state row (`.pfilterEmpty`). **Latent and untestable today**:
     every sector chip has records, so `shown` never reaches 0. It exists so the page never
     shows "Showing 0 of 192 projects" above blank space.
  13. **Contact form + API hardening.** Optional `message` textarea (required would cut
     submissions from people who want a call back but won't write a paragraph), a honeypot
     `company` field, and an in-memory rate limit (5/IP/10min) keyed on `x-forwarded-for`.
     The honeypot div is `sr-only` + `aria-hidden` + `tabIndex={-1}` — **a visually hidden
     field that can still be focused traps keyboard users.** The rate limit is checked
     *before* the honeypot, so a bot hammering the hidden field burns its own quota.
     **The rate limit is correct for THIS deployment only** — one long-lived `next start`
     process on the VPS. On Vercel it degrades to per-instance and is close to no limit;
     that caveat is written into the route, not just here.
     Verified end to end **without sending any email**: the rate limit and honeypot both
     short-circuit before Resend is called, so 400/429/200-honeypot paths are all testable
     locally. A single real send to the live inbox was run separately and returned 200.
  14. **Dead-code sweep — 239 files removed.** 14 components (`Achievement`, `Clients`,
     `FAQ`, `Founder`, `Hero`, `HowWeWork`, `Loader`, `NewCollection`, `Portfolio`,
     `PortfolioSkeleton`, `Services`, `Team`, `Testimonials`, `ViewProjectsButton`),
     3 data modules, 2 superseded scripts, 14 CSS files, 5 image folders and the
     individually-verified orphans. **`public/` 54 → 23 MB · CSS 38 → 24 files ·
     components 34 → 20.** `SanityImage.jsx` and `lib/cms/queries.js` were kept — they are
     waiting for the migration, not dead.
     **How the CSS was verified, because file-name matching is not enough**: every class
     token was extracted from the `className` attributes of the *surviving* JSX and each
     candidate file checked against that set. Every apparent match was a false positive —
     mostly the `import "./styles/x.css"` line in `layout.js`, plus substrings like
     `active` inside `is-active`. The two files that really did contain `.active` scope it
     compound (`.faq-item.active`, `.view-projects-btn.active`), so neither could reach
     Navbar's bare `.active`. **Deletions are archived** (see "Recovery archives" below).
  15. **`hero.webp` — re-encoding at a higher quality made it BIGGER.** 6144×3240 against
     `optimize-images.js`'s 2560 cap; at q82 the 2560px version came out 404 KB against the
     original's 359, because that original was encoded at a lower effective quality.
     Swept qualities and settled on **q78 → 347 KB at 2560×1350** — smaller *and* inside the
     cap. **Never assume downscaling shrinks a file; measure both ways.**
     `hero4.png` (a 550 KB PNG of a photograph) → `hero4.jpg`, 153 KB; the `HomeHero` import
     moved with it.
  16. **The `watermark-images` re-encode was run and then reverted.** The runbook wanted the
     six files over 400 KB re-encoded at ≤2000px/q80. They are already 1500×2000, so the
     resize is a no-op and it is pure recompression — which saved **4 KB across all six
     files (0.14%)** in exchange for a generation of JPEG damage to the only 34 photographs
     the business has. Originals restored, verified **6/6 byte-identical**. These are
     *source* files: `next/image` serves AVIF derivatives, so their size costs build time,
     not delivered bytes. **Don't try this again without new evidence.**
  17. **`react-countup` and `framer-motion` uninstalled** — zero imports after item 14
     (framer-motion was already stripped from the reveal system in Phase 10.11).
     **`react-icons` is still alive** in 7 files. A first check missed them because they are
     subpath imports (`react-icons/fa`, `/io5`, `/bs`) — grep for `from ['"]react-icons`,
     not for the bare package name. Retiring it is Phase 10 work (lucide migration).
  18. **Fixed in passing — 10 detail pages linked to brand pages that don't exist.**
     `projects/[id]` built `/projects/brand/${slug}` by hand, guarded only on the slug
     existing (eyebrow) and on `count > 1` ("See all N"). Phase 21 raised the collection
     threshold from 1 to 3 and updated `brandHref()`, `sitemap.js` and `BrandWall` — but not
     these two. Both now route through `brandHref()`, which already owns the rule.
     Two details: `brandHref()` sends a 1–2 project brand to its own project page, which on
     *that* page is a self-link, so the eyebrow renders as a plain `<span>` when the target
     equals the current URL; and `.pdBrand:hover` is now `a.pdBrand:hover`, because a hover
     underline on non-link text is a false affordance. The "See all N" line is **suppressed**
     below the threshold rather than repointed — "See all 2 Trendz projects" landing on a
     single project is wrong copy even with a working link.
     **Phase 21's own note says it verified "every tile target and every sitemap URL"** —
     detail-page brand links were in neither set. A link crawl is the only thing that
     catches this; the build stays green either way.
  19. **The portrait mobile hero was missing and is restored.** Phase 10.13 documents it in
     detail; the Phase 19 home rebuild dropped it, so phones were getting the wide landscape
     slideshow cropped to a strip. `.xheroMob` renders `mob1.jpg` below 768px and `.xheroImg`
     is hidden there — the same 768px line the header uses.
  20. **The trap that cost two attempts, and the reason `sizes` on the two heroes looks odd:**
     `next/image` emits a `<link rel="preload">` for **both** `priority` *and*
     `loading="eager"`, and that preload fires before CSS can hide anything — so an eager
     mobile hero is downloaded on desktop and vice versa. Dropping `eager` fixed that but
     made the mobile hero **lazy, and it is the LCP element on a phone** — Lighthouse scored
     home-mobile 73 and flagged `lcp-lazy-loaded`.
     The fix is art direction in `sizes`: each hero declares a **1px slot on the viewport
     where CSS hides it**, so the browser picks the 16w candidate there and the full-bleed
     one only where it renders.
     ```
     wide slides : sizes="(max-width: 767px) 1px, 100vw"   priority on slide 0
     mobile hero : sizes="(min-width: 768px) 1px, 100vw"   priority
     ```
     Measured: **home-desktop 93 → 99, LCP 1.4 s → 1.0 s**, and `lcp-lazy-loaded` gone.
     Home-mobile went 73 → 76 with LCP flat at ~5.5 s — **that is within run-to-run noise
     and mobile performance was NOT fixed**; the bottleneck there is a 264 KB hero over
     simulated 4G, not the attribute. **If you touch either hero's `sizes` or `priority`,
     re-derive both and re-run Lighthouse on mobile *and* desktop.**
  21. **14 routes had no `og:image`** — sharing them showed no preview picture.
     Eight source files had an `openGraph` block with no `images` key (`/projects`,
     `/blogs`, `/clients`, `/costing`, `/contact`, and all 7 brand pages); the two legal
     pages had no `openGraph` block at all. Static routes now use the landscape file from
     item 10. **Brand pages use their own hero photograph**, from the same derivation the
     page body already runs — a Geetanjali link previews a Geetanjali interior.
  22. **Full QA sweep, 58 routes, against a production server (`npm run build && npm run
     start`), not dev** — the distinction Phase 9.5 insists on. Exactly one `<h1>` per
     route, zero heading-level skips, `<title>`/description/canonical/`og:image` complete,
     **zero inline `opacity:0`** in SSR HTML, and every route carrying real text without JS
     (the Phase 10.11 regression check). Link crawl: 57 pages, 56 distinct internal hrefs,
     **0 non-200**. Image requests: 150 srcs, **0 broken**.
     Lighthouse, 10 runs (5 pages × mobile/desktop): **SEO 100 and CLS 0 everywhere**,
     accessibility 92–93, best-practices 96. Desktop 99–100 across the board.
     Mobile performance 70–91 — see item 20; the remaining flags are image weight
     (`uses-responsive-images`, `image-delivery-insight`) on 1500×2000 sources and
     `dom-size` on the 192-row index, which is the design. **Neither is a code fix**; both
     resolve with the Sanity CDN migration.

  **Recovery archives** (session scratchpad, not in the repo — copy them somewhere durable
  if the deletions in items 14–16 ever need reversing):
  `phase5-deleted-<timestamp>.tar.gz` (30 MB, 239 files) · `phase5-manifest.txt` ·
  `phase5-reencoded-originals.tar.gz` · `phase5-watermark-originals.tar.gz`.

- **Phase 27 — dead-code residue and image srcset granularity (2026-09-10)**

  Phase 26 removed whole *files*. This pass looked for dead code *inside* the files that
  survived, and for the remaining byte-level waste. The headline is that there was very
  little left: **~60 lines of code and 3 CSS rules.** The optimisation work is now almost
  entirely about image bytes, which is a CDN problem, not a code problem.

  1. **`makePlaceholders` / `buildPlaceholders` machinery removed from `projectSource.js`**
     (~37 lines). Built in Phase 12 to review the index at ~187-row scale *before the real
     data existed*; the list has been 192 real rows since Phase 15, so `missing` computed to
     0 and it produced nothing even with `NEXT_PUBLIC_SHOW_PLACEHOLDER_PROJECTS=1`.
     That env var no longer exists anywhere. The file's own comment had already authorised
     this ("delete it whenever the file is next touched"). 220 → 183 lines.
  2. **`homeServices` deleted from `lib/data/services.js`** — its only consumer was
     `components/Services.jsx`, deleted in Phase 26. The header comment's consumer list was
     updated with it, so the file no longer advertises a reader that does not exist.
  3. **`hasCollectionPage()` deleted from `projectStats.js`** — no callers;
     `brandsWithCollectionPage()` and `brandHref()` cover every use.
  4. **`stateFromLocation()` un-exported, not deleted** — it has no external callers but is
     used internally at the top of `toRecord()`. Worth stating because a dead-export scan
     reports it exactly like the two above.
  5. **Three dead CSS rules removed**, with their media-query overrides: `.blogs-section`
     (blogs.css, plus 3 breakpoint overrides), `.clients-cta` (clients-page.css, plus a
     576px override), `.mobile-cta` (navbar.css). That is 3 of **285** top-level class
     selectors across the 24 stylesheets — the Phase 26 sweep left the CSS in good shape.
  6. **`public/hero.tmp.webp` (404 KB) deleted** — a temp file left behind by a failed
     re-encode in Phase 26. `public/` 23 → 22 MB.
  7. **⚠ The dead-CSS scan produces false positives and four classes nearly went with the
     three above.** `.tile`, `.client-tile--wide`, `.pcard--static` and
     `.project-row--placeholder` are all built inside template literals —
     `` className={`tile${b.count >= BIG_BRAND_THRESHOLD ? " big" : ""}`} `` — so a scan
     that only reads `className="…"` string literals reports them as unused. Deleting them
     would have broken the brand wall and every unlinkable index row, silently, with a green
     build. **Any future CSS sweep must resolve template literals**; this is the fourth
     time global CSS has produced a misleading signal in this repo.
  8. **`images.deviceSizes` added to `next.config.mjs`** —
     `[360, 420, 640, 750, 828, 1080, 1200, 1920, 2048, 3840]`. Next's default starts at
     640px.
     **The rationale that motivated this turned out to be wrong, and the comment in the
     config says so.** It does *not* fix Lighthouse's "properly size images" — that audit
     reported **180 KB on Home mobile both before and after**, because a 412px viewport at
     DPR ~1.75 needs ~721px, so the browser picks `w=750` either way and never reaches the
     new entries. Kept because the measured effect is still positive, just modest:
     Home mobile **840 → 818 KB, perf 76 → 80, LCP 5.6 → 5.3 s**; desktop
     **1246 → 1214 KB**, perf unchanged at 99.
     **Every `sizes` attribute was audited against its CSS grid at every breakpoint and all
     18 are correct** — including `SelectedProjects`, which looks wrong (`100vw` at ≤680px)
     until you check that `.grid` really is a single column there. The residual "oversized"
     number is the audit comparing delivered pixels to the CSS box without full DPR credit.
     **Don't chase it in code; it resolves with the Sanity CDN migration.**
  9. **⚠ The first measurement of item 8 was taken against `next dev` and was garbage** —
     it reported page weight *doubling* to 1,828 KiB and perf collapsing to 55. The tell was
     in the resource list: `next-devtools` chunks and a 441 KB unbundled
     `node_modules_react-icons_fa_index_mjs`. An IDE-launched dev server had taken port
     3000, so every `npm run start` after it silently failed to bind and exited, and the
     harness reported those as "completed".
     **This is the exact trap Phase 9.5 recorded, walked into again.** Two checks that make
     it cheap to avoid, and both should be run before trusting any Lighthouse number here:
     `netstat -ano | grep :3000` to see what actually owns the port, and
     `curl -s localhost:3000/ | grep -c next-devtools` — **any non-zero result means you are
     measuring dev.** Every figure in item 8 is from a re-run after killing that server.

  10. **The hero cross-fade flashed WHITE between slides, and the fix is structural.**
     Reported from the live page. Cause: the keyframe put the fade-**in** at the END
     (`95.83% -> 100%`) with delays of `0/6/12/18s`. `animation-fill-mode` defaults to
     `none`, so a slide with a positive delay uses its BASE rule until that delay elapses —
     `opacity: 0`. Slide 1 therefore faded out over 5-6s while slide 2 was still sitting at
     0 waiting to start, and for a full second **no slide was on screen** and the page
     showed through. From the second cycle onward the wrap-around fade-in lines up and it
     looks correct, which is exactly why it read as intermittent rather than broken.
     **`animation-fill-mode: backwards` is NOT the fix** — it applies the 0% value during
     the delay, and in the old keyframe that was `opacity: 1`, stacking all four images at
     load.
     The fade-in moved to the START of the keyframe (`0% -> 4.1667%`) and the delays became
     `-1s / 5s / 11s / 17s`, so each slide's 1s fade-in overlaps the previous slide's 1s
     fade-out exactly. Slide 1's delay is **negative** so it enters already at opacity 1 —
     no fade-up from nothing on load — and its 23s wrap lands against slide 4's fade-out.
     Slide 1 keeps `opacity: 1` in its base rule (Phase 19.3) and reduced-motion still
     cancels to a still hero. `.xheroImg` also got a dark base colour so any future timing
     slip shows the overlay's own dark ground rather than white.
     **Cycle length, the four keyframe percentages and every delay must move together** if a
     slide is ever added or removed; the header comment on that block spells out the
     arithmetic.
     **Runbook Phase 9 would delete this cross-fade entirely** in favour of a single still
     hero. That is a design decision, not a bug fix, and it is currently declined — but if it
     is ever taken up, this repair goes with it. Do not do both.
  Verified after all of the above, against a confirmed production server (0 devtools
  markers): build green, 59 pages, the 58-route QA sweep clean (one `<h1>` each, no heading
  skips, title/description/canonical/og:image complete, zero inline `opacity:0`, real
  content without JS), and a link crawl of 57 pages / 56 links with **0 non-200**.

  **Deliberately not done — per-route CSS splitting.** All 24 stylesheets still load on all
  59 routes: 80 KB raw, ~15 KB compressed, of which Lighthouse says **11–13 KB is unused on
  any given page**. Moving each `import "./styles/x.css"` out of `layout.js` and into the
  route that owns it is mechanical, but every stylesheet here is global and classes leak
  across components (see item 7 and the `.projects-header span` collision in Phase 21.6), so
  a route that stops importing a file it quietly depended on breaks with a green build. It
  is worth doing behind a per-route visual check, not as a blind move — and it is worth
  ~13 KB, against ~180 KB sitting in image weight.

### Runbook status — what is done and what is left

`arch-agent-runbook.md` (not in this repo) defines Phases 0–13. As of 2026-09-10:

| Runbook phase | Status |
|---|---|
| 0 — baseline + key rotation | ✅ analysed. `.env.local` **never committed** — verified by scanning every commit for a `re_…` pattern, zero hits. Rotation steps written; **the key itself is still live and unrotated.** |
| 1 — critical bugs | ✅ all 7 |
| 2 — SEO metadata | ✅ all 6 |
| 3 — placeholders | ⚠️ item 1 **declined by the owner** — the gallery strip's "Photograph to be shot" tiles stay. **Item 2 was declined, then reversed on 2026-09-17: the "Completed: To be confirmed" row is now REMOVED** (see Phase 20 item 4). Item 3 done, item 4 verified. |
| 4 — contact form + API | ✅ all 5 |
| 5 — dead code + assets | ✅ except the watermark re-encode, run and reverted (item 16) |
| 6 — git history rewrite | ⏸ **analysed, not executed.** See below. |
| 7 — typography + design tokens | ❌ declined (scope) |
| 8 — remove volume signals, copy rewrite | ❌ declined (scope) |
| 9 — layout, hero, motion | ❌ declined (scope). **Note the tension with Phase 27 item 10:** this phase would DELETE the hero slideshow outright ("one still image … remove the SLIDES array, the `.xheroSlide` keyframes"). Phase 27 instead kept it and fixed its cross-fade timing. Running Phase 9 later throws that fix away — which is fine if the still-hero design is chosen deliberately, but should not happen by accident. |
| 10 — rebuild `/services/[slug]` + `/blogs/*`, drop `react-icons` | ❌ declined (scope) |
| 11 — Sanity CMS + CDN (a–d) | ❌ declined (scope) |
| 12 — growth: location pages, GA4, per-route CSS | ❌ declined (scope) |
| 13 — final QA | ✅ all 6 |

**Phase 6 is ready to run and deliberately was not.** Measured: `.git` is a **258.91 MiB**
pack, of which **`public/images/` is 258.1 MB — 95.3%**; all the actual source code is
**1.8 MB**. 86 commits, one committer. `git filter-repo --path public/images
--invert-paths`, then re-add the current tree as one commit and force-push, lands it at
roughly **25 MB** (nearer 3 MB if photography moves to Sanity instead of back into `public/`).
Prerequisites: `pip install git-filter-repo` (**not installed**), and a `git clone --mirror`
plus a tar of `public/images` first, because the rewrite discards every SHA and every tag.
**The runbook omits the precondition that matters most here: deployment is
`git pull` on the VPS, so after a force-push the server must be RE-CLONED, not pulled.**
Do this before the Sanity migration, not after.

**Also outstanding, both needing the owner:** rotate `RESEND_API_KEY` (it was shared inside
an archive and still works), and confirm the test email that was sent to the live inbox
actually arrived — a 200 from the route only proves Resend *accepted* it.

## Before committing

`npm run build` must pass. There are no tests, no linter config, and no CI — the build is the only
gate. Commit messages in history are all "add"; write real ones.
