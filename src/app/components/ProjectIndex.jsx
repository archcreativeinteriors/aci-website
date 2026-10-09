"use client";

// Cursor-following photo preview for the /projects index (execution plan §7/§14).
//
// This is a PROGRESSIVE ENHANCEMENT layer and nothing more. The rows it wraps
// are plain server-rendered <Link>s that are complete, readable and clickable
// with no JavaScript at all — if this bundle never loads you lose the floating
// photo, not the page. Do not move row content in here (see Phase 10.11, where
// gating content on client JS left the whole site blank on a slow connection).

import { useEffect, useRef, useState } from "react";

const FOLLOW_OFFSET = { x: 28, y: -120 };

// How long a photo may take before the panel shows the loading shimmer
// (components/ImageSkeleton). A cached photo arrives well inside this, so it
// swaps in with no flash of grey.
const SKELETON_DELAY_MS = 120;

export default function ProjectIndex({ children }) {
    const containerRef = useRef(null);
    const previewRef = useRef(null);
    const frameRef = useRef(0);

    // Two stacked layers so a change cross-fades (§14, 450ms) instead of
    // flashing blank while the next photo decodes.
    const [layers, setLayers] = useState(["", ""]);
    const [active, setActive] = useState(0);
    const [visible, setVisible] = useState(false);
    // True while the hovered row's photo is still loading: the panel then shows
    // a shimmer instead of the previous row's photo (data-skeleton below).
    const [loading, setLoading] = useState(false);
    const loadingTimer = useRef(0);
    const currentSrc = useRef("");

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // No hover on touch — §7 gives those rows an inline thumbnail instead.
        if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const show = (src, el) => {
            if (!src || src === currentSrc.current) return;
            currentSrc.current = src;

            // Decode before swapping, so the cross-fade never reveals a blank box.
            const img = new window.Image();
            img.src = src;
            const reveal = () => {
                if (currentSrc.current !== src) return; // moved on already
                clearTimeout(loadingTimer.current);
                setLoading(false);
                setLayers((prev) => {
                    const next = [...prev];
                    next[active === 0 ? 1 : 0] = src;
                    return next;
                });
                setActive((a) => (a === 0 ? 1 : 0));
                setVisible(true);
            };
            // A photo that fails leaves nothing to show: close the panel rather
            // than leave the shimmer running.
            const fail = () => {
                if (currentSrc.current !== src) return;
                clearTimeout(loadingTimer.current);
                setLoading(false);
                setVisible(false);
            };
            clearTimeout(loadingTimer.current);
            if (img.complete) reveal();
            else {
                img.addEventListener("load", reveal, { once: true });
                img.addEventListener("error", fail, { once: true });
                // Still loading after a moment: show the panel with the shimmer.
                loadingTimer.current = setTimeout(() => {
                    if (currentSrc.current !== src) return;
                    setLoading(true);
                    setVisible(true);
                }, SKELETON_DELAY_MS);
            }

            if (reduce && el) anchorTo(el);
        };

        const hide = () => {
            currentSrc.current = "";
            clearTimeout(loadingTimer.current);
            setLoading(false);
            setVisible(false);
        };

        // Under reduced motion the panel does not chase the cursor — it parks
        // beside the row instead. Same for keyboard focus, which has no pointer.
        const anchorTo = (el) => {
            const node = previewRef.current;
            if (!node) return;
            const rect = el.getBoundingClientRect();
            node.style.transform = `translate3d(${rect.right - 320}px, ${rect.top - 40}px, 0)`;
        };

        // One delegated listener, not 187 — the index can run to ~190 rows.
        const onOver = (event) => {
            const row = event.target.closest?.("[data-preview]");
            if (!row || !container.contains(row)) return hide();
            show(row.dataset.preview, row);
        };

        const onMove = (event) => {
            if (reduce) return;
            cancelAnimationFrame(frameRef.current);
            const { clientX, clientY } = event;
            frameRef.current = requestAnimationFrame(() => {
                const node = previewRef.current;
                if (!node) return;
                node.style.transform =
                    `translate3d(${clientX + FOLLOW_OFFSET.x}px, ${clientY + FOLLOW_OFFSET.y}px, 0)`;
            });
        };

        // §14: every effect fires on :focus-visible as well as :hover.
        const onFocus = (event) => {
            const row = event.target.closest?.("[data-preview]");
            if (!row) return hide();
            anchorTo(row);
            show(row.dataset.preview, row);
        };

        container.addEventListener("pointerover", onOver);
        container.addEventListener("pointermove", onMove);
        container.addEventListener("pointerleave", hide);
        container.addEventListener("focusin", onFocus);
        container.addEventListener("focusout", hide);

        return () => {
            cancelAnimationFrame(frameRef.current);
            clearTimeout(loadingTimer.current);
            container.removeEventListener("pointerover", onOver);
            container.removeEventListener("pointermove", onMove);
            container.removeEventListener("pointerleave", hide);
            container.removeEventListener("focusin", onFocus);
            container.removeEventListener("focusout", hide);
        };
    }, [active]);

    return (
        <div className="project-index-wrap" ref={containerRef}>
            {children}

            <div
                className={`project-preview${visible ? " is-visible" : ""}`}
                ref={previewRef}
                aria-hidden="true"
                data-skeleton={loading ? "loading" : undefined}
            >
                {layers.map((src, i) => (
                    <img
                        key={i}
                        src={src || undefined}
                        alt=""
                        className={`project-preview-layer${active === i ? " is-active" : ""}`}
                        decoding="async"
                    />
                ))}
            </div>
        </div>
    );
}
