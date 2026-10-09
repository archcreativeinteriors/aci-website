"use client";
import { useRef, useEffect, useState } from "react";

// Resilient scroll-in reveal. Content is VISIBLE by default (in the SSR HTML and
// if JS never runs / is slow) — JS only enhances it with a fade-up. This replaced
// a framer-motion version whose `initial={{opacity:0}}` left the whole page blank
// on slow connections until the JS bundle loaded.
export default function ScrollReveal({ children, className = "" }) {
    const ref = useRef(null);
    const [state, setState] = useState("idle"); // idle (visible) -> armed (hidden) -> in

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        // Already on screen at mount → don't hide-then-show, just mark in.
        if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
            setState("in");
            return;
        }

        setState("armed");
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setState("in");
                    io.disconnect();
                }
            },
            { rootMargin: "0px 0px -10% 0px" }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <div ref={ref} data-reveal={state} className={className}>
            {children}
        </div>
    );
}
