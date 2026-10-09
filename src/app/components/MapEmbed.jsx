"use client";

// The Google Maps embed, behind consent.
//
// WHY THIS EXISTS: the footer renders a map on all 140 routes, so before this
// component every single page handed the visitor's IP to Google on scroll,
// unasked. Measured on /contact: 146 requests to Google-controlled hosts.
// loading="lazy" (Phase 9) kept that out of the INITIAL load; it never stopped
// it happening.
//
// THREE STATES, and the order matters:
//   1. no JS / not yet mounted -> the gate, with a real <a> to Google Maps.
//      A visitor with no JS gets working directions, not a dead button.
//   2. consent "all"           -> the iframe, exactly as before.
//   3. consent declined, or not answered -> the gate, plus a "Load map" button
//      that loads it for THIS INSTANCE only. One-off curiosity should not have
//      to become a 180-day standing permission.
//
// The gate is deliberately sized by the same CSS rules as the iframe (see
// footer.css / studio-location.css, where `.mapGate` was added to the existing
// iframe selectors rather than given its own). Two rules that must stay equal
// are one rule; if they drift, swapping in the map shifts the layout.

import Image from "next/image";
import { useEffect, useState } from "react";
// A decorative backdrop so the gate reads as a designed panel rather than an
// empty grey box.
//
// IT IS NOT A PHOTOGRAPH OF THE STUDIO, and it must not pretend to be one.
// There is none in the repo — the only files matching "studio" are client brand
// logos (Geetanjali Studio). Putting a project interior under "Visit Our
// Studio" beside the street address would read as the studio itself, which is
// the mistake Phase 20.6 records and spec §26 forbids. So it is rendered
// alt="" + aria-hidden: decoration, announced to nobody, asserting nothing.
// If a real studio or shopfront photograph ever arrives, drop it in here.
import gateBackdrop from "../../../public/hero4.jpg";
import { hasFullConsent, subscribeConsent } from "../lib/consent";

// `embedUrl` / `mapsUrl` come from Site settings (Sanity), passed down by the
// server component that renders this one.
export default function MapEmbed({ title, compact = false, embedUrl, mapsUrl }) {
    const [consented, setConsented] = useState(false);
    // Set by the per-instance "Load map" button. Never written to the cookie.
    const [once, setOnce] = useState(false);

    useEffect(() => {
        setConsented(hasFullConsent());
        return subscribeConsent(() => setConsented(hasFullConsent()));
    }, []);

    if (consented || once) {
        return (
            <iframe
                src={embedUrl}
                title={title}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
            />
        );
    }

    return (
        <div className="mapGate">
            <Image
                className="mapGateImg"
                src={gateBackdrop}
                alt=""
                aria-hidden="true"
                fill
                placeholder="blur"
                // The footer gate is a ~260px column on all 140 routes, so it
                // must not pull a full-width candidate. Audited against the
                // rendered box, per the sizes rule in CLAUDE.md.
                sizes={compact ? "300px" : "(max-width: 992px) 100vw, 720px"}
                style={{ objectFit: "cover" }}
            />

            <p className="mapGateText">
                {compact
                    ? "Map loads from Google."
                    : "The map loads from Google, which receives your IP address."}
            </p>

            <LoadButton onLoad={() => setOnce(true)} />

            {/* Always rendered, including with no JS — this is the part that has
                to work regardless of consent or scripting. */}
            <a
                className="mapGateLink"
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
            >
                Open in Google Maps
                <span aria-hidden="true"> &rarr;</span>
            </a>
        </div>
    );
}

// Mount-gated for the same reason as the footer's consent control: without JS
// this button cannot load anything, so it must not be in the HTML at all.
function LoadButton({ onLoad }) {
    const [ready, setReady] = useState(false);
    useEffect(() => setReady(true), []);
    if (!ready) return null;

    return (
        <button type="button" className="mapGateBtn" onClick={onLoad}>
            Load map
        </button>
    );
}
