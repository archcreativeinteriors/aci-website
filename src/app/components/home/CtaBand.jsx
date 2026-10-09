// Brief §3.9 — dark band, inset from the viewport so it floats rather than spans.
//
// Two columns: the ask on the left, the direct channels on the right.
//
// It used to end with a single dim line repeating the street address and phone
// — which sat a few pixels above the footer's Studio column saying the same
// thing, so the page closed with the same address twice. The address now lives
// once, in the footer, next to the map. What belongs *here* is the part a
// visitor acts on immediately: how to reach a human, and when.
//
// Never hardcoded: the hours, the email and the three phone numbers all come
// from Site settings (getSiteSettings).

import Link from "next/link";
import { Phone, MessageCircle, Mail, Clock } from "lucide-react";
import { Eyebrow } from "../SectionHead";
import { SITE_NAME } from "../../lib/site";
import { getSiteSettings } from "../../lib/content";

export default async function CtaBand() {
    const { contact, business } = await getSiteSettings();
    // "Mon–Sat" from the canonical hours array (Site settings), same as the
    // footer, so the two can never disagree with each other or with the
    // Organization JSON-LD.
    const { openingHours } = business;
    const dayRange = `${openingHours.days[0].slice(0, 3)}–${openingHours.days[
        openingHours.days.length - 1
    ].slice(0, 3)}`;
    return (
        <section className="ctaBand">
            <div className="wrapx">
                <div className="ctaBand-grid">
                    <div>
                        <Eyebrow>Get in touch</Eyebrow>
                        <h2>Tell us about the space.</h2>
                        <p>
                            Send the floor plan and your opening date. We&apos;ll come back
                            with a programme and a number.
                        </p>
                        <div className="ctaBand-actions">
                            <Link href="/contact" className="bGlow">
                                Start an enquiry
                            </Link>
                            {/* The WhatsApp number is its own real channel, separate
                                from the primary line — owner-confirmed (Site
                                settings → WhatsApp number). */}
                            <a
                                className="bGhost"
                                href={`https://wa.me/${contact.whatsappNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                WhatsApp us
                            </a>
                        </div>
                    </div>

                    <div className="ctaBand-card">
                        <h3 className="ctaBand-cardHead">Or reach us directly</h3>
                        <ul className="ctaBand-channels">
                            <li>
                                <Phone size={16} aria-hidden="true" />
                                <span>
                                    <a href={`tel:${contact.telephone}`}>
                                        {contact.telephoneDisplay}
                                    </a>
                                    <small>Studio line</small>
                                </span>
                            </li>
                            <li>
                                <MessageCircle size={16} aria-hidden="true" />
                                <span>
                                    <a href={`tel:${contact.callNumber}`}>
                                        {contact.callNumberDisplay}
                                    </a>
                                    <small>New enquiries</small>
                                </span>
                            </li>
                            <li>
                                <Mail size={16} aria-hidden="true" />
                                <span>
                                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                                    <small>Drawings and floor plans</small>
                                </span>
                            </li>
                            <li>
                                <Clock size={16} aria-hidden="true" />
                                <span>
                                    {dayRange} · {openingHours.opens}–{openingHours.closes}
                                    <small>Studio hours</small>
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                <span className="sr-only">{SITE_NAME}</span>
            </div>
        </section>
    );
}
