// Sanity `blogPost` document — one article under /blogs.
//
// Read through src/app/lib/contentSource.js (getBlogs / getBlog), which falls
// back to src/app/lib/data/blogs.js while no Sanity project is connected.
// contentSource maps these fields onto the local shape, so the pages, the
// sitemap and the Article JSON-LD do not know which source they read:
//   slug.current -> id     date (YYYY-MM-DD) -> "June 12, 2026"
//
// The body is SECTIONS, not rich text, on purpose: it is exactly the local
// model ({ heading, paragraphs[] }) that blogs/[id] renders. Paragraphs are
// plain text — no inline links or lists — which is a limit of that page, not of
// Sanity; widen the page before widening this.

const SERVICES = [
    { title: "Salon", value: "salon" },
    { title: "Residential", value: "residential" },
    { title: "Commercial", value: "commercial" },
];

export default {
    name: "blogPost",
    title: "Blog post",
    type: "document",
    fields: [
        { name: "title", title: "Title", type: "string", validation: (R) => R.required() },
        {
            name: "slug",
            title: "Slug",
            type: "slug",
            options: { source: "title", maxLength: 96 },
            description: "The URL: /blogs/<slug>. Changing it after publishing breaks existing links.",
            validation: (R) => R.required(),
        },
        {
            name: "image",
            title: "Cover image",
            type: "image",
            options: { hotspot: true },
            fields: [
                {
                    name: "alt",
                    title: "Alt text",
                    type: "string",
                    description: "Leave blank to use the post title.",
                },
            ],
            validation: (R) => R.required(),
        },
        {
            name: "date",
            title: "Published",
            type: "date",
            options: { dateFormat: "MMMM D, YYYY" },
            validation: (R) => R.required(),
        },
        { name: "author", title: "Author", type: "string", description: 'e.g. "Ms. Shivani Rawat". Optional.' },
        {
            name: "category",
            title: "Category",
            type: "string",
            description: 'e.g. "Salon Interior Design".',
            validation: (R) => R.required(),
        },
        {
            name: "excerpt",
            title: "Excerpt",
            type: "text",
            rows: 3,
            description: "The teaser on the blog list and the intro paragraph of the post.",
            validation: (R) => R.required(),
        },
        {
            name: "metaDescription",
            title: "Search description",
            type: "text",
            rows: 2,
            description:
                "About 150 characters, shown by Google under the title. Leave blank to use the excerpt.",
            validation: (R) => R.max(160).warning("Google cuts descriptions off around 155–160 characters."),
        },
        {
            name: "relatedService",
            title: "Related service",
            type: "string",
            options: { list: SERVICES, layout: "radio" },
            description: "Adds an end-of-post call to action linking to that service page. Optional.",
        },
        {
            name: "content",
            title: "Article",
            type: "array",
            of: [
                {
                    name: "section",
                    title: "Section",
                    type: "object",
                    fields: [
                        { name: "heading", title: "Heading", type: "string", validation: (R) => R.required() },
                        {
                            name: "paragraphs",
                            title: "Paragraphs",
                            type: "array",
                            of: [{ type: "text", rows: 4 }],
                            validation: (R) => R.required().min(1),
                        },
                    ],
                    preview: { select: { title: "heading" } },
                },
            ],
            validation: (R) => R.required().min(1),
        },
    ],
    orderings: [{ title: "Newest first", name: "dateDesc", by: [{ field: "date", direction: "desc" }] }],
    preview: { select: { title: "title", subtitle: "date", media: "image" } },
};
