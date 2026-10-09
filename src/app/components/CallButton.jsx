import { IoCall } from "react-icons/io5";
import { getSiteSettings } from "../lib/content";

export default async function CallButton() {
    const { contact } = await getSiteSettings();
    return (
        <a
            href={`tel:${contact.callNumber}`}
            className="call-btn"
            aria-label="Call us"
        >
            <IoCall />
        </a>
    );
}
