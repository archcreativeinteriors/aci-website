// Brief §4 Home item 6 — founder portrait left, the studio and the founder's
// own words right.
//
// The founder block (name · designation · bio paragraphs · the quote) is the
// same content the /about Founder section carries, and that repetition is
// deliberate here in a way the /studio duplication was not: Home previews what
// lives in full on /about and links straight to it. Two competing PAGES was the
// problem (Phase 22); a homepage section pointing at its own detail page is not.
// Both read the one Founder document (getFounder(), lib/content/people.js),
// so there is nothing to keep in step by hand.
//
// The "We started in Delhi building one salon at a time…" lede that used to open
// this block MOVED TO /about, where the studio's origin story belongs. Sitting
// above the founder it split the column in two — a paragraph, a rule, then a
// second paragraph block — and read as two unrelated things stacked.
// One subject per section: this one is the founder.

import Link from "next/link";
import PersonPhoto from "../PersonPhoto";
import SectionHead from "../SectionHead";
import { getFounder } from "../../lib/content";

export default async function StudioBlock() {
    const founder = await getFounder();

    return (
        <section className="sec" data-tone="tint">
            <div className="wrapx">
                <div className="studio">
                    {/* The reference demo has no photo here — its slot reads
                        "Founder portrait to be shot". Filled with the founder
                        portrait, the same image /about uses. */}
                    <div className="studioImg">
                        <PersonPhoto
                            photo={founder.photo}
                            name={founder.name}
                            designation={founder.designation}
                            sizes="(max-width: 1080px) 100vw, 360px"
                        />
                    </div>
                    <div>
                        <SectionHead eyebrow="Who we are" tight>
                            The studio
                        </SectionHead>
                        {/* The sd* classes are the /about Founder block's, defined in
                            styles/studio-page.css. Reused rather than re-declared so the
                            same person is set the same way on both pages. */}
                        <div className="sdName">{founder.name}</div>
                        <div className="sdRole">{founder.designation}</div>

                        {founder.bio.map((para) => (
                            <p className="sdPara" key={para}>
                                {para}
                            </p>
                        ))}

                        {founder.quote && (
                            <blockquote className="sdQuote">
                                <span className="sdQuoteMark">In his words</span>
                                {`“${founder.quote}”`}
                            </blockquote>
                        )}

                        <p className="covLink">
                            <Link className="link" href="/about">
                                More about the studio
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
