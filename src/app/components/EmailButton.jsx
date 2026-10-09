import { IoMail } from "react-icons/io5";
import { getSiteSettings } from "../lib/content";

export default async function EmailButton() {
    const { contact } = await getSiteSettings();
    return (
        <a
            href={`mailto:${contact.email}`}
            className="email-btn"
            aria-label="Email us"
        >
            <IoMail />
        </a>
    );
}
