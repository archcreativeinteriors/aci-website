import { SITE_URL } from "./lib/site";
import { getBlogs, getStats, getProjectPageIds, brandSlug, stateSlug, isBrandIndexable } from "./lib/content";

export default async function sitemap() {
  // Everything from Sanity (lib/content) — the same lists the pages build
  // from, so every URL here has a page.
  const [blogs, stats, projectIds] = await Promise.all([
    getBlogs(),
    getStats(),
    getProjectPageIds(),
  ]);

  // lastModified is omitted where we do not know one. It used to be new Date()
  // on every URL, which just stamped build time on 59 pages and told crawlers
  // nothing — a date that changes on every deploy is noise, not a signal.
  // Blog posts are the one content type carrying a real published date.

  const staticRoutes = [
    { url: "/", changeFrequency: "weekly", priority: 1 },
    { url: "/projects", changeFrequency: "weekly", priority: 0.9 },
    { url: "/services", changeFrequency: "monthly", priority: 0.9 },
    { url: "/about", changeFrequency: "monthly", priority: 0.7 },
    { url: "/blogs", changeFrequency: "weekly", priority: 0.7 },
    { url: "/clients", changeFrequency: "monthly", priority: 0.5 },
    { url: "/costing", changeFrequency: "monthly", priority: 0.6 },
    { url: "/contact", changeFrequency: "yearly", priority: 0.6 },
    { url: "/privacy-policy", changeFrequency: "yearly", priority: 0.2 },
    { url: "/terms", changeFrequency: "yearly", priority: 0.2 },
  ].map((r) => ({ ...r, url: `${SITE_URL}${r.url}` }));

  // No /services/<slug> URLs any more: the three detail pages were folded into
  // /services (owner, 2026-10-27) and the old URLs redirect to its sections
  // (next.config.mjs).

  // Brand collection pages. Only brands at the §23 threshold (3+ projects)
  // HAVE a page — listing all 66 here would advertise 59 URLs that 404.
  // Derived, so a brand appears the moment it reaches three projects.
  // A brand with no photographs AND no project page is noindex (its page's
  // generateMetadata) and is left out here too, until a photo arrives
  // (owner, 2026-10-01; lib/content/brandImages.js decides).
  const brands = stats.brandsWithCollectionPage();
  const indexable = await Promise.all(brands.map((b) => isBrandIndexable(brandSlug(b.brand))));
  const brandRoutes = brands
    .filter((_, i) => indexable[i])
    .map((b) => ({
      url: `${SITE_URL}/projects/brand/${brandSlug(b.brand)}`,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

  // State collection pages. NO threshold here, unlike the brands above: every
  // state has a bar on the home page linking to it, so all 16 must resolve.
  // Derived, so a new state appears the moment its first project lands.
  const stateRoutes = stats.statesByCount().map((s) => ({
    url: `${SITE_URL}/projects/state/${stateSlug(s.state)}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const projectRoutes = projectIds.map((id) => ({
    url: `${SITE_URL}/projects/${id}`,
    changeFrequency: "yearly",
    priority: 0.7,
  }));

  const blogRoutes = blogs.map((blog) => ({
    url: `${SITE_URL}/blogs/${blog.id}`,
    lastModified: new Date(blog.date),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...brandRoutes,
    ...stateRoutes,
    ...projectRoutes,
    ...blogRoutes,
  ];
}
