// THE data-access layer (Phase 6, 2026-09-28). Every page and component gets
// its content from here — never from a local content file, and never by
// calling Sanity itself. Everything comes from Sanity (published documents
// only); a missing required document stops the build with a message naming it.
// DATA_SOURCES.md lists each content type, its query and the pages that use it.

export { getSiteSettings } from "./settings";
export { getHomeHero, getHomePage } from "./home";
export {
    getProjectRows,
    getStats,
    getProjects,
    getPublishedProjects,
    getProject,
    getProjectPageIds,
    getProjectPage,
    getSelectedProjects,
} from "./projects";
export { getLocations } from "./locations";
export { getFounder, getTeam, getTestimonials } from "./people";
export { getAboutPage, getFaqs, getCostingPage, getLegalPage } from "./pages";
export { getServices, getService } from "./services";
export { getBlogs, getBlog } from "./blog";
export { getClientLogoRows, clientLogoAlt } from "./clients";
export { getBrandImages, hasPhotos, getCoverImage, isBrandIndexable } from "./brandImages";

// Pure helpers (no data of their own).
export {
    BRAND_COLLECTION_MIN,
    brandSlug,
    brandHref,
    stateSlug,
    stateDisplay,
    formatBreakdown,
    groupByState,
} from "./stats";
export { shareImageUrl, previewUrl, zoomPhoto, sanityImageBase, sanityImageLoader } from "./image";
