// Sanity Studio configuration.
//
// The schemas in sanity/schemas/ have existed since Phase 21 but there was no
// Studio to deploy them with, so nothing could be edited or even created. This
// is that missing piece.
//
// The Studio is STANDALONE, not embedded at a /studio route in the Next app.
// Embedding would pull the whole Studio bundle into a site that is otherwise
// fully static and whose entire point is being light — and it would put an
// editing surface behind the same nginx/Node process that serves the public
// pages. Run it locally with `npm run sanity:dev` (localhost:3333) and publish
// it to <projectId>.sanity.studio with `npm run sanity:deploy`.
//
// ── project id ───────────────────────────────────────────────────────────────
// Studio only inlines env vars prefixed `SANITY_STUDIO_`, so the app's
// NEXT_PUBLIC_SANITY_PROJECT_ID is not visible to the Studio bundle at runtime.
// Set SANITY_STUDIO_PROJECT_ID in `.env` — or, since a Sanity project id is
// public and never changes, simply paste it in place of the fallback below.
// Both are fine; what is not fine is letting it silently default to something.

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";

import { schemaTypes } from "./sanity/schemas";

// Document types that exist exactly once, with _id equal to the type name.
const SINGLETONS = new Set([
    "siteSettings",
    "homeHero",
    "homeSelectedProjects",
    "clientLogos",
    "aboutPage",
    "founder",
    "homePage",
    "costingPage",
]);

// A desk entry that opens a singleton's one document instead of a list.
const singleton = (S, type, title) =>
    S.listItem().title(title).id(type).child(S.document().schemaType(type).documentId(type));

// A desk entry listing one type, sorted the way the site sorts it.
const orderedList = (S, type, title, field, direction) =>
    S.listItem()
        .title(title)
        .id(type)
        .child(S.documentTypeList(type).title(title).defaultOrdering([{ field, direction }]));

const projectId =
    process.env.SANITY_STUDIO_PROJECT_ID ||
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
    "";

const dataset =
    process.env.SANITY_STUDIO_DATASET ||
    process.env.NEXT_PUBLIC_SANITY_DATASET ||
    "production";

if (!projectId) {
    throw new Error(
        "No Sanity project id.\n" +
            "Create a project at https://sanity.io/manage, then either set\n" +
            "SANITY_STUDIO_PROJECT_ID in .env or paste the id into sanity.config.js.\n" +
            "The same id also goes in NEXT_PUBLIC_SANITY_PROJECT_ID for the site."
    );
}

export default defineConfig({
    name: "arch-creative-interiors",
    title: "Arch Creative Interiors",

    projectId,
    dataset,

    plugins: [
        // Projects are grouped by brand in the desk, because the roster is 192
        // rows of which 104 are one brand — a flat alphabetical list of
        // "Geetanjali Salon" repeated a hundred times is unusable.
        structureTool({
            structure: (S) =>
                S.list()
                    .title("Content")
                    .items([
                        S.listItem()
                            .title("Projects")
                            .child(
                                S.documentTypeList("project")
                                    .title("Projects")
                                    .defaultOrdering([
                                        { field: "listNo", direction: "desc" },
                                        { field: "_createdAt", direction: "desc" },
                                    ])
                            ),
                        S.listItem()
                            .title("Projects by brand")
                            .child(
                                S.documentTypeList("brand")
                                    .title("Brands")
                                    .child((brandId) =>
                                        S.documentList()
                                            .title("Projects")
                                            .filter('_type == "project" && brand._ref == $brandId')
                                            .params({ brandId })
                                            .defaultOrdering([
                                                { field: "listNo", direction: "desc" },
                                                { field: "_createdAt", direction: "desc" },
                                            ])
                                    )
                            ),
                        S.divider(),
                        S.documentTypeListItem("brand").title("Brands"),
                        S.divider(),
                        singleton(S, "siteSettings", "Site settings (contact & numbers)"),
                        singleton(S, "homeHero", "Home hero"),
                        singleton(S, "homePage", "Home page (What we do)"),
                        singleton(S, "homeSelectedProjects", "Selected projects (home)"),
                        singleton(S, "clientLogos", "Client logos"),
                        singleton(S, "aboutPage", "About page"),
                        singleton(S, "founder", "Founder"),
                        singleton(S, "costingPage", "Costing page"),
                        S.divider(),
                        orderedList(S, "teamMember", "Team", "order", "asc"),
                        orderedList(S, "testimonial", "Testimonials / reviews", "order", "asc"),
                        orderedList(S, "faq", "FAQs", "order", "asc"),
                        orderedList(S, "blogPost", "Blog posts", "date", "desc"),
                        S.divider(),
                        orderedList(S, "service", "Services", "order", "asc"),
                        orderedList(S, "legalPage", "Legal pages", "title", "asc"),
                    ]),
        }),

        // GROQ playground. The projections in src/app/lib/cms/queries.js are meant
        // to be pasted in here and run against the real dataset before the
        // front end is switched over to them.
        visionTool({ defaultApiVersion: "2024-01-01" }),
    ],

    schema: { types: schemaTypes },

    // Keep the singletons single: they cannot be created from the "new
    // document" menu, duplicated, or deleted — only edited in place from their
    // Content entry (Site settings, Home hero, Selected projects, Client logos,
    // About page, Founder). A second copy would leave the site choosing between
    // two.
    document: {
        newDocumentOptions: (prev) => prev.filter((item) => !SINGLETONS.has(item.templateId)),
        actions: (prev, { schemaType }) =>
            SINGLETONS.has(schemaType)
                ? prev.filter(({ action }) => !["duplicate", "delete", "unpublish"].includes(action))
                : prev,
    },
});
