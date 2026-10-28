# Handoff — where the work stands

Last updated **2026-10-28**. Read `AGENTS.md` and `CLAUDE.md` first: their rules apply to you.
This file is the current state only. Update it when something here changes; the history of how
things got this way is in `docs/archive/CLAUDE.full.md` and the Git log.

## Where everything is

| Thing | State |
|---|---|
| Code | `github.com/archcreativeinteriors/aci-website`, branch `main` (fresh history, first commit `a559b8e`, 2026-10-09). Work locally on `new-main`, which tracks `origin/main`. |
| Live site | **Not this code yet.** www.archcreativeinteriors.com is still the previous site on an nginx server. This code is meant for Vercel (`docs/vercel-deploy.md`) and has not been deployed. |
| Content and photos | Sanity: dataset `production` (what the site reads) and `staging` (a copy for tests). No content lives in the repo. |
| Secrets | `.env.local` on the owner's PC only (never committed). Variable names: `.env.example`. |
| Old local branches | 11 branches with the previous history. Kept on the owner's PC for reference only. **Never push them.** |

Folders outside the repo that only exist on the owner's PC (another computer will not have them):
`C:\dev\project-content\` (project-text plans and reports), `C:\dev\aci-repo-audit\` (repository
audit `REPORT.md` + `inventory.json`), `C:\Backups\arch-sanity\` (weekly Sanity exports),
`C:\dev\project-photos-optimized\` (photo staging).

## Done and verified (2026-10-07 → 2026-10-09)

- Unique title and description on every page; absolute canonicals; sitemap with indexable pages
  only; `robots.txt` with the sitemap; one H1 per page. Crawl of the production build: 272 pages,
  0 errors.
- JSON-LD: Organization/LocalBusiness, BreadcrumbList, CreativeWork per project, Article per post,
  FAQPage on `/about`. No ratings, no Review nodes (self-serving).
- **17 permanent redirects** from the previous site's project URLs (`next.config.mjs`); all 44 old
  live URLs reach a page. Keep them.
- Project pages: text sections spaced correctly; photo alt text no longer uses file names; title
  spacing tidied; State links to its state page; the brand pages' "By format" section removed.
- Two phone numbers everywhere (`contact.callNumbers`); email `info.archcreativeinteriors@gmail.com`;
  navbar 64 px; hover states; new 404 page; maintenance mode (`MAINTENANCE_MODE=1`).
- `/projects` (2026-10-21): the sector chips (All / Salon and studio / Commercial / Residential)
  are static labels, not filters — the full list always shows. Clickable version archived at
  `archive/src/app/components/ProjectFilters.before-static.jsx`.
- **Next.js 16.2.4 → 16.4.2** (2026-10-26, owner-approved security upgrade; `sharp` 0.35.5,
  `postcss` 8.5.23, `source-map-js` 1.2.2, `undici` 7.30.1 with it). `npm audit --omit=dev`: 0
  vulnerabilities (was 4, 1 critical). Tested side by side with 16.2.4: all 288 URLs identical,
  all images, redirects, API routes and browser checks the same.
- `/services` (2026-10-27): the three `/services/<slug>` pages were folded into `/services` (old URLs
  308 to `#salon` / `#residential` / `#commercial`; page in `archive/src/app/services/`). Each section
  now has a "What's included / How we work" tab panel (`ServiceTabs.jsx`) and a "Customise your …"
  button → `/contact?type=…#contact-form`, which preselects the Project type. The "Recent … work"
  project strips exist but are switched off (owner, 2026-10-27; `SHOW_RECENT_WORK` in
  `src/app/services/page.js`).
- `npm run projects:content` (scripts/project-content/) writes each project's Overview / Challenge /
  Solution / Features from its own data. Tested on `staging` (157 written). **Not run on production.**

## Waiting for the owner — do not decide these yourself

0. **Homepage hero paragraph — the owner is setting it in the Studio** (2026-10-28). Approved text,
   already set and verified in `staging` (`homeHero.paragraph`): "Arch Creative Interiors designs and
   builds interiors end to end — salons and studios, showrooms, restaurants, offices and homes. From
   concept and space planning to execution and handover, our Gurugram studio has delivered projects
   across India since 2005." No "1000+". Production still has the older paragraph with "1000+".
   The homepage title ("Salon & Commercial Interior Designers, Delhi NCR | Arch Creative Interiors")
   and description are in code (src/app/page.js).
1. **Write the project text to production?** `npm run sanity:backup`, then
   `npm run projects:content -- --dataset production --apply`. 144 projects are empty (2026-10-23
   audit; the owner deleted 15 projects on 21–22 Oct, intended) and show the same short fallback
   lines until this runs. Re-run the dry run first.
2. **Replace the 23 pasted texts?** (`--replace-shared`). Four of them call a non-mall location a
   mall (#175, #172, #165, #136). #116 (Malviya Nagar, **Jaipur**) says "South Delhi" — a one-line
   Studio fix either way.
3. **Old Tweak URL** (`/projects/tweak-salon`): three Delhi Tweak projects fit equally, so it
   redirects to `/projects/brand/tweak`. Change it if the owner knows which one it was.
4. **Founder's name:** the blog author is "Mr. Itender Singh", the About page "Mr. Itinder Singh".
5. **Google Business Profile** must match the site exactly: address, both phones, Mon–Sat 09:30–18:30.
6. **Deploy to Vercel** — the owner's go-ahead is needed; checklist in `docs/vercel-deploy.md`.
   `CONTACT_FROM` must be a Resend-verified domain there (the default sender only delivers to the
   Resend account owner).
7. Small fixes proposed, not yet approved: add `SANITY_STUDIO_DATASET` to `.env.example` and fix
   its old `lib/cms/image.js` path; declare `"engines": {"node": ">=20.9"}`; make
   `photos:upload --apply` require `--dataset`; update line 10 of `DATA_SOURCES.md` (content now
   goes live by webhook, not "only after a rebuild").

## Safe order for the next steps

1. Sanity work: backup → dry run → apply to `staging` → `--audit` + a build against staging
   (`NEXT_PUBLIC_SANITY_DATASET=staging`) → owner reviews → apply to `production` → `--audit`.
2. Code work: on `new-main`; `npm run build` must pass (it is the only check — there are no tests,
   lint or type checking); commit only what the owner approves; push `new-main` → `main`.
3. After the first Vercel deploy: check the 17 redirects and `/sitemap.xml` on the live domain,
   submit the sitemap in Search Console, and watch its Pages report for 404s on old URLs.

## Known quirks

- A build with `NEXT_DIST_DIR=.next-build` appends two `.next-build/types` lines to
  `tsconfig.json`. That is the one change in `git status` right now. Don't commit it.
- Under heavy local load the image optimiser can time out fetching originals from Sanity's CDN
  (seen 2026-10-09, local server only). Re-check on Vercel.
- `scripts/data/*.json|geojson` are referenced by no code; keep them until the owner says what
  they are for.
