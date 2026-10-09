// /projects/[id] — the reference demo's detail layout: photograph left, spec
// panel right, then the written sections.
//
// It used to open with a full-bleed hero carrying the title in an overlay. The
// demo's version is better here for a reason specific to this portfolio: at
// 192 near-identical salon interiors the *facts* are what separate one project
// from the next — brand, location, format, sector — so they belong beside the
// photograph, not below a screen-height image.
//
// ALL FROM SANITY (lib/content), joined on the slug:
//   getProjectPage     page title, location, photographs + written copy
//   getProject         brand / city / state / format / sector — the same record
//                      the index uses, so the spec panel matches the index and
//                      the derived counts exactly rather than restating them.
// A project has this page when its Status field is "published". The four text
// sections come from Sanity, written once per project by `npm run
// projects:content`; an empty field gets a last-resort line from
// lib/content/projects.js (fallbackCopy), so a section is never blank.
//
// THE THUMBNAIL STRIP (`.pdStrip`) shows THIS project and nothing else: every
// image in its Sanity gallery, four to a row. Spec §26's "Photograph to be
// shot" placeholders appear only when the gallery is EMPTY — a project with
// one to three photos shows those, not a row padded with placeholders.
//
// It briefly fell back to four *other* projects when a record had no gallery,
// captioned and linked so they read as related work. That was wrong and the
// owner caught it: on Geetanjali Studio Ajmer the strip showed Worldmark,
// Dehradun, Lucknow and Pacific Mall — four different cities sitting directly
// under this project's photograph, where they read as more views of this space
// no matter what the caption said. Spec §26 is explicit: "Do not use random
// project images as substitutes unless explicitly approved."
//
// Photos are added in the Studio (Project -> Gallery / Before images); a
// rebuild publishes them. None are kept in the repo.
//
// EVERY PHOTOGRAPH OPENS FULL SIZE (owner, 2026-09-28): each one is a link to
// its full-size version, and components/PhotoLightbox.jsx shows it in a
// full-screen viewer with previous / next. See ZoomFrame below.
//
// The written sections (overview / challenge / solution / features) are the
// demo's one omission — it was drawn when the assumption was that almost
// nothing had copy. Most pages have it, and it is the only long-form text on
// the site about the actual work. Kept, restyled into the new tokens.

import Link from "next/link";
import { Check, Expand } from "lucide-react";
import { notFound } from "next/navigation";

import {
    getProject,
    getProjectPage,
    getProjectPageIds,
    getStats,
    brandSlug,
    brandHref,
    stateSlug,
    BRAND_COLLECTION_MIN,
    shareImageUrl,
    zoomPhoto,
} from "../../lib/content/index.js";
import CmsImage from "../../components/CmsImage.jsx";
import PhotoLightbox from "../../components/PhotoLightbox.jsx";
import ScrollReveal from "../../components/ScrollReveal.jsx";
import JsonLd from "../../components/JsonLd.jsx";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import { breadcrumbJsonLd, creativeWorkJsonLd } from "../../lib/jsonld.js";

// One photograph, as a link to its full-size version. `data-zoom` is its place
// in the viewer's list (components/PhotoLightbox.jsx), which opens it in place;
// with no JS the link simply opens the full photo. A photo with no URL keeps
// the plain frame.
function ZoomFrame({ photo, index, className, children }) {
    if (!photo) return <span className={className}>{children}</span>;
    return (
        <a
            className={`${className} pdZoom`}
            href={photo.src}
            data-zoom={index}
            aria-label={`${photo.alt} (view full size)`}
        >
            {children}
            <span className="pdZoomIcon" aria-hidden="true">
                <Expand size={18} />
            </span>
        </a>
    );
}

export async function generateStaticParams() {
    return (await getProjectPageIds()).map((id) => ({ id }));
}

// The share / JSON-LD image. Crawlers need an absolute URL they can fetch, so
// the Sanity photo gets a sized CDN URL (as on /about).
const shareImage = (image) => shareImageUrl(image, "/og-image-landscape.jpg");

export async function generateMetadata({ params }) {
    const { id } = await params;
    const project = await getProjectPage(id);

    if (!project) {
        return { title: "Project Not Found" };
    }

    const [record, pageIds] = await Promise.all([getProject(id), getProjectPageIds()]);
    const name = projectName(project) + (await repeatSuffix(project, pageIds));
    const description = metaDescription(project, record, name);

    return {
        title: name,
        description,
        alternates: { canonical: `/projects/${project.id}` },
        openGraph: {
            title: `${name} | ${project.category}`,
            description,
            url: `/projects/${project.id}`,
            images: [shareImage(project.image)],
        },
    };
}

// EVERY PAGE ITS OWN TITLE AND DESCRIPTION (owner, 2026-10-05). Two problems
// with using the Overview as the description: about 150 pages have none, so
// they all fell back to the site-wide sentence in layout.js, and the same
// Overview is pasted on up to nine pages. So the description now starts with
// this project's own facts (name, place, format), which no other page shares,
// and adds the Overview's first sentence only when the whole still fits a
// search snippet (~160 characters).
const META_MAX = 160;

// Format → the noun in "a salon interior". Anything unlisted uses the sector.
const FORMAT_NOUN = {
    Salon: "salon",
    "Nail studio": "nail studio",
    Spa: "spa",
    Studio: "studio",
    Academy: "academy",
    Restaurant: "restaurant",
    Retail: "retail",
    Estate: "residential",
};

// The other spelling a location may use for a canonical city, so
// "Sector 66 Gurugram" does not become "Sector 66 Gurugram, Gurgaon".
const CITY_ALIASES = { Gurgaon: ["Gurugram"], "New Delhi": ["Delhi"] };

const mentions = (text, part) => text.toLowerCase().includes(part.toLowerCase());

// "Name, Location" — the Location left out when the name already includes it
// ("Punjabi Restaurant Gurugram", not "…Gurugram, Gurugram").
const projectName = (project) =>
    !project.location || mentions(project.title, project.location) ? project.title : `${project.title}, ${project.location}`;

// False for an alt that only names a file or the project: a leading number
// ("1.Geetanjali Salon", "3 Esskay Beauty…"), a camera/file name, or text the
// page title already starts with ("Wildbloom Salon" on Wildbloom Salon, X).
const usefulAlt = (alt, title) => {
    const a = typeof alt === "string" ? alt.trim() : "";
    if (!a) return false;
    if (/^\d+\s*[.)_-]?\s/.test(a) || /^\d+\./.test(a)) return false;
    if (/\.(jpe?g|png|webp|heic)$/i.test(a) || /^(img|dsc|image|photo|whatsapp)[\s_-]*\d/i.test(a)) return false;
    return !title.toLowerCase().startsWith(a.toLowerCase());
};

function metaDescription(project, record, name) {
    let place = name;
    const city = record?.cityName;
    if (city && ![city, ...(CITY_ALIASES[city] || [])].some((c) => mentions(place, c))) place += `, ${city}`;
    if (record?.state && !mentions(place, record.state)) place += `, ${record.state}`;

    const noun = FORMAT_NOUN[record?.subCategory] || (record?.sector || "interior design").toLowerCase();
    const article = /^[aeiou]/i.test(noun) ? "an" : "a";
    const lead = `${place}: ${article} ${noun} interior designed and delivered by Arch Creative Interiors.`;

    const sentence = project.desc.match(/^.*?[.!?](?=\s|$)/)?.[0] || project.desc;
    return sentence && `${lead} ${sentence}`.length <= META_MAX ? `${lead} ${sentence}` : lead;
}

// Three brands have two pages at the same address (e.g. Geetanjali Salon,
// Elante Mall Chandigarh and …-chandigarh-2) with the same name and location
// in Sanity, so their titles were identical. The second page carries the same
// number as its URL, "(2)", until the owner gives it a Page title in the
// Studio that says what sets it apart — then the suffix stops by itself.
async function repeatSuffix(project, pageIds) {
    const m = project.id.match(/^(.+)-(\d+)$/);
    if (!m || !pageIds.includes(m[1])) return "";
    const first = await getProjectPage(m[1]);
    return first && first.title === project.title && first.location === project.location ? ` (${m[2]})` : "";
}

export default async function ProjectDetail({ params }) {
    const { id } = await params;
    const project = await getProjectPage(id);

    if (!project) {
        notFound();
    }

    // The index record for the same slug. Present for every linkable row, but
    // guarded: a detail page can exist before the roster row is reconciled, and
    // a missing join must degrade to fewer spec rows, never to a crash.
    const [record, stats] = await Promise.all([getProject(id), getStats()]);
    const brand = record?.brand || project.client;
    const slug = brand ? brandSlug(brand) : null;
    const brandEntry = slug
        ? stats.brandsByCount().find((b) => brandSlug(b.brand) === slug)
        : null;

    // Both brand links used to build `/projects/brand/${slug}` by hand, guarded
    // only on the slug existing (eyebrow) and on `count > 1` ("See all N").
    // Phase 21 raised the collection-page threshold from 1 to 3 and updated
    // brandHref(), sitemap.js and BrandWall — but not these two, so 10 detail
    // pages linked to brand pages that generateStaticParams never builds.
    // Route through the helper that already owns the rule.
    const brandTarget = brandEntry ? brandHref(brandEntry) : null;
    // brandHref() sends a 1-2 project brand to its own project page, which on
    // THIS page is a link to itself. Plain text instead.
    const brandIsSelfLink = brandTarget === `/projects/${id}`;
    // "See all N <brand> projects" needs N >= 2. At N = 1 the only project IS
    // this page, so the line would be wrong copy AND a link to itself. That is
    // independent of the collection threshold, which is now 1 — do not collapse
    // these two back into one comparison.
    const hasCollection =
        !!brandEntry && brandEntry.count >= Math.max(2, BRAND_COLLECTION_MIN);
    // NO "Completed" ROW (owner, 2026-09-17). It read "To be confirmed" on all
    // 34 pages, because every record's year is the placeholder "2025" and §13
    // lists year_completed as outstanding — printing 2025 would assert a date
    // the business has not given us. The owner's earlier call was to keep the
    // placeholder wording (runbook Phase 3, item 2); this reverses it, so the
    // panel now simply omits the field rather than announcing a gap.
    //
    // On 2026-09-24 the field itself was removed (owner) — `year` from
    // data/projects.js and `yearCompleted` from the Sanity schema, along with
    // `area` / `areaSqft` and `durationWeeks`.

    const specs = [
        ["Brand", brand],
        ["Location", record?.city || project.location],
        ["City", record?.cityName],
        // The state links to its collection page (every state has one — see
        // sitemap.js); before, only the home page linked to those pages.
        // Styled as the plain value until hovered.
        ["State", record?.state, record?.state && `/projects/state/${stateSlug(record.state)}`],
        ["Format", record?.subCategory],
        ["Sector", record?.sector],
        // No Area and no Completed row — both fields were removed from the
        // data and the schema; see the note above.
    ].filter(([, value]) => Boolean(value));

    // ── the tiles under the hero: THIS project's further views, or — only when
    // it has none — the "awaiting photography" state. See the §26 note at the top.
    const STRIP_COUNT = 4;
    const shots = project.gallery;
    const empties = shots.length ? 0 : STRIP_COUNT;
    const title = project.title;

    // Every photograph on the page, in page order, for the full-size viewer:
    // the main photo, then the gallery, then the before photos.
    // projectName(): the location only when the title does not already say it
    // ("…Vasant Vihar, New Delhi, New Delhi" was the result before).
    const heroAlt = projectName(project);
    // A stored alt is used only when it describes something. 901 of the 1,082
    // gallery alts came in from file names — "1.Fab U Salon", "2.Fab U Salon" —
    // and a few are the bare brand repeated on every photo; those read as noise
    // to a screen reader (and in the viewer's caption), so they get the same
    // generated "<project> — view N" as a photo with no alt at all.
    const galleryAlt = (img, i) => (usefulAlt(img.alt, title) ? img.alt : `${heroAlt} — view ${i + 2}`);
    const beforeAlt = (img, i) => (usefulAlt(img.alt, title) ? img.alt : `${heroAlt} — before, view ${i + 1}`);
    const heroPhotos = project.image ? [zoomPhoto(project.image, heroAlt)] : [];
    const galleryPhotos = shots.map((img, i) => zoomPhoto(img, galleryAlt(img, i)));
    const beforePhotos = project.beforeImages.map((img, i) => zoomPhoto(img, beforeAlt(img, i)));
    const galleryStart = heroPhotos.length;
    const beforeStart = galleryStart + galleryPhotos.length;
    const photos = [...heroPhotos, ...galleryPhotos, ...beforePhotos];

    const breadcrumbItems = [
        { name: "Home", path: "/" },
        { name: "Projects", path: "/projects" },
        { name: title, path: `/projects/${project.id}` },
    ];

    return (
        <main id="main-content" tabIndex={-1} className="pdPage">
            <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
            <JsonLd
                data={creativeWorkJsonLd({
                    ...project,
                    image: { src: shareImage(project.image) },
                })}
            />

            <div className="wrapx">
                <Breadcrumbs items={breadcrumbItems} />
            </div>

            <div className="wrapx pd">
                <div>
                    <div className="pdHero">
                        {project.image ? (
                            <ZoomFrame photo={heroPhotos[0]} index={0} className="pdHeroLink">
                                <CmsImage
                                    image={project.image}
                                    alt={heroAlt}
                                    fill
                                    loading="eager"
                                    sizes="(max-width: 1000px) 100vw, 62vw"
                                    style={{ objectFit: "cover" }}
                                />
                            </ZoomFrame>
                        ) : (
                            // §26: no main photo yet is a designed state.
                            <span className="pcardEmpty">Photograph to be shot</span>
                        )}
                    </div>

                    {/* Every tile below is THIS project: its gallery, or §26's
                        placeholders when it has no gallery at all.
                        The label is a <p>, not an <h2>: this column precedes
                        the <aside> holding the <h1>, so a heading here would
                        start the document outline at level 2 before the page's
                        own title. The list carries the name via aria-label. */}
                    <p className="pdStripHead">
                        {shots.length ? "More views" : "Further photography"}
                    </p>
                    <ul
                        className="pdStrip"
                        aria-label={`Further views of ${title}`}
                    >
                        {shots.map((img, i) => (
                            <li key={img.url || i}>
                                <ZoomFrame
                                    photo={galleryPhotos[i]}
                                    index={galleryStart + i}
                                    className="pdShot"
                                >
                                    <CmsImage
                                        image={img}
                                        alt={galleryAlt(img, i)}
                                        fill
                                        sizes="(max-width: 680px) 45vw, 15vw"
                                        style={{ objectFit: "cover" }}
                                    />
                                </ZoomFrame>
                            </li>
                        ))}
                        {Array.from({ length: empties }, (_, i) => (
                            <li key={`empty-${i}`}>
                                <span className="pdShot pdShot--empty">
                                    <span className="pcardEmpty">
                                        Photograph to be shot
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>

                    {/* Before photos, only when the Studio has some. */}
                    {project.beforeImages.length > 0 && (
                        <>
                            <p className="pdStripHead">Before</p>
                            <ul
                                className="pdStrip"
                                aria-label={`${title} before the fit-out`}
                            >
                                {project.beforeImages.map((img, i) => (
                                    <li key={img.url || i}>
                                        <ZoomFrame
                                            photo={beforePhotos[i]}
                                            index={beforeStart + i}
                                            className="pdShot"
                                        >
                                            <CmsImage
                                                image={img}
                                                alt={beforeAlt(img, i)}
                                                fill
                                                sizes="(max-width: 680px) 45vw, 15vw"
                                                style={{ objectFit: "cover" }}
                                            />
                                        </ZoomFrame>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>

                <aside className="pdAside">
                    {brand &&
                        (brandTarget && !brandIsSelfLink ? (
                            <Link className="pdBrand" href={brandTarget}>
                                {brand}
                            </Link>
                        ) : (
                            <span className="pdBrand">{brand}</span>
                        ))}

                    <h1 className="pdTitle">{title}</h1>

                    <dl className="spec">
                        {specs.map(([label, value, href]) => (
                            <div key={label}>
                                <dt>{label}</dt>
                                <dd>{href ? <Link className="specLink" href={href}>{value}</Link> : value}</dd>
                            </div>
                        ))}
                    </dl>

                    {/* Shown only when a collection page actually exists — "See
                        all X projects" pointing at a single project page is
                        wrong copy as well as a wrong link. No count in the text
                        (owner, 2026-10-01); the count still decides whether the
                        line appears. */}
                    {hasCollection && (
                        <p className="pdMore">
                            <Link className="link" href={brandTarget}>
                                See all {brand} projects
                            </Link>
                        </p>
                    )}
                </aside>
            </div>

            {photos.some(Boolean) && <PhotoLightbox photos={photos} />}

            {/* wrapx for the page gutter, .pdBody INSIDE it for the measure.
                Combining the two on one element made .pdBody's max-width apply
                to the wrapx box, whose `margin: 0 auto` then centred the whole
                text column — it floated in the middle of the page instead of
                lining up with the photograph above it. */}
            <div className="wrapx">
                <div className="pdBody">
                    {/* Each section only when the Studio has text for it. */}
                    {project.desc && (
                        <ScrollReveal>
                            <section className="pdSection">
                                <h2>Project overview</h2>
                                <p>{project.desc}</p>
                            </section>
                        </ScrollReveal>
                    )}

                    {project.challenge && (
                        <ScrollReveal>
                            <section className="pdSection">
                                <h2>Design challenge</h2>
                                <p>{project.challenge}</p>
                            </section>
                        </ScrollReveal>
                    )}

                    {project.solution && (
                        <ScrollReveal>
                            <section className="pdSection">
                                <h2>Our solution</h2>
                                <p>{project.solution}</p>
                            </section>
                        </ScrollReveal>
                    )}

                    {project.features.length > 0 && (
                        <section className="pdSection">
                            <h2>Key features</h2>
                            <ul className="pdFeatures">
                                {project.features.map((item) => (
                                    <li key={item}>
                                        <Check size={16} aria-hidden="true" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <p className="pdBack">
                        <Link className="link" href="/projects">
                            All projects
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
