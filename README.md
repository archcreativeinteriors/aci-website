# Arch Creative Interiors — website

Next.js site for archcreativeinteriors.com, with a standalone Sanity Studio in the same repo.

```bash
npm ci
npm run dev          # site on http://localhost:3000
npm run build        # the only check — must pass before committing
npm run sanity:dev   # Studio on http://localhost:3333
```

- **[CLAUDE.md](CLAUDE.md)** — stack, folder layout, commands, conventions and standing rules. Start here.
- **[docs/](docs/)** — session handoff notes, the production-readiness report, and
  [docs/archive/CLAUDE.full.md](docs/archive/CLAUDE.full.md), the complete project history.
- **[.env.example](.env.example)** — the environment variables the site and Studio need.

## Adding project photos

Photos live **only in Sanity** — never in this repo. A brand without photos shows a navy placeholder
with its initials, and switches to its photos by itself once one is published: no code changes.

1. **Add the photos**, either way:
   - **Sanity Studio** — open the project, set its *Hero image* (the main photo) and add the rest
     to *Gallery*, then **Publish**. For the photo to appear, the project's *Status* must be
     *published* (it has a page).
   - **`npm run photos:upload`** (on your computer) — one folder per project named
     `"<list number>. <name and place>"`, the main photo named `hero.jpg`, the others in the order
     you want them (`01.jpg`, `02.jpg` …). JPG or WebP, about 2000px on the long side; the script
     resizes, converts and strips location data itself. Run it once as a **dry run** (it only
     prints what it would do), then `npm run photos:upload -- --apply` to upload and publish.
     See `scripts/project-photos.mjs` for the options.
2. **The live site updates by itself.** Publishing in Sanity calls the site's webhook
   (`/api/revalidate`, set up as in docs/vercel-deploy.md) and the changed pages refresh on their
   next visit — within an hour at the latest even without the webhook. The brand moves up among
   the brands with photos on the home page, its tile and page show the photo, and its project list
   appears. (Running locally, a new `npm run build` shows it.)
3. **Check what is still missing:** `npm run check-photos` lists the brands with and without
   photos, and every project still waiting for one. Read-only — it needs no token.

## Project page text

Every project page shows four text sections — Overview, Design challenge, Our solution and Key
features — stored in Sanity on the project (Overview, Challenge, Solution, Features). Edit them in
the Studio like any other field.

For projects that have none yet (a new project, for instance), `npm run projects:content` writes
them from the project's own details — name, brand, format, location — and checks that no two
projects share the same text. It is a dry run unless you add `--dataset <name> --apply`, it only
ever fills EMPTY fields (text already in Sanity is never overwritten), and it saves the full text
and a report to `C:\dev\project-content\` for review. `-- --audit` reports on what is there now.
