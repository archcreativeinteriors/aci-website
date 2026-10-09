"use client";

import { useEffect, useState } from "react";
import { FaAngleUp } from "react-icons/fa";

export default function ScrollTop() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShow(window.scrollY > 400);
        };

        // Check once on mount, not only on the next scroll event. Browsers restore
        // the previous scroll position on reload/back-navigation (phones especially),
        // which fires no scroll event — without this the button stays hidden on a
        // page that is already scrolled far down.
        handleScroll();

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <button
            className={`scroll-top-btn ${show ? "show" : ""}`}
            onClick={() =>
                window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                })
            }
        >
            <FaAngleUp />
        </button>
    );
}