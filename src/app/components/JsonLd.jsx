// Renders a JSON-LD structured-data block. `<` is escaped per the Next.js
// JSON-LD guide to avoid XSS via injected content.
export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
