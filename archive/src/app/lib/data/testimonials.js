// Client testimonials — the LOCAL source. Read only through getTestimonials()
// in lib/contentSource.js, which prefers the Sanity `testimonial` documents once
// a project is connected and falls back to this list until then. The home page
// shows (and marks up) the first three.
//
// `rating` (1-5) drives the stars on the home testimonial cards. It is the
// OWNER'S assertion about each client, not a review any client submitted
// through this site — there is no review mechanism here. That is exactly why
// lib/jsonld.js reviewJsonLd() still emits NO `reviewRating`: self-declared
// ratings on your own site are ineligible for review rich results and marking
// them up invites a manual action. The stars are presentation; the schema stays
// honest. Drop the field from a row and its stars disappear.
export const testimonials = [
    {
        name: "Amit Kakkar",
        role: "Owner, Tweak Salon",
        text: "Arch Creative Interiors delivered exactly the premium salon environment we envisioned. Their space planning, lighting design, and execution quality helped us create a luxury customer experience from day one.",
        rating: 5,
    },

    {
        name: "Neha Arora",
        role: "Director, Geetanjali Salon Dehradun",
        text: "The team understood our brand standards perfectly and translated them into a modern, elegant salon design. Clients frequently compliment the interiors and overall ambience.",
        rating: 5,
    },

    {
        name: "Rahul Mehta",
        role: "Partner, Punjabi By Nature Gurugram",
        text: "From concept development to final execution, everything was handled professionally. The restaurant now has a distinctive identity that enhances the dining experience for our guests.",
        rating: 5,
    },

    {
        name: "Isha Sharma",
        role: "Founder, Isha Salon",
        text: "What impressed us most was the attention to detail. Every workstation, mirror, lighting fixture, and material was thoughtfully planned to maximize both functionality and aesthetics.",
        rating: 5,
    },

    {
        name: "Rakesh Bhatia",
        role: "Owner, Peluqueria Salon Lucknow",
        text: "The final outcome exceeded our expectations. The interiors feel luxurious, welcoming, and highly practical for daily salon operations. It has positively impacted customer perception of our brand.",
        rating: 5,
    },

    {
        name: "Sonia Kapoor",
        role: "Franchise Partner, Geetanjali Salon Saket",
        text: "Arch Creative Interiors maintained excellent communication throughout the project. Their design expertise and execution capabilities helped us launch a premium salon that stands out in a competitive market.",
        rating: 5,
    },

    {
        name: "Vikas Arora",
        role: "Owner, Bellissima Unisex Salon",
        text: "The team created a sophisticated and contemporary salon environment while staying aligned with our business goals. The space feels premium and has become a major attraction for new customers.",
        rating: 5,
    },

    {
        name: "Manpreet Singh",
        role: "Director, Geetanjali Salon Ludhiana",
        text: "Their ability to combine luxury aesthetics with operational efficiency is remarkable. The finished salon reflects the quality and professionalism we wanted our clients to experience.",
        rating: 5,
    },
];