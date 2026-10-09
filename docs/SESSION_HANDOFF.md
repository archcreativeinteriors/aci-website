# SESSION_HANDOFF

Context for continuing work on the Arch Creative Interiors site.
Last session: 2026-09-10 → 2026-09-14.

**Read `CLAUDE.md` first — it auto-loads and documents Phases 1–27.** This file
is only the delta *after* Phase 27 plus the standing constraints. Do not
re-derive anything CLAUDE.md already records.

---

## Standing constraints (carry these forward)

- **Nothing is committed, ever, unless asked.** Owner has said "no commit
  currently" repeatedly. Branch `phase-1-critical-bugs` has **0 commits**.
- **Do not deploy.** Owner: "I don't deploy — you handle it" = work on branches only.
- **`RESEND_API_KEY` is live and unrotated** (leaked via an archive, never
  committed). Never print its value.
- **Port 3000 is the owner's IDE dev server.** Do not kill it. Run production
  checks on **3100** (`npx next start -p 3100`). Always verify with
  `curl -s localhost:<port>/ | grep -c next-devtools` → must be `0`, else you are
  measuring dev (this trap has been hit twice; see CLAUDE.md Phase 27.9).
- Owner declined runbook Phases 7–12. Phase 6 (git history rewrite) analysed, not run.

---

## Work done after Phase 27

### 1. Sanity content-pack review (files live in `C:\Users\Admin\Downloads\`)

Reviewed `sanity-content-pack.md` (owner's handover spec, **not in repo**).

- **Corrected `sanity-project-manifest.csv`.** Its `photos_status` column was
  derived from a brand-name heuristic and was wrong. Truth, measured from the
  actual image files: **21 of 34 project photographs carry a third-party
  "Protected with trial version of Visual Watermark" banner**, 13 are clean —
  not the 26/8 split the pack claimed, and not the same files. 7 of the 8 it
  called clean are stamped.
- Wrote `sanity-content-pack-review.md` — full findings + the Sanity-connection
  addendum.
- Created `aci-recovered-originals/` — 36 clean originals pulled out of the
  Phase 26 deletion archive before the scratchpad cleared, with a README.
  **3 are content-verified replacements** for stamped live files
  (`aloevera-salon-noida` → project 175, `black-express-salon` → 136,
  `toni-and-guy` → 173). The other 18 stamped photos exist **nowhere** — not in
  the working tree, not in any of 86 commits. Only the owner has them.

Also corrected: the pack's claim that brand spelling variants "import as
separate brands" is false — `scripts/import-projects.js` already normalises them
(`Bon Tamps Salon` → brand `Bon Temps`, `Tony & Guy Salon` → `Toni & Guy`), which
is why the count is 66 not 70. Variants survive only in *project names*.

### 2. Sanity layer wired up (was written but unconnected)

| File | State |
|---|---|
| `sanity.config.js` | **NEW** — standalone Studio, not embedded at `/studio`. Desk groups projects by brand (104 of 192 are one brand, so a flat list is unusable). Verified by building the Studio against a dummy project id. |
| `sanity.cli.js` | **NEW** |
| `src/app/lib/sanityClient.js` | **NEW** — read client. `isSanityConfigured()` returns false with no project id so `sanityFetch()` returns a fallback instead of throwing. This is what lets the migration be gradual. `apiVersion` pinned to `2024-01-01`. No read token (dataset must stay **public**, which is what lets `cdn.sanity.io` serve images unsigned). |
| `scripts/sanity-import.js` | **NEW**, `npm run sanity:import`. **Dry-run by default**, no creds/network needed. Joins on folder number prefix → `listNo` → `projectsData.js`. Deterministic ids (`project.<listNo>`, `brand.<slug>`) so re-imports update, not duplicate. Brands upload first. Applies the ACI watermark itself. Publishes only with hero + `CONSENT: yes`. Tested against a fixture for all 5 failure modes. |
| `sanity/schemas/project.js` | **+4 fields**: `overview`, `challenge`, `solution`, `features`. They were missing — the import would have parsed that copy and dropped it, migrating all 34 written pages to a spec panel only. |
| `src/app/lib/queries.js` | Same 4 fields added to `PROJECT_BY_SLUG`. |

**Two latent bugs fixed** (dormant — nothing runs these paths yet):
- `SanityImage.jsx` read `image?.asset?.metadata?.lqip`, but the GROQ projection
  **flattens** it to `lqip`. Always resolved `undefined` → every migrated image
  would silently lose its blur placeholder. Now reads both shapes.
- `projectSource.js` `previewUrl()` returned `/_next/image?url=…` for *all*
  sources — for a Sanity asset that is a billed Vercel Image Transformation per
  index row, the exact cost the custom loader exists to avoid. Now branches to
  `sanityImageLoader()` for CDN URLs. Regression-tested: local paths byte-identical.

### 3. 20-point production audit — fixes applied

| File | Change |
|---|---|
| `src/app/layout.js` | `twitter: { card: "summary_large_image" }` only. **Verified in built HTML**: Next auto-derives `twitter:title/description/image` per route, so each page shares its own copy/photo. Do NOT add title/description here — it would replace that on all 14 routes. Also added the skip link. |
| 15 route files | `<main id="main-content" tabIndex={-1}>` — added by script that refused any file with >1 `<main>` or an existing id. |
| `src/app/globals.css` | `.skip-link` styles + `#main-content { scroll-margin-top }` (130px / 98px ≤767px — tracks the `body { padding-top }` header clearance, the only rule clearing the fixed nav). |
| `src/app/lib/data/clientLogos.js` | **`name` on all 82 entries**, read off the rendered artwork, not filenames. `clientLogoAlt()` now takes the entry object, falls back to filename derivation. |
| `src/app/clients/page.js` | Call site → `clientLogoAlt(logo)`. |
| `src/app/privacy-policy/page.js` | Cookies section reworded (cookieless, no banner claim); retention now a concrete **24 months**; Grievance Officer role/channel/response window added. |
| `src/app/terms/page.js` | **NEW "Client names and trademarks" clause** — the site names 66 brands and shows 82 logos and had no clause covering any of it. Plus "Changes to these terms" and a hedge on summary figures. |
| `src/app/styles/navbar.css` | **Bug fix**: line ~309 referenced `/images/new-collection/p3.jpg` as the mobile-menu background, but that folder was deleted in Phase 26 → **404 on every page load**. Replaced with `rgba(0,0,0,0.72)`, identical to the gradient it replaced. |
| `package.json` | Removed dead `projects:build` (script deleted in Phase 26). Added `sanity:import/dev/build/deploy`. |
| `.env.example`, `.gitignore` | `SANITY_WRITE_TOKEN`, `SANITY_STUDIO_PROJECT_ID`; ignore `/dist`, `.sanity`. |

**Why filenames could not be used for logo names:** `la`=La Fleur, `natu`=Naturals,
`health`=HealthSquare, `magn`=Magnolia, `seba`=Sebastiana. CLAUDE.md records this
same folder producing wrong-brand matches three times before.

**New trap worth knowing:** Phase 26 verified dead CSS by extracting *class
tokens* from surviving JSX. That method cannot see a `url()` reference — which is
how `navbar.css` kept pointing at a deleted image. **A CSS sweep must check both.**

### 4. `PRODUCTION-READINESS-REPORT.txt` (repo root, NEW)

Full audit: 4 blockers, 6 high, 5 medium, 9 verified clean, with a sequenced
order of work. Also published as an artifact:
`https://claude.ai/code/artifact/0ba242fb-890a-4845-8ef2-3b82a716ef42`

---

## Owner decisions made this session

- **No GA4.** Owner reversed an earlier "yes" — do not add it.
- **Keep `@vercel/analytics` mounted** even though it 404s on the VPS, so it
  activates automatically on the planned Vercel migration.
- **No cookie consent banner** (follows from no cookie-setting analytics).
- Strengthen legal drafts, but a lawyer still reviews them.
- Twitter cards on all 14 routes · logo names for all 82 · skip link: yes.
- **CTAs: leave as is.** Do not touch the 4-button floating tower.
- robots / sitemap / 404 / titles / descriptions / favicon / canonicals:
  **verified clean, leave alone.**
- FAQ: expand the question set, but **owner approves copy before it ships.**

---

## Current state

- `npm run build` **exit 0**, 59 pages.
- 58-route QA sweep clean (one `<h1>`, no heading skips, metadata complete,
  zero inline `opacity:0`).
- Link crawl: **56 pages / 56 links / 0 non-200**; **137 image srcs / 0 broken**.
- Lighthouse (production, 0 devtools markers): desktop **98 / 93 / 96 / 100**,
  LCP 1.2 s; mobile perf 92 (home), 95 (about), 96 (clients); **CLS 0 everywhere**.
- Git: branch `phase-1-critical-bugs`, **0 commits**, `168 M / 232 D / 57 ??`.
- Deps added: `@sanity/client` (prod); `sanity`, `@sanity/vision`,
  `styled-components` (dev — Studio only, not in the Next bundle).

**Do not report mobile 92 as an improvement.** Phase 27 recorded 80. Nothing
changed can move LCP — that delta is Lighthouse 13.4.1 + machine load. The runs
are not comparable.

---

## Unfinished / blocked

**Blocked on owner:**
1. **18 clean photographs** — the only blocker with no technical path.
2. **Rotate `RESEND_API_KEY`** (may need the teammate who owns the Resend account).
3. **Confirm a contact-form test email actually arrives.** HTTP 200 only proves
   Resend accepted it.
4. **Sanity project ID + write token** — everything else is built and waiting.
5. **Confirm the 24-month retention period** (a commitment the business must keep).
6. **Grievance Officer's name** — deliberately left blank; do not invent one.
7. **Approve FAQ copy** (drafted last session, not shipped — see below).
8. **Two logo names are guesses**: `ps` ("PS Salon" — bare monogram) and `rain`
   ("Rain Rainbow" — mark reads "R·A·I·N" over "RAINBOW").

**Drafted but NOT shipped — FAQ additions** (`src/app/lib/data/faqs.js` untouched):
Do you work outside Delhi NCR? · Can you handle a multi-location rollout? · Do you
handle mall and landlord approvals? — all three derived from real site data, safe
to ship on approval. Two more need owner facts: turnkey scope, and the warranty
period (Stage 5 says "warranties issued" but no term exists anywhere). A cost
question was deliberately not drafted — no published figures exist and a wrong
price inside FAQPage schema is worse than no answer.

Also: `faqs.js` header comment is **stale** — it says "Homepage FAQ content …
rendered by components/FAQ.jsx … emitted on the home page". `FAQ.jsx` was deleted
in Phase 26 and the schema moved to `/about` in Phase 22. Fix when FAQ copy ships.

---

## Exact next steps (in order)

1. **Commit + push the working tree** to `phase-1-critical-bugs` with `-u`.
   457 changes exist only on one disk with no restore point. Pushing a non-`main`
   branch changes nothing live. *Requires owner's OK — standing rule is no commits.*
2. **Upgrade `next` 16.2.4 → 16.3.4.** Installed version is inside the vulnerable
   range `9.3.4-canary.0 – 16.3.2`. Most applicable advisory:
   `GHSA-2xp9-vwfh-vxw4`, RCE in the Image Optimization API **when AVIF is used** —
   and `next.config.mjs` sets `formats: ["image/avif","image/webp"]`. (The CVSS 9.0
   in that set is a *Windows*-host RCE and does not apply to the Ubuntu VPS.)
   Re-run build + the 58-route sweep after.
3. **Check nginx for security headers.** `next.config.mjs` has no `headers()`
   block — no CSP/HSTS/X-Frame-Options/X-Content-Type-Options/Referrer-Policy, and
   `poweredByHeader` is not disabled. **These may already be set in nginx, which is
   on the server and outside this repo — cannot be confirmed from here.**
4. Add `global-error.js` (none exists; a render error falls through to Next's
   default page) and an `engines` field (CLAUDE.md requires Node ≥ 20.9, nothing
   declares it).
5. When the Sanity ID arrives: `.env.local` → `npm run sanity:deploy` →
   `npm run sanity:import -- --dir ../sanity-import` (dry run first) → then swap
   the 3 functions at the bottom of `projectSource.js` to GROQ, and migrate the
   3 files still reading `data/projects.js` directly: `sitemap.js`,
   `components/home/SelectedProjects.jsx`, `projects/[id]/page.js`.

**Known and deliberately unfixed:** accessibility 93 (`color-contrast` on `.tN`
brand-tile captions, `target-size` on footer links, both pre-existing); mobile
image weight (resolves with the Sanity CDN, not in code); `.git` 260 MB vs 22 MB
`public/` (runbook Phase 6 — **note the VPS must be re-cloned, not pulled, after
a force-push**).
