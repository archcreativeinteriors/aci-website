import React from 'react'
import Link from 'next/link'
import { BsArrowRight } from 'react-icons/bs'
import CmsImage from '../components/CmsImage'
// Sanity `blogPost` documents (newest first) — lib/content.
import { getBlogs } from '../lib/content'

export const metadata = {
    title: "Interior Design Blog",
    description:
        "Interior design tips, trends and ideas for salons, spas, restaurants and homes from the Arch Creative Interiors design team.",
    alternates: { canonical: "/blogs" },
    openGraph: {
        title: "Interior Design Blog | Arch Creative Interiors",
        description:
            "Design tips, trends and ideas for salon, commercial and residential interiors.",
        url: "/blogs",
        images: ["/og-image-landscape.jpg"],
    },
};

const Blogs = async () => {
    const blogs = await getBlogs()
    return (
        <main id="main-content" tabIndex={-1} className="blogs-page">
            <header className="blogs-header">
                <span>Insights</span>
                <h1>Interior Design Blog</h1>
                <p>Tips, trends and ideas for salon, commercial and residential interiors.</p>
            </header>

            <div className="blogs-grid">
                {blogs.map((blog) => (
                    <article className="blog-card" key={blog.id}>

                        <div className="blog-image">
                            <CmsImage
                                image={blog.image}
                                alt={blog.image?.alt || blog.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 600px"
                                style={{ objectFit: "cover" }}
                            />
                        </div>

                        <div className="blog-content">

                            <span className="blog-category">
                                {blog.category}
                            </span>

                            <h2>{blog.title}</h2>
                            <p className="blog-byline">
                                {blog.date}
                                {blog.author ? ` • By ${blog.author}` : ""}
                            </p>
                            <p>{blog.excerpt}</p>

                            <Link href={`/blogs/${blog.id}`} className="blog-btn">
                                Read Article <BsArrowRight size={25} style={{ paddingLeft: "7px" }} />
                            </Link>

                        </div>

                    </article>
                ))}
            </div>
        </main>
    )
}

export default Blogs