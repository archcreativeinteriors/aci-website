// Every GROQ query the site runs (Phase 6, 2026-09-28: moved from
// lib/cms/queries.js; the site no longer reads any local content file).
// The getters in this folder run them; see DATA_SOURCES.md for which page
// uses which.
//
// TWO THINGS NEVER TO DROP FROM AN IMAGE PROJECTION:
//  1. `asset->metadata.lqip` — the blur placeholder. Without it every image
//     silently loses its placeholder.
//  2. `asset->metadata.dimensions` — width/height, so next/image can reserve the
//     box and nothing shifts on load.

const IMAGE = `{
  "url": asset->url,
  "lqip": asset->metadata.lqip,
  "width": asset->metadata.dimensions.width,
  "height": asset->metadata.dimensions.height,
  alt
}`;

// ── projects ────────────────────────────────────────────────────────────────

/**
 * Every project, newest first, in the shape the index, brand and state pages,
 * the map and the brand wall work from. Field names are the ones the old local
 * list (data/projectsData.js) used, so the derivations did not change:
 *   loc = location as written, city / state = canonical, fmt = format.
 * A project has a page when its Status field is "published".
 */
export const PROJECT_ROWS = `
*[_type == "project" && defined(listNo)] | order(listNo desc, _createdAt desc) {
  listNo,
  "slug": slug.current,
  name,
  "brand": brand->name,
  "loc": location,
  city,
  state,
  "fmt": subCategory,
  sector,
  status,
  "heroImage": heroImage${IMAGE}
}`;

/** One project page, with its gallery. Only /projects/[id] asks for this. */
export const PROJECT_BY_SLUG = `
*[_type == "project" && status == "published" && slug.current == $slug][0] {
  "slug": slug.current,
  name,
  pageTitle,
  "brand": brand->name,
  location,
  pageLocation,
  sector,
  subCategory,
  overview,
  challenge,
  solution,
  features,
  "heroImage": heroImage${IMAGE},
  "gallery": gallery[]${IMAGE},
  "beforeImages": beforeImages[]${IMAGE}
}`;

// ── home ────────────────────────────────────────────────────────────────────

/** The home hero — singleton "homeHero". */
export const HOME_HERO = `
*[_type == "homeHero" && _id == "homeHero"][0] {
  eyebrow,
  heading,
  paragraph,
  "slides": slides[]${IMAGE},
  "mobileImage": mobileImage${IMAGE}
}`;

/** Home-page content with no other home — singleton "homePage". */
export const HOME_PAGE = `
*[_type == "homePage" && _id == "homePage"][0] {
  "whatWeDo": whatWeDo[]{ title, body, sector, href }
}`;

/**
 * Home "Selected projects" — singleton "homeSelectedProjects". The cards are
 * references to project documents, dereferenced here.
 */
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

// ── site-wide ───────────────────────────────────────────────────────────────

/** Contact details, headline numbers, address / hours / links — singleton "siteSettings". */
export const SITE_SETTINGS = `
*[_type == "siteSettings" && _id == "siteSettings"][0] {
  email,
  phone,
  callPhone,
  whatsappPhone,
  spacesDelivered,
  cities,
  states,
  address,
  shortAddress,
  mapsUrl,
  mapsEmbedUrl,
  geo,
  openingDays,
  opens,
  closes,
  socialLinks,
  areaServed,
  priceRange
}`;

// ── pages ───────────────────────────────────────────────────────────────────

/** /about: the intro block and the process stages — singleton "aboutPage". */
export const ABOUT_PAGE = `
*[_type == "aboutPage" && _id == "aboutPage"][0] {
  heading,
  "image": image${IMAGE},
  sectionHeading,
  paragraphs,
  "processStages": processStages[]{ label, title, text }
}`;

/** /costing — singleton "costingPage". */
export const COSTING_PAGE = `
*[_type == "costingPage" && _id == "costingPage"][0] {
  eyebrow, heading, intro, price, unit, note, includesHeading, includes
}`;

/** /privacy-policy and /terms. */
export const LEGAL_PAGE = `
*[_type == "legalPage" && slug.current == $slug][0] {
  title,
  lastUpdated,
  body
}`;

/** The service lines, in /services order. */
export const SERVICES = `
*[_type == "service" && defined(slug.current)] | order(order asc) {
  "slug": slug.current,
  icon,
  title,
  tagline,
  label,
  "image": image${IMAGE},
  description,
  features,
  process
}`;

/** The /clients logo wall — singleton "clientLogos". Rows are the layout. */
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

// ── people ──────────────────────────────────────────────────────────────────

/** The founder — singleton "founder". */
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

/** Testimonials in display order (the home page shows the first three). */
export const TESTIMONIALS = `
*[_type == "testimonial"] | order(order asc, name asc) {
  name,
  role,
  text,
  rating
}`;

/** FAQs in display order — /about, and the FAQPage JSON-LD. */
export const FAQS = `
*[_type == "faq"] | order(order asc) {
  "q": question,
  "a": answer
}`;

/**
 * Every blog post, newest first, with its body — one fetch serves the list,
 * each post, the sitemap and the Article JSON-LD. `date` is YYYY-MM-DD here.
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
