"use client";

// Animated stat counter — the home hero and /about show the SAME four figures,
// three of them derived from PROJECT_STATS.
//
// This is NOT the framer-motion implementation it was adapted from, for three
// reasons, each recorded in CLAUDE.md:
//
//   1. framer-motion was UNINSTALLED in Phase 26 (zero imports left in the
//      tree). Re-adding it to animate four integers puts a ~35 KB gzipped
//      dependency back into every route that mounts this.
//
//   2. The motion version renders 0 on the server and only reaches the real
//      figure once its bundle has run. Phase 6.4 fixed exactly that bug in the
//      old Achievement.jsx ("real stat numbers now in the SSR HTML, was literal
//      0"), and Phase 10.11 is the same failure at whole-page scale. So this
//      renders the FINAL number during SSR and animates only AFTER hydration:
//      a reader with no JS, a stalled bundle, or a crawler sees 1000+/42/16
//      and never a row of zeros. (Four figures until 2026-09-17, when the
//      project total was removed site-wide — see the comment in HomeHero.jsx.)
//
//   3. The repo is JS/JSX (CLAUDE.md: keep new files .js/.jsx), has no Tailwind
//      and no `cn` helper — `@/lib/utils` and `tabular-nums` do not exist here.
//      The tabular figures live in styles/stat-counter.css instead.

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// useLayoutEffect warns when React renders on the server, where it is a no-op.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export default function StatCounter({ value, prefix = "", suffix = "", duration = 1400 }) {
    const ref = useRef(null);
    // Seeded with the real figure, so SSR and the first client render agree
    // (no hydration mismatch) and a no-JS reader keeps the number.
    const [display, setDisplay] = useState(value);

    useIsoLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;

        const reduced =
            typeof window.matchMedia === "function" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        // Reduced motion, or no IntersectionObserver: keep the static figure.
        // Never count up from 0 without being able to tell when it is on screen.
        if (reduced || typeof IntersectionObserver === "undefined") return;

        // Reset in a LAYOUT effect — before paint — so hydration cannot flash
        // the final number and snap back to zero.
        setDisplay(0);

        let raf = 0;
        let started = false;

        const run = () => {
            const t0 = performance.now();
            const tick = (now) => {
                const p = Math.min(1, (now - t0) / duration);
                setDisplay(Math.round(easeOutCubic(p) * value));
                if (p < 1) raf = requestAnimationFrame(tick);
            };
            raf = requestAnimationFrame(tick);
        };

        const io = new IntersectionObserver(
            (entries) => {
                if (started || !entries[0].isIntersecting) return;
                started = true;
                io.disconnect();
                run();
            },
            { rootMargin: "0px 0px -80px 0px" }
        );
        io.observe(el);

        return () => {
            io.disconnect();
            cancelAnimationFrame(raf);
        };
    }, [value, duration]);

    return (
        <span className="statCount" ref={ref}>
            {prefix}
            {display}
            {suffix}
        </span>
    );
}
