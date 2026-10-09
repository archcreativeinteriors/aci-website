import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "./site";

const ORG_ID = `${SITE_URL}/#organization`;

const abs = (path = "/") =>
  path.startsWith("http") ? path : `${SITE_URL}${path}`;

/**
 * Where the studio actually delivers, for the Organization node.
 *
 * DERIVED from the project data, not a written list: every State below is one
 * the firm has a documented project in (`states` is getStats().statesByCount()),
 * so the schema cannot claim a service area the portfolio does not evidence —
 * which is the specific thing Google's structured-data policy treats as
 * misleading markup. Plus the NCR region and the studio's own city.
 *
 * Site settings → "Areas served" is the human-readable list; it is not what
 * the schema reads.
 */
function areaServed(business, states) {
    return [
        { "@type": "Country", name: "India" },
        ...states.map((s) => ({ "@type": "State", name: s.state })),
        { "@type": "Place", name: "Delhi NCR" },
        {
            "@type": "City",
            name: business.address.addressLocality,
        },
    ];
}

// Sitewide LocalBusiness / Organization node. Rendered once in the root layout,
// which passes getSiteSettings()'s `contact` and `business` and the derived
// states (lib/content).
export function organizationJsonLd(contact, business, states) {
  const BUSINESS = business;
  const data = {
    "@context": "https://schema.org",
    "@type": ["Organization", "HomeAndConstructionBusiness"],
    "@id": ORG_ID,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    logo: abs("/aci-logo.png"),
    image: abs("/og-image-landscape.jpg"),
    email: contact.email,
    telephone: contact.telephone,
    priceRange: BUSINESS.priceRange,
    address: {
      "@type": "PostalAddress",
      ...BUSINESS.address,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS.geo.latitude,
      longitude: BUSINESS.geo.longitude,
    },
    areaServed: areaServed(business, states),
    sameAs: BUSINESS.sameAs,
  };

  if (BUSINESS.openingHours) {
    data.openingHoursSpecification = [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: BUSINESS.openingHours.days,
        opens: BUSINESS.openingHours.opens,
        closes: BUSINESS.openingHours.closes,
      },
    ];
  }

  return data;
}

// BreadcrumbList for a detail page. `items` is [{ name, path }] in order,
// root-first. The final item is the current page.
export function breadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: abs(item.path),
    })),
  };
}

// FAQPage from the shared faq data ([{ q, a }]).
export function faqJsonLd(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

// Article node for a blog post.
export function articleJsonLd(blog) {
  // blog.date is a plain string like "June 12, 2026" (no timezone). Anchor it to
  // midday UTC so toISOString() can't roll back to the previous calendar day.
  const published = new Date(`${blog.date} 12:00:00 UTC`);
  const publishedISO = Number.isNaN(published.getTime())
    ? undefined
    : published.toISOString();

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.title,
    description: blog.metaDescription || blog.excerpt,
    // A Sanity image { url }.
    image: abs(blog.image?.url ?? "/og-image-landscape.jpg"),
    datePublished: publishedISO,
    dateModified: publishedISO,
    articleSection: blog.category,
    mainEntityOfPage: abs(`/blogs/${blog.id}`),
    author: blog.author
      ? { "@type": "Person", name: blog.author }
      : { "@id": ORG_ID, name: SITE_NAME },
    publisher: { "@id": ORG_ID, name: SITE_NAME },
  };
}

// CreativeWork node for a project page.
export function creativeWorkJsonLd(project) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: `${project.title.trim()} Interior Design`,
    url: abs(`/projects/${project.id}`),
    creator: { "@id": ORG_ID },
    about: project.category,
    description: project.desc,
    image: abs(project.image?.src ?? "/og-image-landscape.jpg"),
    locationCreated: {
      "@type": "Place",
      name: project.location,
    },
  };
}

// NOT RENDERED (2026-10-09). The home page used to emit one of these per
// testimonial. Every one reviews this business itself (itemReviewed = ORG_ID),
// and Google's review-snippet policy excludes reviews a business publishes
// about itself on its own site ("self-serving"), so the markup could never
// help and risks a manual action. The testimonials themselves stay on the page.
// Kept for reference only.
//
// Review node for one testimonial ({ name, role, text }). `role` is a plain
// "Job title, Company" string — split once to recover a jobTitle + publisher.
// Deliberately no `reviewRating` / no site-wide `aggregateRating`: Google's
// structured-data policy treats a self-declared rating with no genuine,
// user-visible review mechanism as a violation. A rating-less Review is valid.
export function reviewJsonLd(testimonial) {
  const [jobTitle, ...rest] = testimonial.role.split(",");
  const company = rest.join(",").trim();

  return {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: { "@id": ORG_ID },
    author: {
      "@type": "Person",
      name: testimonial.name,
      ...(jobTitle ? { jobTitle: jobTitle.trim() } : {}),
    },
    reviewBody: testimonial.text,
    ...(company ? { publisher: { "@type": "Organization", name: company } } : {}),
  };
}
