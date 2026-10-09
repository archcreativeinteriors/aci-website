// Schema registry for the Sanity Studio (spec §20/§21).
//
// brand and project: everything the site shows about the portfolio — counts,
// format breakdowns, state groupings, brand pages, the index — is derived from
// these by filtering, never by a third stored copy.
//
// Singletons (one document each, _id = type name): siteSettings (contact
// details + headline numbers), homeHero, homeSelectedProjects (references to
// project documents), clientLogos (the /clients logo wall, in rows), aboutPage
// (the /about intro: heading, photo, paragraphs), founder.
// Collections: teamMember, testimonial, faq, blogPost.
// Added 2026-09-28 (all content into Sanity): service (collection), legalPage
// (privacy-policy, terms), costingPage and homePage (singletons).

import brand from "./brand";
import project from "./project";
import homeHero from "./homeHero";
import homeSelectedProjects from "./homeSelectedProjects";
import clientLogos from "./clientLogos";
import aboutPage from "./aboutPage";
import founder from "./founder";
import siteSettings from "./siteSettings";
import teamMember from "./teamMember";
import testimonial from "./testimonial";
import faq from "./faq";
import blogPost from "./blogPost";
import service from "./service";
import costingPage from "./costingPage";
import legalPage from "./legalPage";
import homePage from "./homePage";

export const schemaTypes = [
    brand,
    project,
    homeHero,
    homeSelectedProjects,
    clientLogos,
    aboutPage,
    founder,
    siteSettings,
    teamMember,
    testimonial,
    faq,
    blogPost,
    service,
    costingPage,
    legalPage,
    homePage,
];
