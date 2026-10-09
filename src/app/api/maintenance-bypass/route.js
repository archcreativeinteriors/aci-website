// Lets the owner see the real site while maintenance mode is on.
//
//   /api/maintenance-bypass?key=<MAINTENANCE_BYPASS_SECRET>   → sets a cookie, opens the site
//   /api/maintenance-bypass?leave                             → removes it again
//
// The cookie holds a SHA-256 of the secret, never the secret itself, and
// next.config.mjs skips the maintenance rewrite for a request carrying exactly
// that value. The cookie name and the hash recipe are repeated there — keep
// the two in step. A wrong or missing key answers 404, the same as the route
// not existing, so the URL reveals nothing.

import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const COOKIE = "aci-maintenance-bypass"; // same name in next.config.mjs
const HOURS = 12;

const sha256 = (s) => createHash("sha256").update(s).digest();

const notFound = () =>
    new Response("Not Found", { status: 404, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });

export function GET(request) {
    const secret = process.env.MAINTENANCE_BYPASS_SECRET || "";
    if (!secret) return notFound();

    const url = new URL(request.url);
    const home = new URL("/", url);

    if (url.searchParams.has("leave")) {
        const res = NextResponse.redirect(home, 303);
        res.cookies.delete(COOKIE);
        res.headers.set("Cache-Control", "no-store");
        return res;
    }

    const expected = sha256(secret);
    if (!timingSafeEqual(sha256(url.searchParams.get("key") || ""), expected)) return notFound();

    const res = NextResponse.redirect(home, 303);
    res.cookies.set(COOKIE, expected.toString("hex"), {
        httpOnly: true,
        secure: url.protocol === "https:",
        sameSite: "lax",
        path: "/",
        maxAge: HOURS * 60 * 60,
    });
    res.headers.set("Cache-Control", "no-store");
    return res;
}
