// Brief §4 Home item 2 / §3.4 — six project cards, "See our work" beneath.
// Cards link to the detail page; a row with no photograph shows the
// --surface-soft "Photograph to be shot" tile, never a broken image or a stock
// photo (§1 notes).
//
// Content comes from getSelectedProjects() (lib/content/projects.js): the Sanity
// `homeSelectedProjects` singleton — references to project documents. Every
// card it returns has a page (Status "published"), so every link resolves.

import Link from "next/link";
import CmsImage from "../CmsImage";
import SectionHead from "../SectionHead";
import { getSelectedProjects } from "../../lib/content";

export default async function SelectedProjects() {
    const section = await getSelectedProjects();

    return (
        <section className="sec" data-tone="tint">
            <div className="wrapx">
                {/* The description read "{picks.length} of
                    {PROJECT_STATS.projects}." until 2026-09-17, when the owner
                    removed the project total site-wide. Qualitative now, by
                    their choice — do not put a figure back here, derived or
                    otherwise. */}
                <SectionHead
                    eyebrow={section.eyebrow || undefined}
                    description={section.description || undefined}
                >
                    {section.heading}
                </SectionHead>

                <div className="grid">
                    {section.projects.map((item) => (
                        <Link
                            className="card"
                            key={item.slug}
                            href={`/projects/${item.slug}`}
                        >
                            <span className="frame">
                                {item.image ? (
                                    <CmsImage
                                        image={item.image}
                                        alt={item.name}
                                        fill
                                        sizes="(max-width: 680px) 100vw, (max-width: 1080px) 50vw, 33vw"
                                        style={{ objectFit: "cover" }}
                                    />
                                ) : (
                                    <span className="phTile">Photograph to be shot</span>
                                )}
                                <span className="veil">
                                    {item.format} · {item.sector}
                                </span>
                            </span>
                            <span className="cap">{item.name}</span>
                            <span className="capSub">{item.location}</span>
                        </Link>
                    ))}
                </div>

                <p className="secFoot">
                    <Link className="link" href="/projects">
                        See our work
                    </Link>
                </p>
            </div>
        </section>
    );
}
