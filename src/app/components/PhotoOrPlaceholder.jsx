"use client";

// A project / brand photograph that falls back to BrandPlaceholder — when
// there is no image at all, AND when the image fails to load (owner,
// 2026-10-01). Every place a brand or project photo is shown uses this, so a
// missing or broken photo looks the same everywhere and never leaves a
// broken-image box.
//
// The failure is caught twice: next/image's onError, and — for an image that
// failed before the page's JavaScript arrived, whose error event has already
// fired — a check on mount (`complete` with no pixels).
//
// Every other prop goes straight to CmsImage (fill, sizes, className, style…).

import { useState } from "react";
import CmsImage from "./CmsImage";
import BrandPlaceholder from "./BrandPlaceholder";

export default function PhotoOrPlaceholder({ image, name, placeholderClassName = "", ...props }) {
    const [failed, setFailed] = useState(false);

    if (!image || failed) return <BrandPlaceholder name={name} className={placeholderClassName} />;

    return (
        <CmsImage
            image={image}
            {...props}
            onError={() => setFailed(true)}
            ref={(el) => {
                if (el && el.complete && el.naturalWidth === 0) setFailed(true);
            }}
        />
    );
}
