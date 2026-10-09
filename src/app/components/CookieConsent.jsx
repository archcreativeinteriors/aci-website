"use client";

// The consent banner, plus the control that reopens it.
//
// Both live in this one "use client" file on purpose: Footer.jsx is a Server
// Component and must stay one (it renders on all 140 routes), and a server
// component may import a client component. Exporting the reopen button from
// here keeps the event name, the copy and the banner in a single file rather
// than coupling two components through a string in a third.
//
// It renders NOTHING until it has read the cookie. The alternative — render the
// banner, then hide it once storage says the visitor already answered — flashes
// a consent bar at every returning visitor on every page. Appearing one frame
// late is the better failure.
//
// IT IS A BLOCKING MODAL (owner, 2026-09-22): a scrim dims and blurs the page
// until Accept or Decline is chosen. Three things that has to bring with it, or
// it is a trap rather than a dialog:
//   * focus moves INTO it and is trapped, so a keyboard user is not tabbing
//     around a page they cannot see or click;
//   * the scrim is mount-gated exactly like the banner, so it can never appear
//     in the SSR HTML — a server-rendered scrim with no JS to dismiss it would
//     make the entire site unusable, which is the worst bug this file could
//     ship;
//   * clicking the scrim does NOTHING. Dismissing on an outside click would
//     record no choice while looking like it had, and "click anywhere to make
//     this go away" is the dark pattern this dialog exists to avoid.
// Escape is deliberately inert too — there is no "cancel" for a question with
// two free answers.
//
// Google exempts consent dialogs required by law from its intrusive-interstitial
// demotion, so this does not cost SEO. That exemption is the reason it is safe
// to block; do not extend the same treatment to a marketing pop-up.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
    ALL,
    ESSENTIAL,
    CONSENT_OPEN_EVENT,
    readConsent,
    writeConsent,
} from "../lib/consent";

export default function CookieConsent() {
    // null = not read yet (render nothing), false = answered, true = ask.
    const [open, setOpen] = useState(null);
    const dialogRef = useRef(null);

    useEffect(() => {
        setOpen(readConsent() === null);

        const reopen = () => setOpen(true);
        window.addEventListener(CONSENT_OPEN_EVENT, reopen);
        return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
    }, []);

    // Focus management. Runs only while the dialog is actually open.
    useEffect(() => {
        if (open !== true) return;
        const el = dialogRef.current;
        if (!el) return;

        const previouslyFocused = document.activeElement;

        // Focus the dialog itself rather than the Accept button: landing on a
        // control makes it look pre-selected, and it skips past the sentence
        // explaining what is being agreed to. The container carries the label,
        // so a screen reader announces the dialog, then the visitor tabs in.
        el.focus();

        const onKeyDown = (e) => {
            if (e.key !== "Tab") return;
            // The container is index 0 of the cycle, so shift-Tab from it wraps
            // to the last control instead of escaping into the dimmed page.
            const items = [el, ...el.querySelectorAll("button, a[href]")];
            const i = items.indexOf(document.activeElement);
            if (i === -1) { e.preventDefault(); el.focus(); return; }
            if (e.shiftKey && i === 0) {
                e.preventDefault();
                items[items.length - 1].focus();
            } else if (!e.shiftKey && i === items.length - 1) {
                e.preventDefault();
                items[0].focus();
            }
        };

        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
        };
    }, [open]);

    if (!open) return null;

    const choose = (value) => {
        writeConsent(value);
        setOpen(false);
    };

    return (
        <>
            {/* Inert by design — no onClick. See the note at the top of the file. */}
            <div className="ccScrim" />

            <div
                className="ccBar"
                ref={dialogRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby="cc-title"
                aria-describedby="cc-body"
            >
                <p className="ccTitle" id="cc-title">
                    Cookies
                </p>

                {/* Deliberately short and general (owner, 2026-09-22). An earlier
                    version explained the Google Maps request and the IP address it
                    carries; it was accurate but read as an essay. The detail now
                    lives in two better places: the privacy policy, and the map's own
                    placeholder, which says what it is at the moment it matters.
                    Keep this to one sentence. */}
                <p className="ccBody" id="cc-body">
                    We use cookies and content from other services to run this site and to
                    see how it is used.{" "}
                    <Link href="/privacy-policy">Privacy Policy</Link>
                </p>

                {/* Equal weight, both a real button. A prominent "Accept" beside a
                    greyed-out link is the pattern regulators single out, and it is
                    also just dishonest about which choice is free. */}
                <div className="ccActions">
                    <button type="button" className="ccBtn" onClick={() => choose(ALL)}>
                        Accept
                    </button>
                    <button
                        type="button"
                        className="ccBtn ccBtn--ghost"
                        onClick={() => choose(ESSENTIAL)}
                    >
                        Decline
                    </button>
                </div>
            </div>
        </>
    );
}

/**
 * "Cookie settings" — lets someone change their mind. Rendered in the footer's
 * legal row. A consent choice that cannot be withdrawn as easily as it was
 * given is not consent, and without this the cookie would lock the answer in
 * for 180 days.
 */
export function ConsentSettingsButton({ className }) {
    // Mount-gated: with no JS this button could not open anything, and a dead
    // control is worse than no control (CLAUDE.md, Phase 16.1).
    const [ready, setReady] = useState(false);
    useEffect(() => setReady(true), []);
    if (!ready) return null;

    return (
        <button
            type="button"
            className={className}
            onClick={() => window.dispatchEvent(new CustomEvent(CONSENT_OPEN_EVENT))}
        >
            Cookie settings
        </button>
    );
}
