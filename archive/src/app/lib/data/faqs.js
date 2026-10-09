// FAQs — the LOCAL source. Read only through getFaqs() in lib/contentSource.js,
// which prefers the Sanity `faq` documents once a project is connected and falls
// back to this list until then. Rendered on /about as <details> AND emitted
// there as FAQPage JSON-LD from the same list, so the two cannot drift.
export const faqs = [
  {
    q: "How long does an interior design project take?",
    a: "Project timelines vary depending on size and complexity. On average, residential projects take 4–8 weeks, while larger commercial spaces may take longer.",
  },
  {
    q: "Do you offer free consultation?",
    a: "Yes, we offer a free initial consultation to understand your requirements, space, and vision before starting the project.",
  },
  {
    q: "What is your design process?",
    a: "We follow a structured process including consultation, concept design, planning, execution, and final handover to ensure quality and satisfaction.",
  },
  {
    q: "Do you handle both residential and commercial projects?",
    a: "Absolutely. We specialize in residential, commercial, and salon interiors with tailored design solutions.",
  },
  {
    q: "Can I customize the design as per my needs?",
    a: "Yes, all our designs are fully customized based on your lifestyle, preferences, and budget.",
  },
];
