// Renders a legal page's Portable Text body (sanity/schemas/legalPage.js).
//
// A tiny renderer rather than @portabletext/react, on purpose: the schema
// allows exactly five things — paragraphs, Heading 2, bullet lists, bold and
// italic — so this is the whole job, it adds no dependency, and it produces
// the same markup the pages had when the text was typed into the JSX
// (<p>, <h2>, <ul><li>, <strong>). Anything else in a block renders as a plain
// paragraph rather than disappearing.

import { Fragment } from "react";

function Spans({ children = [] }) {
    return children.map((span, i) => {
        let node = span.text || "";
        if (span.marks?.includes("em")) node = <em>{node}</em>;
        if (span.marks?.includes("strong")) node = <strong>{node}</strong>;
        return <Fragment key={span._key || i}>{node}</Fragment>;
    });
}

export default function LegalBody({ blocks = [] }) {
    const out = [];
    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        if (b._type !== "block") continue;
        if (b.listItem === "bullet") {
            // Consecutive bullet blocks are one list.
            const items = [];
            while (i < blocks.length && blocks[i]._type === "block" && blocks[i].listItem === "bullet") {
                items.push(blocks[i]);
                i++;
            }
            i--;
            out.push(
                <ul key={b._key || i}>
                    {items.map((item, j) => (
                        <li key={item._key || j}>
                            <Spans children={item.children} />
                        </li>
                    ))}
                </ul>
            );
        } else if (b.style === "h2") {
            out.push(
                <h2 key={b._key || i}>
                    <Spans children={b.children} />
                </h2>
            );
        } else {
            out.push(
                <p key={b._key || i}>
                    <Spans children={b.children} />
                </p>
            );
        }
    }
    return out;
}
