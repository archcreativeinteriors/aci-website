"use client";

import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import Link from "next/link";

// The options of the Project type select — the same three the API accepts
// (api/contact/route.js).
const PROJECT_TYPES = ["Residential", "Commercial", "Salon"];

export default function Contact() {

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        projectType: "",
        message: "",
        // Honeypot. Hidden from sighted users and skipped by keyboard nav, so
        // a human never fills it; the API silently drops anything that does.
        company: "",
        // Must be ticked before the form will send. Not sent to the API and not
        // stored — it is an on-screen affirmation, so the visitor agrees to the
        // terms by an act rather than by a line of small print under a button
        // they have already pressed.
        consent: false,
    });

    // /services sends "Customise your …" here as /contact?type=salon (or
    // residential / commercial) — preselect that Project type. Read after
    // mount, so the server render and the first client render stay identical
    // (the page is static) and an unknown value is simply ignored.
    useEffect(() => {
        const wanted = new URLSearchParams(window.location.search).get("type");
        const match = PROJECT_TYPES.find((t) => t.toLowerCase() === (wanted || "").toLowerCase());
        if (match) setForm((f) => (f.projectType ? f : { ...f, projectType: match }));
    }, []);

    const handleChange = (e) => {
        // A checkbox reports its state on .checked; .value is the literal "on"
        // and would make the box permanently truthy.
        const { name, type, value, checked } = e.target;
        setForm({
            ...form,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.name.trim()) {
            toast.error("Please enter your name");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(form.email)) {
            toast.error("Please enter a valid email");
            return;
        }

        const phoneRegex = /^[0-9]{10}$/;

        if (!phoneRegex.test(form.phone)) {
            toast.error("Phone number must be 10 digits");
            return;
        }

        if (!form.projectType) {
            toast.error("Please select project type");
            return;
        }

        // Checked last, so the visitor is not asked to agree to anything before
        // the form they are agreeing about is even valid.
        if (!form.consent) {
            toast.error("Please accept the Privacy Policy and Terms to continue");
            return;
        }

        const toastId = toast.loading("Sending request...");

        try {

            const res = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (data.success) {

                toast.update(toastId, {
                    render: "Thank you — we'll be in touch shortly.",
                    type: "success",
                    isLoading: false,
                    autoClose: 3000,
                });

                setForm({
                    name: "",
                    email: "",
                    phone: "",
                    projectType: "",
                    message: "",
                    company: "",
                    consent: false,
                });

            } else {

                toast.update(toastId, {
                    // The API only ever returns its own vetted strings here
                    // (no raw upstream error is echoed), so surfacing it tells the
                    // visitor what to fix instead of a generic failure.
                    render: data.error || "Failed to send request",
                    type: "error",
                    isLoading: false,
                    autoClose: 3000,
                });
            }

        } catch (error) {

            toast.update(toastId, {
                render: "Something went wrong",
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
        }
    };

    return (
        <section className="contact" id="contact-form">

            <div className="contact-box">

                <span>Get Free Consultation</span>

                <h2>Start Your Interior Journey</h2>

                <p>
                    Tell us about your space and we’ll get back with the best design ideas.
                </p>

                <form className="contact-form" onSubmit={handleSubmit}>

                    {/* Real <label>s (visually hidden, kept for screen readers,
                        assistive tech and form-filling agents) — placeholder text
                        alone isn't a reliable accessible name and disappears once
                        the field has a value. */}
                    <label htmlFor="contact-name" className="sr-only">Your Name</label>
                    <input
                        id="contact-name"
                        type="text"
                        placeholder="Your Name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        autoComplete="name"
                    />

                    <label htmlFor="contact-email" className="sr-only">Email Address</label>
                    <input
                        id="contact-email"
                        type="email"
                        placeholder="Email Address"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        autoComplete="email"
                    />

                    <label htmlFor="contact-phone" className="sr-only">Phone Number</label>
                    <input
                        id="contact-phone"
                        type="tel"
                        placeholder="Phone Number"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        maxLength={10}
                        autoComplete="tel"
                    />

                    <div className="select-wrapper">
                        <label htmlFor="contact-project-type" className="sr-only">Project Type</label>
                        <select
                            id="contact-project-type"
                            name="projectType"
                            value={form.projectType}
                            onChange={handleChange}
                        >
                            <option value="">Select Project Type</option>
                            <option>Residential</option>
                            <option>Commercial</option>
                            <option>Salon</option>
                        </select>
                    </div>

                    <label htmlFor="contact-message" className="sr-only">
                        About your space
                    </label>
                    <textarea
                        id="contact-message"
                        name="message"
                        rows={4}
                        maxLength={2000}
                        placeholder="Tell us about the space — floor plan, opening date, city (optional)"
                        value={form.message}
                        onChange={handleChange}
                    />

                    {/* Honeypot. Not a real field: hidden from sighted users,
                        skipped by keyboard navigation and ignored by password
                        managers, so only a bot filling every input will touch
                        it. The API drops those submissions silently. Kept out
                        of the tab order deliberately — a visually hidden field
                        that can still be focused traps keyboard users. */}
                    <div className="sr-only" aria-hidden="true">
                        <label htmlFor="contact-company">Company</label>
                        <input
                            id="contact-company"
                            type="text"
                            name="company"
                            value={form.company}
                            onChange={handleChange}
                            tabIndex={-1}
                            autoComplete="off"
                        />
                    </div>

                    {/* ABOVE the button, not below it. The same words used to sit
                        under the submit as a passive "by submitting, you agree" —
                        which asks for agreement after the decision has been made
                        and gives the visitor nothing to act on. A ticked box is a
                        deliberate act, and it is in the tab order immediately
                        before the button it gates.
                        No "sr-only" label here: the text beside the box IS the
                        label, so it is wrapped in one. */}
                    <label className="form-consent-check" htmlFor="contact-consent">
                        <input
                            id="contact-consent"
                            type="checkbox"
                            name="consent"
                            checked={form.consent}
                            onChange={handleChange}
                        />
                        <span>
                            I agree to the{" "}
                            <Link href="/privacy-policy">Privacy Policy</Link> and{" "}
                            <Link href="/terms">Terms &amp; Conditions</Link>, and consent to
                            being contacted about my enquiry.
                        </span>
                    </label>

                    <button type="submit">
                        Get Free Consultation
                    </button>

                </form>

            </div>

        </section>
    );
}