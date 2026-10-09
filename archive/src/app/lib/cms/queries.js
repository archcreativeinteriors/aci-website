// GROQ projections — spec §20.
//
// These are the queries `projectSource.js` will run once a Sanity dataset
// exists. They are written NOW, against the schema in sanity/schemas/, so the
// migration is a change of source and not a redesign: every projection below
// returns exactly the field names the components already consume.
//
// Of the project queries only PROJECT_BY_SLUG is imported (the detail pages,
// 2026-09-25); the rest wait for the list pages to move. Everything below is live:
// lib/heroSource.js, lib/teamSource.js and lib/contentSource.js run those.
// NEXT_PUBLIC_SANITY_PROJECT_ID is empty, so
// projectSource still maps the local data/projectsData.js array. When the
// dataset lands, the two functions at the bottom of projectSource.js swap from
// "map the local array" to "run these", and nothing else in the app changes.
//
// TWO THINGS THAT MUST NOT BE DROPPED FROM THE PROJECTIONS:
//
//  1. `asset->metadata.lqip` — Sanity's low-quality image placeholder. It is
//     the drop-in replacement for the blur placeholder a static import gives
//     us for free. Omit it and every migrated image silently loses its
//     placeholder (CLAUDE.md, Conventions).
//  2. `asset->metadata.dimensions` — intrinsic width/height. Without them
//     next/image cannot reserve space and §28's "fixed aspect ratios to prevent
//     layout shift" is lost across 192 cards at once.

const IMAGE = `{
  "url": asset->url,
  "lqip": asset->metadata.lqip,
  "width": asset->metadata.dimensions.width,
  "height": asset->metadata.dimensions.height,
  alt
}`;

// The fields an index row / card needs. Deliberately NOT the gallery: §28 is
// explicit that /projects must not pull 192 full records' worth of images.
const CARD_FIELDS = `
  "slug": slug.current,
  "projectName": name,
  "brand": brand->name,
  "brandSlug": brand->slug.current,
  sector,
  subCategory,
  "city": location,
  "cityName": city,
  state,
  tier,
  listNo,
  status,
  photoQuality,
  "heroImage": heroImage${IMAGE}
`;

/**
 * Every published project, newest first: listNo descending (per §14), and the
 * later-created first if two ever share a number. The Studio gives a new
 * project the next number, so it lands at the top.
 */
export const ALL_PROJECTS = `
*[_type == "project" && status == "published"] | order(listNo desc, _createdAt desc) {
  ${CARD_FIELDS}
}`;

/** One brand's projects — the brand collection page (§6). */
export const PROJECTS_BY_BRAND = `
*[_type == "project" && status == "published" && brand->slug.current == $brand]
  | order(listNo desc, _createdAt desc) {
  ${CARD_FIELDS}
}`;

/**
 * One project, with the gallery. Only the detail page asks for this — §28:
 * "Load full-resolution images only on project detail/gallery views."
 * Read by getProjectPage() in lib/projectSource.js.
 */
export const PROJECT_BY_SLUG = `
*[_type == "project" && status == "published" && slug.current == $slug][0] {
  ${CARD_FIELDS},
  pageTitle,
  scope,
  overview,
  challenge,
  solution,
  features,
  testimonial,
  credits,
  "gallery": gallery[]${IMAGE},
  "beforeImages": beforeImages[]${IMAGE}
}`;

/**
 * Brands with their derived project count (§21: "Project count should be
 * derived from related projects"). The count is computed by the query, never
 * stored on the brand document.
 */
export const ALL_BRANDS = `
*[_type == "brand" && displayConsent == true] {
  name,
  "slug": slug.current,
  description,
  "logo": logo${IMAGE},
  "heroImage": heroImage${IMAGE},
  "count": count(*[_type == "project" && status == "published" && brand._ref == ^._id])
} | order(count desc, name asc)`;

/** Slugs only — for generateStaticParams. */
export const PUBLISHED_PROJECT_SLUGS = `
*[_type == "project" && status == "published"].slug.current`;

// ── home hero ──────────────────────────────────────────────────────────────
// Read by lib/heroSource.js. Field names match lib/data/hero.js.

/** The home hero — a singleton with the fixed id "homeHero". */
export const HOME_HERO = `
*[_type == "homeHero" && _id == "homeHero"][0] {
  eyebrow,
  heading,
  paragraph,
  "slides": slides[]${IMAGE},
  "mobileImage": mobileImage${IMAGE}
}`;

// ── /about: the intro block ──────────────────────────────────────────────────
// Read by getAboutIntro() in lib/contentSource.js. Paragraph placeholders
// ({rolloutSpaces} etc.) are filled in there, not here.
export const ABOUT_PAGE = `
*[_type == "aboutPage" && _id == "aboutPage"][0] {
  heading,
  "image": image${IMAGE},
  sectionHeading,
  paragraphs
}`;

// ── home: selected projects ────────────────────────────────────────────────
// Read by getSelectedProjects() in lib/contentSource.js. The cards are
// REFERENCES to project documents, dereferenced here, so each card shows its
// project's own name / format / sector / location / hero photo. `status` comes
// along so the site can skip anything not published.

/** The "Selected projects" section — a singleton, fixed id "homeSelectedProjects". */
export const HOME_SELECTED_PROJECTS = `
*[_type == "homeSelectedProjects" && _id == "homeSelectedProjects"][0] {
  eyebrow,
  heading,
  description,
  "projects": projects[]->{
    "slug": slug.current,
    name,
    "format": subCategory,
    sector,
    location,
    status,
    "image": heroImage${IMAGE}
  }
}`;

// ── client logos ───────────────────────────────────────────────────────────
// Read by getClientLogoRows() in lib/contentSource.js. Rows are the layout (see
// sanity/schemas/clientLogos.js), so the projection keeps them nested.

/** The /clients logo wall — a singleton, fixed id "clientLogos". */
export const CLIENT_LOGOS = `
*[_type == "clientLogos" && _id == "clientLogos"][0] {
  "rows": rows[]{
    "logos": logos[]{
      name,
      wide,
      "url": image.asset->url,
      "width": image.asset->metadata.dimensions.width,
      "height": image.asset->metadata.dimensions.height
    }
  }
}`;

// ── people ─────────────────────────────────────────────────────────────────
// Read by lib/teamSource.js. Field names match lib/data/team.js, the local
// fallback, so the components never see which source they came from.

/** The founder — a singleton with the fixed id "founder". */
export const FOUNDER = `
*[_type == "founder" && _id == "founder"][0] {
  name,
  designation,
  "photo": photo${IMAGE},
  bio,
  quote
}`;

/** The team grid on /about, in the studio's chosen order. */
export const TEAM = `
*[_type == "teamMember"] | order(order asc, name asc) {
  name,
  designation,
  "photo": photo${IMAGE}
}`;

// ── site-wide content ──────────────────────────────────────────────────────
// Read by lib/contentSource.js. Each projection ALIASES the Sanity field names
// onto the local data modules' keys (id, q/a, …), so the pages consume one shape.

/** Contact details + headline numbers — a singleton, fixed id "siteSettings". */
export const SITE_SETTINGS = `
*[_type == "siteSettings" && _id == "siteSettings"][0] {
  email,
  phone,
  callPhone,
  whatsappPhone,
  spacesDelivered,
  cities,
  states
}`;

/** Testimonials in display order (the home page shows the first three). */
export const TESTIMONIALS = `
*[_type == "testimonial"] | order(order asc, name asc) {
  name,
  role,
  text,
  rating
}`;

/** FAQs in display order — rendered on /about and emitted as FAQPage JSON-LD. */
export const FAQS = `
*[_type == "faq"] | order(order asc) {
  "q": question,
  "a": answer
}`;

/**
 * Every blog post, newest first, WITH its body. There are a handful, and the
 * list page, each post, the sitemap and the Article JSON-LD all read from one
 * fetch — cheaper than a list query plus one query per post at build time.
 * `date` stays YYYY-MM-DD here; contentSource formats it.
 */
export const BLOG_POSTS = `
*[_type == "blogPost" && defined(slug.current)] | order(date desc) {
  "id": slug.current,
  title,
  "image": image${IMAGE},
  date,
  author,
  category,
  excerpt,
  metaDescription,
  relatedService,
  "content": content[]{ heading, paragraphs }
}`;
