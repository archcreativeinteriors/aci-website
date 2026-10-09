import Link from "next/link";

// Visible breadcrumb trail. Pass the same `items` ([{ name, path }]) used to
// build breadcrumbJsonLd() so the visible trail and the schema never diverge.
// The last item is the current page — rendered as plain text, not a link.
export default function Breadcrumbs({ items }) {
    return (
        <nav className="breadcrumbs" aria-label="Breadcrumb">
            <ol>
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    return (
                        <li key={item.path}>
                            {isLast ? (
                                <span aria-current="page">{item.name}</span>
                            ) : (
                                <Link href={item.path}>{item.name}</Link>
                            )}
                            {!isLast && <span aria-hidden="true"> / </span>}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
