"use client";

// /services — one service's "What's included" / "How we work" panel (owner,
// 2026-10-27, when the three /services/[slug] detail pages were folded into
// /services). Both lists come from the service in Sanity: `features` and
// `process` — the same fields the detail pages showed.
//
// Accessible tabs (WAI-ARIA pattern): role=tablist/tab/tabpanel, arrow keys,
// Home/End. Both panels are always in the HTML, so crawlers read the process
// steps too; without JavaScript the <noscript> rule shows both lists and hides
// the tab buttons. The first tab is active on the server and on the first
// client render alike, so nothing shifts on hydration.

import { useId, useRef, useState } from "react";
import { Check } from "lucide-react";

export default function ServiceTabs({ features = [], process = [] }) {
    const base = useId();
    const tabs = [
        features.length && { key: "included", label: "What's included" },
        process.length && { key: "process", label: "How we work" },
    ].filter(Boolean);
    const [active, setActive] = useState(tabs[0]?.key);
    const refs = useRef({});
    if (!tabs.length) return null;

    const onKey = (e, i) => {
        const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        const t = tabs[(next + tabs.length) % tabs.length];
        setActive(t.key);
        refs.current[t.key]?.focus();
    };

    return (
        <div className="svpTabs">
            <noscript>
                <style>{`.svpTabList{display:none}.svpPanel[hidden]{display:block}`}</style>
            </noscript>

            {tabs.length > 1 && (
                <div className="svpTabList" role="tablist" aria-label="Service details">
                    {tabs.map((t, i) => (
                        <button
                            key={t.key}
                            ref={(el) => (refs.current[t.key] = el)}
                            type="button"
                            role="tab"
                            id={`${base}-${t.key}-tab`}
                            aria-controls={`${base}-${t.key}`}
                            aria-selected={active === t.key}
                            tabIndex={active === t.key ? 0 : -1}
                            className={`svpTab${active === t.key ? " on" : ""}`}
                            onClick={() => setActive(t.key)}
                            onKeyDown={(e) => onKey(e, i)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            )}

            {features.length > 0 && (
                <div
                    className="svpPanel"
                    role={tabs.length > 1 ? "tabpanel" : undefined}
                    id={`${base}-included`}
                    aria-labelledby={tabs.length > 1 ? `${base}-included-tab` : undefined}
                    hidden={active !== "included"}
                >
                    <ul className="svpFeatures">
                        {features.map((item) => (
                            <li key={item}>
                                <Check size={15} aria-hidden="true" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {process.length > 0 && (
                <div
                    className="svpPanel"
                    role={tabs.length > 1 ? "tabpanel" : undefined}
                    id={`${base}-process`}
                    aria-labelledby={tabs.length > 1 ? `${base}-process-tab` : undefined}
                    hidden={active !== "process"}
                >
                    <ol className="svpSteps">
                        {process.map((step, i) => (
                            <li key={step}>
                                <span className="svpStepN" aria-hidden="true">
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <span className="svpStepT">{step}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}
