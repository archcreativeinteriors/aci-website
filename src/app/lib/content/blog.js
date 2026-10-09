// Blog posts — /blogs, /blogs/[id], the sitemap and the Article JSON-LD.

import { cache } from "react";
import { sanityFetch } from "./sanity";
import { BLOG_POSTS } from "./queries";

// "2026-06-12" -> "June 12, 2026" — the format the pages print, the sitemap
// parses and articleJsonLd() anchors to midday UTC.
const LONG_DATE = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const formatDate = (iso) => (iso ? LONG_DATE.format(new Date(`${iso}T00:00:00Z`)) : "");

/**
 * Every post, newest first:
 * { id, title, image, date, author?, category, excerpt, metaDescription?,
 *   relatedService?, content: [{ heading, paragraphs[] }] }
 * A post without a title or cover photo is left out.
 */
export const getBlogs = cache(async () =>
    ((await sanityFetch(BLOG_POSTS)) || [])
        .filter((b) => b && b.id && b.title && b.image?.url)
        .map((b) => ({
            id: b.id,
            title: b.title,
            image: b.image,
            date: formatDate(b.date),
            ...(b.author ? { author: b.author } : {}),
            category: b.category || "",
            excerpt: b.excerpt || "",
            ...(b.metaDescription ? { metaDescription: b.metaDescription } : {}),
            ...(b.relatedService ? { relatedService: b.relatedService } : {}),
            content: (b.content || []).map((s) => ({ heading: s.heading || "", paragraphs: (s.paragraphs || []).filter(Boolean) })),
        }))
);

/** One post by its id (slug), or null. */
export async function getBlog(id) {
    return (await getBlogs()).find((b) => b.id === id) || null;
}
