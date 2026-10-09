import { SITE_URL } from "./lib/site";

// Never crawled: the contact form and the Sanity webhook (POST-only endpoints).
const DISALLOW = ["/api/"];

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
      // Explicit allow for AI answer-engine / agent crawlers — the wildcard
      // rule above already permits them, but naming them is the recognized
      // signal these operators look for, and future-proofs against someone
      // later adding a blanket disallow without an AI-bot carve-out.
      //
      // Each repeats the disallow: a crawler obeys ONLY the most specific group
      // naming it (RFC 9309), not the `*` group as well, so without it these
      // bots were allowed into /api/.
      ...["GPTBot", "ChatGPT-User", "ClaudeBot", "Claude-Web", "PerplexityBot", "Google-Extended", "CCBot"].map(
        (userAgent) => ({ userAgent, allow: "/", disallow: DISALLOW }),
      ),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
