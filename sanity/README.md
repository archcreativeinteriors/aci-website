# Sanity

Everything for the **Sanity Studio**, which since Phase 6 (2026-09-28) holds **all** of the
website's content. The website imports nothing from this folder.

```
sanity/
  schemas/           brand, project, service, legalPage; singletons siteSettings, homeHero,
                     homePage, homeSelectedProjects, clientLogos, aboutPage, founder,
                     costingPage; collections teamMember, testimonial, faq, blogPost
  scripts/           backup.mjs (npm run sanity:backup)
```

## The website's half is `src/app/lib/content/`

There are two folders, one per **deployable**, and they are not interchangeable:

| Folder | What it is | Ships with |
|---|---|---|
| `sanity/` | the Studio: schemas and the backup script | `sanity deploy` |
| `src/app/lib/content/` | the website's data layer: client, queries, one getter per content area | `next build` |

`DATA_SOURCES.md` (repo root) lists every content type, its query and the pages that use it.

The Studio is a **standalone deployable**, not a route in the Next app (see the top of
`sanity.config.js` for why it is not embedded).

## Why `sanity.config.js` and `sanity.cli.js` are at the repo root

**Tested, not assumed** (2026-09-23). `sanity build` has no `--config` flag; the CLI finds
its config from the working directory. Moving both files into `sanity/` and running from the
repo root gives:

```
ProjectRootNotFoundError: No project root found
```

…and running the CLI from inside `sanity/` instead gives:

```
Error: Failed to read "C:\dev\arch\sanity\package.json"
```

The CLI treats the config's own directory as the project root and requires a
`package.json` beside it. So moving them in would mean making `sanity/` a **separate npm
package**, with its own `package.json` and dependencies. That is more machinery than two
well-named files at the root, so they stay.

## Scripts

```bash
npm run sanity:dev               # the Studio on localhost:3333
npm run sanity:deploy            # publish the Studio to <projectId>.sanity.studio
npm run photos:upload            # dry run: the owner's photo folders -> project photos
npm run photos:upload -- --apply # upload (needs SANITY_WRITE_TOKEN)
npm run sanity:backup            # export everything (read-only) to C:\Backups\arch-sanity
```

`npm run build` does not run these scripts, so a broken path in one only shows up when you
run it. Run it as a dry run after changing it.

The content-pack tools (`sanity:scaffold`, `sanity:import`) and the one-off migration
scripts (`sanity:seed`, `sanity:pages`, `scripts/migrate-content.mjs`) worked on the old
local files and are in `archive/`.

## Status

**All content is in Sanity, and the site reads nothing else** (2026-09-28). There is no local
fallback: a missing required document stops the build with a message naming it.

- Document ids never contain a dot (a dotted id is private and invisible to the site). The
  ids are `project-<list number>`, `brand-<slug>`, `service-<slug>`, and
  `legalPage-privacy-policy` / `legalPage-terms`; a singleton's id is its type name.
- A project gets its own page when its **Status** is `published`.
- **Project photos live only in Sanity.** Add them in the Studio, or in bulk from the
  owner's folders with `npm run photos:upload`.
- Sanity images reach visitors through our own `/_next/image`, never `cdn.sanity.io`
  directly (the privacy policy says so; see components/SanityImage.jsx).
- Content changes go live only with a rebuild, because the site is fully static. Deploy with
  `npm run build:safe`: if Sanity cannot be reached, the build stops and the live site keeps
  running on the previous build.
- A `staging` dataset (a copy of production, 2026-09-28) is kept for testing changes first.

## Backups

`npm run sanity:backup` runs `sanity dataset export`, which saves every document, draft and
image to `C:\Backups\arch-sanity\production-YYYY-MM-DD_HHMM.tar.gz`. It keeps the newest 8.

- **Schedule:** Windows Task Scheduler runs it every Sunday at 11:00 on the owner's PC, as the
  task "Arch Creative - Sanity backup". If the PC was off, it runs at the next chance.
- **Log:** `backup.log` in the same folder gets one line per run.
- **Off-site copy:** copy the folder to cloud storage or an external drive now and then. It sits
  on the same disk as everything else.

Restore (this WRITES to Sanity, so only with the owner's OK):

```bash
# look first: restore into a new, empty dataset
npx sanity dataset create restore-test
npx sanity dataset import "C:\Backups\arch-sanity\production-….tar.gz" restore-test
# replace production (documents with the same id are overwritten, others are kept)
npx sanity dataset import "C:\Backups\arch-sanity\production-….tar.gz" production --replace
```
