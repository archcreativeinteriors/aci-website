import { FaWhatsapp } from "react-icons/fa";
import { getSiteSettings } from "../lib/content";

export default async function WhatsAppButton() {
    const { contact } = await getSiteSettings();
    return (
        <a
            href={`https://wa.me/${contact.whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-btn"
            aria-label="Chat with us on WhatsApp"
        >
            <FaWhatsapp />
        </a>
    )
}
