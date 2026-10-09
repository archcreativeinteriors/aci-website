// The consent contract, defined once.
//
// WHAT IS ACTUALLY BEING CONSENTED TO, because it is not what people assume.
// Measured against a production build with Chrome's net-log on 2026-09-22:
// loading /contact fires 146 requests to Google-controlled hosts
// (maps.googleapis.com 112, www.google.com 23, maps.gstatic.com 11), and the
// site-wide footer map puts that on EVERY route. A fresh browser profile
// persisted ZERO cookies from them. So the thing that needs consent here is the
// third-party REQUEST — it hands the visitor's IP and user-agent to Google
// before they have asked for a map — not a cookie Google may or may not set.
// Say "third-party content", not "cookies", in any copy that describes this.
//
// NOT gated, and this is deliberate: every photograph on the site is served
// first-party from /_next/image. Images set no cookie and make no third-party
// request, so gating them would blank the page and wreck LCP for no privacy
// gain. That includes Sanity images: our server fetches them from
// cdn.sanity.io and serves them from our own domain (owner, 2026-09-25 — see
// components/SanityImage.jsx), so the browser never contacts Sanity. If an
// <img> is ever pointed at cdn.sanity.io directly, it becomes a third-party
// request and belongs behind ALL, alongside the map.

export const CONSENT_COOKIE = "aci-consent";

// Bump when the categories change meaning. An older version is treated as no
// answer, so the banner asks again rather than silently assuming the old choice
// still covers something new.
export const CONSENT_VERSION = 1;

// 180 days. Long enough not to nag, short enough that consent is periodically
// re-confirmed rather than being permanent.
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 180;

// "all"       — third-party embeds and analytics may load.
// "essential" — neither may. The site works; the map becomes a link.
export const ALL = "all";
export const ESSENTIAL = "essential";

// Fired on window whenever the choice changes, so every mounted map and the
// analytics wrapper update together without a reload and without a store.
export const CONSENT_EVENT = "aci:consent";

// Asks the banner to reopen (the footer's "Cookie settings" control).
export const CONSENT_OPEN_EVENT = "aci:consent-open";

/**
 * The stored choice, or null if there is none / it is stale / storage is
 * unreadable. Null means "ask" — never assume consent from a read failure.
 */
export function readConsent() {
    if (typeof document === "undefined") return null;
    let raw;
    try {
        raw = document.cookie
            .split("; ")
            .find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
    } catch {
        return null;
    }
    if (!raw) return null;

    // Stored as "<version>:<value>".
    const [version, value] = raw.slice(CONSENT_COOKIE.length + 1).split(":");
    if (Number(version) !== CONSENT_VERSION) return null;
    return value === ALL || value === ESSENTIAL ? value : null;
}

/** True only for an explicit "all". Anything else — including no answer. */
export function hasFullConsent() {
    return readConsent() === ALL;
}

/**
 * Record a choice and tell everything listening. A cookie rather than
 * localStorage because recording a consent decision is itself a
 * strictly-necessary purpose, and a cookie is what a visitor (or a regulator)
 * can actually inspect. SameSite=Lax; no Secure flag in dev, because a Secure
 * cookie is silently dropped on http://localhost and the banner would then
 * reappear on every page.
 */
export function writeConsent(value) {
    if (typeof document === "undefined") return;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    try {
        document.cookie =
            `${CONSENT_COOKIE}=${CONSENT_VERSION}:${value}` +
            `; path=/; max-age=${CONSENT_MAX_AGE}; SameSite=Lax${secure}`;
    } catch {
        // A blocked cookie jar must not throw into a click handler. The choice
        // then lasts for the page only, which is the safe way to fail.
    }
    try {
        window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
    } catch {
        /* no CustomEvent in a very old browser — nothing else to do */
    }
}

/**
 * Subscribe to consent changes. Returns an unsubscribe function, so an effect
 * can `return subscribeConsent(fn)` directly.
 */
export function subscribeConsent(fn) {
    if (typeof window === "undefined") return () => {};
    const handler = () => fn(readConsent());
    window.addEventListener(CONSENT_EVENT, handler);
    return () => window.removeEventListener(CONSENT_EVENT, handler);
}
