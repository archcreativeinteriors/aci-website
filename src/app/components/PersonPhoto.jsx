// A founder / team photo, from Sanity or the local fallback (see CmsImage).
// An editor's alt text wins; otherwise "<name>, <designation>" — what the site
// has always used.

import CmsImage from "./CmsImage";

export default function PersonPhoto({ photo, name, designation, sizes, priority }) {
    const alt = photo?.alt || [name, designation].filter(Boolean).join(", ");
    return (
        <CmsImage
            image={photo}
            alt={alt}
            fill
            sizes={sizes}
            loading={priority ? "eager" : undefined}
            style={{ objectFit: "cover" }}
        />
    );
}
