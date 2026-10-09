# Project field map

Every attribute of a project, traced through each layer that touches it. Read-only audit
taken 2026-09-23 against commit `d270215`. Line numbers are for that commit.

> **Update 2026-09-24 — rows 11, 12 and 14 no longer exist.** `yearCompleted`, `areaSqft`
> and `durationWeeks` were removed on the owner's instruction from every layer:
> - the schema, the GROQ queries, `import.js` (labels `YEAR` / `AREA_SQFT` / `DURATION_WEEKS`)
>   and the scaffold template;
> - the 192 `details.txt` files in the pack;
> - `year` and `area` in `data/projects.js`;
> - `projectSource.js`, the `/projects` year column and year headings, and JSON-LD `dateCreated`.
>
> That resolves flag F and the Area / Year rows of flag A. Line numbers below are from before
> the removal.

**File abbreviations used in the table**

| Code | File | Role today |
|---|---|---|
| **S** | `sanity/schemas/project.js` | Sanity schema (no dataset exists yet) |
| **I** | `sanity/scripts/import.js` | content pack → Sanity documents |
| **SC** | `sanity/scripts/scaffold.js` | writes the empty `details.txt` / `PHOTOS-HERE.txt` templates |
| **PD** | `src/app/lib/data/projectsData.js` | the owner's 192-row list (the "spine"); line = first record |
| **PJ** | `src/app/lib/data/projects.js` | the 34 detailed records (photo + copy); line = first record |
| **PS** | `src/app/lib/projectSource.js` | the site's data API: `getProjects()` rows at 150–174 |
| **Q** | `src/app/lib/cms/queries.js` | GROQ projections (nothing imports them yet) |

"—" means the field does not exist in that layer.

## Field table

| # | Sanity field (S) | details.txt label → import (I) | Scaffold (SC) | PD key | PJ key | projectSource (PS) | GROQ (Q) | Displayed in |
|---|---|---|---|---|---|---|---|---|
| 1 | `name` string, required — S:22 | none; from spine `row.name` — I:322 | comment only, `row.name` — SC:107 | `name` — PD:17 | `title` (untrimmed on 1 record) — PJ:45 | `projectName` ← `entry.name` — PS:151 | `"projectName": name` — Q:35 | `ProjectRow.jsx:44`, `ProjectCard.jsx:63`, `home/SelectedProjects.jsx:44,57` (PD `name`). The detail page uses **PJ `title`** instead: h1 `projects/[id]/page.js:225`, meta 68–71, breadcrumb 150, alt 167; JSON-LD `jsonld.js:138` |
| 2 | `slug` slug, required — S:23–29 | none; `row.detailSlug \|\| row.slug` — I:323 | folder name tail from `row.slug` — SC:81–84 | `slug` (list slug) — PD:16; `detailSlug` — PD:24 | `id` — PJ:42 | `slug` ← `detailSlug \|\| slug` — PS:150 | `"slug": slug.current` — Q:34 | Link hrefs `ProjectRow.jsx:19`, `ProjectCard.jsx:31`, `SelectedProjects.jsx:37` (via `detailSlug`); route params `projects/[id]/page.js:57` and sitemap `sitemap.js:51` both use **PJ `id`** |
| 3 | `brand` reference → `brand`, required — S:30–38 | none; `brand.<brandSlug(row.brand)>` — I:324 | comment only — SC:108 | `brand` string — PD:18 | `client` — PJ:57 | `brand` ← `entry.brand` — PS:152 | `"brand": brand->name`, `"brandSlug": brand->slug.current` — Q:36–37 | Detail eyebrow `projects/[id]/page.js:95, 216–223` (falls back to PJ `client`); brand page filter `projects/brand/[brand]/page.js:56, 92`; home BrandWall previews `page.js:68`; brand counts `projectStats.js:158` |
| 4 | `sector` string list — S:41 | none; `row.sector` — I:325 | — | `sector` — PD:23 | — (derived from `category`) | `sector` ← `entry.sector` — PS:153 | `sector` — Q:38 | `/projects` filter `data-sector` `projects/page.js:137` → `ProjectFilters.jsx`; detail spec "Sector" `[id]/page.js:133`; `SelectedProjects.jsx:54`; `SECTOR_COUNTS` → `/services` |
| 5 | `subCategory` string list, title "Format" — S:42 | none; `row.fmt` — I:326 | comment only — SC:108 | `fmt` — PD:22 | — (derived from `category`) | `subCategory` ← `entry.fmt` — PS:154 | `subCategory` — Q:39 | `ProjectCard.jsx:50–52`; detail spec "Format" `[id]/page.js:132`; `formatBreakdown()` `projectStats.js:219` → `BrandFormatBreakdown.jsx`; `SelectedProjects.jsx:54` |
| 6 | `location` string (free text) — S:47 | none; `row.loc` — I:327 | comment only — SC:107 | `loc` — PD:19 | `location` (untrimmed on 1 record) — PJ:47 | **`city`** ← `entry.loc` — PS:160 | **`"city": location`** — Q:40 | `ProjectRow.jsx:48`, `ProjectCard.jsx:43,64` (as `city`); detail spec "Location" `[id]/page.js:129`; `SelectedProjects.jsx:58`. The detail meta title and alt use **PJ `location`** (`[id]/page.js:71,167`), and so does JSON-LD (`jsonld.js:146`) |
| 7 | `city` string (canonical) — S:48 | none; `row.city` — I:328 | comment only — SC:108 | `city` — PD:20 | — | **`cityName`** ← `entry.city` — PS:161 | **`"cityName": city`** — Q:41 | Detail spec "City" `[id]/page.js:130`; state-page city list `projects/state/[state]/page.js:59`; `PROJECT_STATS.cities` / `citiesByState()` → home hero, /about, /services, WhereWeBuild |
| 8 | `state` string — S:49 | none; `row.state` — I:329 | comment only — SC:108 | `state` — PD:21 | — (PS derives one from `location`, then discards it) | `state` ← `entry.state` — PS:162 | `state` — Q:42 | `ProjectRow.jsx:50`, `ProjectCard.jsx:65`; detail spec "State" `[id]/page.js:131`; state pages filter `state/[state]/page.js:49`; `statesByCount()` → WhereWeBuild map, Organization `areaServed` `jsonld.js:29` |
| 9 | `latitude` number — S:50 | **never set** | — | — | — | — | — | nowhere (map dots come from `CITY_COORDS` in `lib/data/locations.js`, per city) |
| 10 | `longitude` number — S:51 | **never set** | — | — | — | — | — | nowhere |
| 11 | `yearCompleted` number — S:55 | `YEAR` → `num(d.YEAR)` — I:98, 330 | `YEAR:` — SC:139 (legend 121) | — | `year` string, `"2025"` on all 34 (placeholder) — PJ:53 | `yearCompleted` ← `Number(p.year)` via `toRecord` — PS:109, 163 | `yearCompleted` — Q:43 | Year column `ProjectRow.jsx:52`; year headings `projects/page.js:104–111` (off while there is only one distinct year); **JSON-LD `dateCreated` `jsonld.js:140`**. Removed from the detail spec panel (`[id]/page.js:117–125`) |
| 12 | `areaSqft` number — S:56 | `AREA_SQFT` → `num()` — I:98, 331 | `AREA_SQFT:` — SC:141 (legend 122) | — | **`area`** string `"4150 Sq. Ft."` — PJ:55 | — | `areaSqft` (detail query only) — Q:71 | **nowhere**. Removed from the detail panel on the owner's instruction (`[id]/page.js:134–137`) |
| 13 | `scope` text — S:57 | `SCOPE` — I:98, 333 | `SCOPE:` — SC:145 (legend 124) | — | — | — | `scope` — Q:72 | nowhere |
| 14 | `durationWeeks` number — S:58 | `DURATION_WEEKS` → `num()` — I:98, 332 | `DURATION_WEEKS:` — SC:143 (legend 123) | — | — | — | `durationWeeks` — Q:73 | nowhere |
| 15 | `tier` string list — S:61 | **never set** | — | — | — | `tier: null` hard-coded — PS:164 | `tier` — Q:44 | nowhere |
| 16 | `photoQuality` string list — S:62 | derived: `hero ? "approved" : "none"` — I:340 | — | — | — | — | `photoQuality` — Q:47 | nowhere. The schema comment says it drives the "Photograph to be shot" state, but `ProjectCard` / `ProjectRow` key on `heroImage` presence instead |
| 17 | `storyStrength` string list — S:63 | derived: has any copy ? `"adequate"` : `"thin"` — I:341 | — | — | — | — | — | nowhere |
| 18 | `heroImage` image + `alt` — S:68–74 | pack file `hero.jpg`/`.png` (not a label) — I:73, 220, 349; uploaded with a generated alt, I:369 | `PHOTOS-HERE.txt` — SC:168 | — | **`image`** (static import) — PJ:49 | `heroImage` ← `p.image` — PS:111, 165; plus `previewSrc` — PS:112, 166 | `heroImage{url,lqip,width,height,alt}` — Q:23–29, 48 | Thumbnails `ProjectRow.jsx:31–37`, `ProjectCard.jsx:39–46`; brand hero + OG `brand/[brand]/page.js:55–58, 107, 124`; state OG `state/[state]/page.js:66`; BrandWall `page.js:68`. The detail hero, OG and home cards read **PJ `image`** directly: `[id]/page.js:78, 166`, `SelectedProjects.jsx:41–43`, JSON-LD `jsonld.js:143` |
| 19 | `gallery` array of image — S:75–80 | pack files `01.jpg`… — I:74, 221, 350, 372–378 | `PHOTOS-HERE.txt` — SC:169–170 | — | — (**no record has the key**) | — | `gallery[]` (detail query only) — Q:80 | Detail strip reads `project.gallery` at `[id]/page.js:143`. It is always empty, so the page always shows 4 "Photograph to be shot" tiles |
| 20 | `beforeImages` array of image — S:81–86 | pack files `before-01.jpg`… — I:75, 222, 351, 379–385 | `PHOTOS-HERE.txt` — SC:171 | — | — | — | `beforeImages[]` (detail query only) — Q:81 | nowhere |
| 21 | `overview` text — S:94 | `OVERVIEW` — I:99, 334 | `OVERVIEW:` — SC:149 (legend 126) | — | **`desc`** — PJ:59 | — | `overview` — Q:74 | Detail "Project overview" `[id]/page.js:260`; meta and OG description 72, 76; JSON-LD `jsonld.js:142` — all read **PJ `desc`** |
| 22 | `challenge` text — S:95 | `CHALLENGE` — I:99, 335 | `CHALLENGE:` — SC:151 (legend 127) | — | `challenge` — PJ:61 | — | `challenge` — Q:75 | Detail "Design challenge" `[id]/page.js:267` (PJ) |
| 23 | `solution` text — S:96 | `SOLUTION` — I:99, 336 | `SOLUTION:` — SC:153 (legend 128) | — | `solution` — PJ:63 | — | `solution` — Q:76 | Detail "Our solution" `[id]/page.js:274` (PJ) |
| 24 | `features` array of string — S:97–102 | `FEATURES` `- item` list — I:117–121, 337 | `FEATURES:` — SC:155 (legend 129) | — | `features` — PJ:65 | — | `features` — Q:77 | Detail "Key features" `[id]/page.js:281` (PJ) |
| 25 | `testimonial` text — S:104 | `TESTIMONIAL` — I:99, 338 | `TESTIMONIAL:` — SC:157 (legend 130–132) | — | — | — | `testimonial` — Q:78 | nowhere (the home testimonials come from `lib/data/testimonials.js`, which is not linked to projects) |
| 26 | `credits` string — S:105 | `CREDITS` — I:98, 339 | `CREDITS:` — SC:147 (legend 125) | — | — | — | `credits` — Q:79 | nowhere |
| 27 | `status` string list, initial `"draft"` — S:109 | derived: `hero && details && CONSENT: yes` → `"published"` — I:309–311, 345 | — | — | — | — (closest is `linkable`) | filter `status == "published"` on every query — Q:53, 59, 69, 96, 101; also projected — Q:46 | not rendered; decides whether a detail page exists |
| 28 | `clientDisplayConsent` boolean — S:110 | `CONSENT` → `yes()` — I:98, 346 | `CONSENT:` — SC:137 (legend 120) | — | — | — | **not queried** | nowhere |
| 29 | `listNo` number — S:115 | `row.listNo`, and the folder's `NNN-` prefix is the join key — I:206–212, 347 | folder prefix, zero-padded — SC:81–84, 109 | `listNo` — PD:15 | `displayOrder` (**23 of 34 disagree** with `listNo`) — PJ:43 | `displayOrder` ← `entry.listNo` — PS:173 (sorting, PS:186) | `listNo`, `order(listNo desc)` — Q:45, 53 | sort order of `/projects`, brand and state pages |

**Fields that exist only on the app side (no schema field)**

| Key | Where | Used by |
|---|---|---|
| `category` | PJ:51 (`"Salon Interior"` etc.) | OG title `[id]/page.js:75`; JSON-LD `about` `jsonld.js:141`; `CATEGORY_MAP` in PS:61–66 (result discarded, see flag C6) |
| `linkable` | PS:169 | `ProjectRow.jsx:18–24`, `ProjectCard.jsx:30–36` (link or plain text) |
| `previewSrc` | PS:112, 166 | `ProjectRow.jsx:25` → `ProjectIndex.jsx` hover photo |
| `placeholder` | PS:114, 174 (always `false`) | **no consumer** |
| `brandSlug` | Q:37 only | none yet; the app recomputes it with `brandSlug()` in `projectStats.js:141` |

## Flags

### A. Name mismatches across the layers

| Concept | Schema / GROQ | details.txt | PD | PJ | projectSource | Note |
|---|---|---|---|---|---|---|
| Area | `areaSqft` (number) | `AREA_SQFT` | — | `area` (string, `"4150 Sq. Ft."`) | — | Different name and type; PS has no field for it; not displayed anywhere |
| Year | `yearCompleted` (number) | `YEAR` | — | `year` (string) | `yearCompleted` | PJ holds the placeholder `"2025"` on all 34 |
| Overview | `overview` | `OVERVIEW` | — | `desc` | — | |
| Name | `name` → aliased `projectName` | — | `name` | `title` | `projectName` | Three spellings |
| Brand | `brand` (reference) | — | `brand` (string) | `client` (string) | `brand` | 8 of 34 values differ (see D) |
| Slug | `slug.current` | — | `slug` and `detailSlug` | `id` | `slug` | `slug.current` holds `detailSlug` when there is one, else the list slug |
| Free-text location | `location` → aliased **`city`** | — | `loc` | `location` | **`city`** | App `city` = schema `location`. App `cityName` = schema `city`. The same word means two different fields depending on the layer |
| Format | `subCategory` (titled "Format") | — | `fmt` | — | `subCategory` | |
| Hero photo | `heroImage` | `hero.jpg` file | — | `image` | `heroImage` | Different object shapes (see C2) |
| Order | `listNo` | folder prefix | `listNo` | `displayOrder` | `displayOrder` | PJ's `displayOrder` is dead data and disagrees with `listNo` on 23 of 34 |

### B. Fields that exist in some layers but not others

1. **In the schema, never written by the import:** `tier`, `latitude`, `longitude`.
2. **Collected in `details.txt`, stored and queried, but rendered nowhere:** `areaSqft`, `scope`,
   `durationWeeks`, `testimonial`, `credits`, `beforeImages`.
3. **Written by the import but never queried:** `storyStrength`, `clientDisplayConsent`.
4. **Queried but no component reads them:** `tier`, `photoQuality`, `listNo`, `status`, `brandSlug`.
5. **App-only:** `category` (no schema field, but used in OG and JSON-LD), `linkable`, `previewSrc`,
   `placeholder` (no consumer at all).
6. **Read but never present:** the detail page reads `project.gallery` (`[id]/page.js:143`); no
   PJ record has that key.

### C. Things that break or change when `projectSource.js` switches to GROQ

1. **Different output shape.** GROQ returns `listNo`, `status`, `photoQuality`, `brandSlug`.
   Components need `linkable`, `previewSrc` and `displayOrder`, which GROQ doesn't produce.
2. **Different `heroImage` shape.** Locally it is a static-import object (`src`, `width`,
   `height`, `blurDataURL`). GROQ returns `{url, lqip, width, height, alt}`.
   - `ProjectRow` and `ProjectCard` pass it straight to `next/image` with `placeholder="blur"`.
   - The brand and state pages read `heroImage.src` for OG images.
   - All of these need to move to `<SanityImage>` or a mapping step.
3. **The index would lose rows.** `ALL_PROJECTS` returns published documents only. `/projects`
   shows all 192 rows today, 158 of them as unlinked text. A straight swap would drop those rows.
4. **Some pages bypass `projectSource.js`.** The detail page, `sitemap.js` and `SelectedProjects.jsx`
   read PJ directly (already an open issue in CLAUDE.md).
5. **Stale comment.** PS:8–9 says the schema is snake_case (`project_name`). It is camelCase (`name`).
6. **Dead mapping.** `toRecord()` (PS:95–116) computes 13 fields, but `getProjects()` keeps only
   `yearCompleted`, `heroImage` and `previewSrc`. The rest — including `CATEGORY_MAP`'s
   lowercase `sector` values, which wouldn't match the schema's option list anyway — are thrown away.

### D. Content conflicts for the same project (PD vs PJ)

The detail page mixes both files: h1, meta title, alt text and JSON-LD come from PJ, and the spec
panel comes from PD. Across the 34 joined records:
- **Names:** 27 differ.
- **Locations:** 32 differ.
- **Brands:** 8 differ.
- **Order:** 23 `displayOrder` values differ from `listNo`.

Most are wording differences, such as "Gurugram" vs "Gurgaon" or "Toni & Guy" vs "Tony & Guy Salon".
**Three look like factual conflicts that only the owner can resolve:**

| detailSlug | PJ (title / location) | PD (loc / city) | Effect today |
|---|---|---|---|
| `geetanjali-studio-ajmer` | "Geetanjali Studio Ajmer" / "Ajmer, Rajasthan" | "Alwar Rajasthan" / Alwar | h1 says Ajmer; spec panel says City: Alwar |
| `geetanjali-salon-malviya-nagar` | "Malviya nagar" | "Malviya Nagar Jaipur Rajasthan" / Jaipur | PS's `CITY_STATE` maps "malviya nagar" to **Delhi** |
| `geetanjali-salon-gurugram` | "Sector 82 Gurugram" | "AIPL Sector 66 Gurugram" | Two different addresses |

**The 8 brand differences:**

| PJ `client` | PD `brand` |
|---|---|
| `hakimali` | Hakim Aalim |
| Aloevera Salon | Aloevera |
| Bellissima | Bellissima Unisex Salon by Jyoti |
| Eesha Salon | Eesha |
| Dopulence Salon | Dopulence |
| Punjabi By Nature Restaurant | Punjabi By Nature |
| Tweak Salon | Tweak |
| Blackexpress Salon | Black Express |

The site shows PD's value (`record?.brand || project.client`), so only the fallback is affected.

### E. What migration would carry over today

`import.js` takes the name and location from **PD**, the copy only from **`details.txt`**, and the
photos only from **pack image files**. It never reads PJ. On 2026-09-23 the pack has **0 of 192**
`details.txt` files with any OVERVIEW text and **0 image files**. An import run today would
therefore:
- create 192 **draft** documents and publish none, because there is no hero photo;
- carry **none** of the 34 written pages' overview, challenge, solution or features, and none of
  their photos;
- replace PJ's detail titles with PD's names (for example "Geetanjali Studio Ajmer" becomes
  "Geetanjali Studio").

Unless the owner types that copy into the pack, the 34 pages that have content today need a
separate step to migrate PJ into Sanity.

### F. Year shown in JSON-LD even though it's a placeholder

The detail page removed the "Completed" row because every PJ `year` is the placeholder `"2025"`
(`[id]/page.js:117–125`). But `creativeWorkJsonLd()` still publishes `dateCreated: "2025"` on
all 34 detail pages (`jsonld.js:140`). That is the claim the panel change was meant to stop making.
