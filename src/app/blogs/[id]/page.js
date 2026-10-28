import { notFound } from "next/navigation";
import Link from "next/link";
// Sanity `blogPost` documents — lib/content.
import { getBlogs, getBlog } from "../../lib/content";
import CmsImage from "../../components/CmsImage";
import JsonLd from "../../components/JsonLd";
import Breadcrumbs from "../../components/Breadcrumbs";
import { articleJsonLd, breadcrumbJsonLd } from "../../lib/jsonld";

// Title shown in the end-of-post CTA per service slug. The link goes to that
// service's section on /services (the detail pages were folded in, 2026-10-27).
const SERVICE_TITLES = {
  salon: "Salon Interiors",
  residential: "Residential Interiors",
  commercial: "Commercial Interiors",
};

export async function generateStaticParams() {
  return (await getBlogs()).map((blog) => ({
    id: blog.id,
  }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const blog = await getBlog(id);

  if (!blog) {
    return { title: "Article Not Found" };
  }

  // metaDescription is a short (~150 char) version tuned for the SERP snippet;
  // excerpt (longer, used on-page) is the fallback for posts that don't set one.
  const description = blog.metaDescription || blog.excerpt;

  return {
    title: blog.title,
    description,
    alternates: { canonical: `/blogs/${blog.id}` },
    openGraph: {
      title: blog.title,
      description,
      url: `/blogs/${blog.id}`,
      type: "article",
      images: [blog.image.url],
    },
  };
}

export default async function BlogPage({ params }) {
  const { id } = await params;

  const blog = await getBlog(id);

  if (!blog) {
    notFound();
  }

  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blogs" },
    { name: blog.title, path: `/blogs/${blog.id}` },
  ];

  return (
    <main id="main-content" tabIndex={-1} className="blog-details">
      <Breadcrumbs items={breadcrumbItems} />
      <JsonLd data={articleJsonLd(blog)} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <div className="container">
        <CmsImage
          image={blog.image}
          alt={blog.image?.alt || blog.title}
          className="blog-image"
          loading="eager"
          sizes="(max-width: 900px) 100vw, 900px"
        />

        <div className="blog-meta">
          <span>{blog.category}</span>
          <span> • </span>
          <span>{blog.date}</span>
          {blog.author && (
            <>
              <span> • </span>
              <span>{`By ${blog.author}`}</span>
            </>
          )}
        </div>

        <h1>{blog.title}</h1>

        <p>{blog.excerpt}</p>

        <div className="blog-content">
  {blog.content.map((section, index) => (
    <section key={index}>
      <h2>{section.heading}</h2>

      {section.paragraphs.map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </section>
  ))}
</div>

        {blog.relatedService && (
          <div className="blog-cta">
            <h3>{`Ready to start your ${blog.category.replace(" Design", "").toLowerCase()} project?`}</h3>
            <p>Talk to our design team and get a free consultation.</p>
            <div className="blog-cta-actions">
              <Link href={`/services#${blog.relatedService}`} className="blog-cta-btn">
                {`Explore ${SERVICE_TITLES[blog.relatedService] || "Our Services"}`}
              </Link>
              <Link href="/contact" className="blog-cta-btn blog-cta-btn-outline">
                Get Free Consultation
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}