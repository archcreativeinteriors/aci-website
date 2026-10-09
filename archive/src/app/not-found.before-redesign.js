import Link from "next/link";

export const metadata = {
  title: "Page Not Found",
  description:
    "This page could not be found. Browse our salon, commercial and residential interior design work, or get in touch with the studio.",
};

export default function NotFound() {
  return (
    <main id="main-content" tabIndex={-1} className="not-found">
      <div className="not-found-inner">
        <p className="not-found-code">404</p>
        <h1>This page could not be found</h1>
        <p className="not-found-text">
          The page you are looking for may have been moved or no longer exists.
        </p>

        <div className="not-found-links">
          <Link href="/">Home</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/services">Services</Link>
          <Link href="/blogs">Blog</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </div>
    </main>
  );
}
