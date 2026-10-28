# Data sources

Every piece of content on the site comes from **Sanity** (project `NEXT_PUBLIC_SANITY_PROJECT_ID`,
dataset `production`, published documents only). Since Phase 6 (2026-09-28) there is **no local
content and no fallback**: pages and components get content only through `src/app/lib/content/`
(imported as `lib/content`), which is the only code that talks to Sanity. If a required document
is missing, or Sanity cannot be reached, the build stops with a message saying what is wrong, and
`npm run build:safe` keeps the live site on its previous build.

Content goes live only after a rebuild and restart: `npm run build:safe`, then `npm start`.

## Content types

| Content | Sanity type (Studio menu) | Query (`lib/content/queries.js`) | Getter (`lib/content`) | Used by |
|---|---|---|---|---|
| Contact details, headline numbers, address, hours, maps, social links | `siteSettings`, a singleton (Site settings) | `SITE_SETTINGS` | `getSiteSettings()` | layout (Organization JSON-LD, Navbar), Footer, floating Call / Email / WhatsApp buttons, home hero stats and CTA band, /about, /services, /projects, /contact, StudioLocation, legal pages |
| Home hero | `homeHero`, a singleton (Home hero) | `HOME_HERO` | `getHomeHero()` | / |
| "What we do" cards | `homePage`, a singleton (Home page) | `HOME_PAGE` | `getHomePage()` | / (WhatWeDo) |
| Selected projects | `homeSelectedProjects`, a singleton, references to `project` | `HOME_SELECTED_PROJECTS` | `getSelectedProjects()` | / |
| Projects (list, brand and state collections, map, brand wall, counts) | `project` (Projects / Projects by brand) | `PROJECT_ROWS` | `getProjectRows()`, `getProjects()`, `getStats()`, `getLocations()` | /, /projects, /projects/brand/[brand], /projects/state/[state], layout (areaServed), sitemap |
| One project page | `project` with Status = "published" | `PROJECT_BY_SLUG` | `getProjectPage(slug)`, `getProjectPageIds()` | /projects/[id], sitemap |
| Brands | `brand` (Brands). Names reach the site through each project's **Brand** reference. A brand with no project has no page. | (inside `PROJECT_ROWS`: `brand->name`) | `getStats().brandsByCount()` | brand wall, brand pages, project pages |
| Services | `service` (Services) | `SERVICES` | `getServices()`, `getService(slug)` | /services (one section per service; the /services/[slug] pages were folded in, 2026-10-27) |
| About intro and process stages | `aboutPage`, a singleton (About page) | `ABOUT_PAGE` | `getAboutPage()` | /about |
| Founder | `founder`, a singleton (Founder) | `FOUNDER` | `getFounder()` | /about, / (StudioBlock) |
| Team | `teamMember` (Team) | `TEAM` | `getTeam()` | /about |
| Testimonials | `testimonial` (Testimonials / reviews) | `TESTIMONIALS` | `getTestimonials()` | / (first three, plus Review JSON-LD) |
| FAQs | `faq` (FAQs) | `FAQS` | `getFaqs()` | /about (plus FAQPage JSON-LD) |
| Blog posts | `blogPost` (Blog posts) | `BLOG_POSTS` | `getBlogs()`, `getBlog(id)` | /blogs, /blogs/[id], sitemap |
| Client logos | `clientLogos`, a singleton (Client logos) | `CLIENT_LOGOS` | `getClientLogoRows()` | /clients |
| Costing page | `costingPage`, a singleton (Costing page) | `COSTING_PAGE` | `getCostingPage()` | /costing |
| Privacy policy, Terms | `legalPage` (Legal pages) | `LEGAL_PAGE` | `getLegalPage(slug)` | /privacy-policy, /terms |

## Rules the site follows

- **Page or no page:** a project gets its own page (a link, a preview photo, a sitemap entry)
  when its **Status** field is `published`. Otherwise it is only a row on /projects.
- **Derived, never typed:** per-brand, per-state and per-sector counts, the brand wall, the
  map's states and cities, and the About and hero "rollout" figures are all calculated from
  the projects. The headline numbers (spaces, cities, states) are typed in Site settings.
- **Placeholders:** `{email}`, `{phone}`, `{address}` and `{siteName}` in the legal pages, and
  `{rolloutSpaces}` / `{rolloutBrand}` / `{rolloutStates}` in the hero and About text, are
  filled in when the site is built.
- **Images:** visitors load every image from our own `/_next/image`, never from cdn.sanity.io
  (privacy policy). Share images (og:image, JSON-LD) are cdn.sanity.io URLs, for crawlers only.

## What stays in the code (not content)

| What | Where | Why |
|---|---|---|
| Site URL, site name, default description | `src/app/lib/site.js` | configuration |
| India map outlines and city dots | `src/app/lib/map/indiaMap.js` (generated) | official boundary, a legal requirement; never hand-edited |
| City coordinates, state-name matching | `src/app/lib/map/geo.js` | geography, not a claim of work |
| Navigation, button and form labels, section headings, per-page SEO titles and descriptions | the page and component files | layout copy (owner's decision, Phase 4) |
| Logo, share image, map placeholder picture | `public/` | site assets |

## Credentials

- The site reads Sanity **without a token**: the dataset is public and only published
  documents are read.
- `SANITY_WRITE_TOKEN` (`.env.local`) is used **only** by scripts:
  - `npm run photos:upload`
  - `npm run sanity:backup`

  It must never get a `NEXT_PUBLIC_` prefix. A build is checked to contain no trace of it.

## Where the old local content went

Everything the site used to read locally is in `archive/`, moved rather than deleted, with its
git history kept:
- `archive/src/app/lib/data/`: the old content files
- `archive/src/app/lib/`: the old source modules
- `archive/public/images/`: 211 images, now served from Sanity, plus 81 unused logo originals
- `archive/scripts/` and `archive/sanity/`: the content-pack and local-data tools
- `*.before-phase6.*`: copies of the pages whose text moved to Sanity
