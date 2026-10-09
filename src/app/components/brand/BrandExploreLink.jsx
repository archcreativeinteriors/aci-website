"use client";

// "Explore more about {brand}" in the brand hero: a plain in-page link to the
// brand's project list (#all-projects), so it works with no JavaScript.
//
// The site scrolls smoothly to in-page links (`html { scroll-behavior: smooth }`
// in globals.css) and that rule does not check prefers-reduced-motion. This
// link does: with reduced motion it jumps instead of gliding. The global rule
// is left alone.

import { ArrowDown } from "lucide-react";

export default function BrandExploreLink({ href, children }) {
    const onClick = (e) => {
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "instant", block: "start" });
        history.pushState(null, "", href);
    };

    return (
        <a className="bh-explore" href={href} onClick={onClick}>
            <span>{children}</span>
            <ArrowDown className="bh-explore__arrow" size={16} strokeWidth={2} aria-hidden="true" />
        </a>
    );
}
