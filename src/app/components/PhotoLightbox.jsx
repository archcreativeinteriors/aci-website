"use client";

// Full-size photo viewer for /projects/[id].
//
// The page renders every photograph as a plain link (`a[data-zoom="<n>"]`) to
// its full-size first-party URL, so with no JS a click still opens the whole
// photo. This component only layers the viewer on top: it catches those clicks
// and shows photo n in a modal <dialog>, with previous / next, arrow keys,
// Escape, swipe on touch screens and a click on the dark area to close.
// Ctrl / Cmd / Shift / middle click are left alone (open in a new tab).
//
// A native <dialog> opened with showModal() sits in the browser's top layer,
// above the fixed header, the floating buttons and the cookie banner, without a
// z-index; it also makes the page behind inert and returns focus to the photo
// that opened it.
//
// Images load from our own /_next/image (lib/content zoomPhoto()), never from
// cdn.sanity.io — the privacy policy's "no third party for images".
//
// Rendered only after mount: the viewer is a JS-only control, so it is kept out
// of the SSR HTML.

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const SWIPE_MIN = 50; // px of horizontal travel that counts as a swipe

// The next photo in direction `by` (1 or -1), wrapping round. The page leaves a
// null where a photo has no URL (it keeps its index), so those are skipped.
function nextIndex(photos, from, by) {
    for (let n = 1; n <= photos.length; n++) {
        const i = (((from + by * n) % photos.length) + photos.length) % photos.length;
        if (photos[i]) return i;
    }
    return from;
}

export default function PhotoLightbox({ photos }) {
    const dialogRef = useRef(null);
    const touchX = useRef(null);
    const [mounted, setMounted] = useState(false);
    // Index of the photo on screen; null while closed.
    const [index, setIndex] = useState(null);
    // The src whose image has finished (or failed) loading. Until the photo on
    // screen is that one, it carries data-skeleton="loading" and shows the
    // shimmer from components/ImageSkeleton/image-skeleton.css.
    const [loadedSrc, setLoadedSrc] = useState(null);

    // Real photos only (see nextIndex), for the counter and the arrows.
    const count = photos.filter(Boolean).length;
    const open = index !== null;
    const photo = open ? photos[index] : null;

    useEffect(() => setMounted(true), []);

    // Open from any photo link on the page.
    useEffect(() => {
        const onClick = (e) => {
            if (e.defaultPrevented || e.button !== 0) return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            const link = e.target instanceof Element && e.target.closest("a[data-zoom]");
            if (!link) return;
            const i = Number(link.dataset.zoom);
            if (!Number.isInteger(i) || !photos[i]) return;
            e.preventDefault();
            setIndex(i);
        };
        document.addEventListener("click", onClick);
        return () => document.removeEventListener("click", onClick);
    }, [photos]);

    // Keep the <dialog> in step with the state, and stop the page behind it
    // from scrolling (html.lbOpen, project-detail.css).
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
        document.documentElement.classList.toggle("lbOpen", open);
    }, [open, mounted]);

    useEffect(() => () => document.documentElement.classList.remove("lbOpen"), []);

    // Fetch the neighbours in advance so next / previous shows at once.
    useEffect(() => {
        if (!open || count < 2) return;
        for (const i of [nextIndex(photos, index, 1), nextIndex(photos, index, -1)]) {
            const img = new Image();
            img.sizes = "100vw";
            img.srcset = photos[i].srcSet;
            img.src = photos[i].src;
        }
    }, [open, index, count, photos]);

    if (!mounted) return null;

    const step = (by) => setIndex((i) => (i === null ? i : nextIndex(photos, i, by)));
    const close = () => setIndex(null);

    const onKeyDown = (e) => {
        if (count < 2) return;
        if (e.key === "ArrowRight") {
            e.preventDefault();
            step(1);
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            step(-1);
        }
    };

    const onTouchStart = (e) => {
        touchX.current = e.touches.length === 1 ? e.touches[0].clientX : null;
    };

    const onTouchEnd = (e) => {
        if (touchX.current === null || count < 2) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) >= SWIPE_MIN) step(dx < 0 ? 1 : -1);
    };

    return (
        <dialog
            ref={dialogRef}
            className="lb"
            aria-label="Photo viewer"
            onClose={close}
            onKeyDown={onKeyDown}
        >
            {/* Close comes first in the DOM, so showModal() focuses it. */}
            <button type="button" className="lbBtn lbClose" onClick={close} aria-label="Close photo viewer">
                <X size={24} aria-hidden="true" />
            </button>

            <div
                className="lbStage"
                onClick={(e) => e.target === e.currentTarget && close()}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                {photo && (
                    // A plain <img>: the URLs are already /_next/image ones.
                    <img
                        key={photo.src}
                        className="lbImg"
                        src={photo.src}
                        srcSet={photo.srcSet}
                        sizes="100vw"
                        alt={photo.alt}
                        width={photo.width ?? undefined}
                        height={photo.height ?? undefined}
                        decoding="async"
                        // The photo's shape, so image-skeleton.css can size the
                        // box before the photo arrives (see --lb-ratio there).
                        style={
                            photo.width && photo.height
                                ? { "--lb-ratio": photo.width / photo.height }
                                : undefined
                        }
                        data-skeleton={loadedSrc === photo.src ? undefined : "loading"}
                        onLoad={() => setLoadedSrc(photo.src)}
                        onError={() => setLoadedSrc(photo.src)}
                        // Already complete (e.g. preloaded as a neighbour):
                        // no shimmer to wait for.
                        ref={(el) => {
                            if (el?.complete && el.naturalWidth > 0) setLoadedSrc(photo.src);
                        }}
                    />
                )}
            </div>

            {count > 1 && (
                <>
                    <button type="button" className="lbBtn lbPrev" onClick={() => step(-1)} aria-label="Previous photo">
                        <ChevronLeft size={28} aria-hidden="true" />
                    </button>
                    <button type="button" className="lbBtn lbNext" onClick={() => step(1)} aria-label="Next photo">
                        <ChevronRight size={28} aria-hidden="true" />
                    </button>
                </>
            )}

            {photo && (
                <p className="lbCaption" aria-live="polite">
                    <span className="lbAlt">{photo.alt}</span>
                    {count > 1 && (
                        <span className="lbCount">
                            {photos.slice(0, index + 1).filter(Boolean).length} / {count}
                        </span>
                    )}
                </p>
            )}
        </dialog>
    );
}
