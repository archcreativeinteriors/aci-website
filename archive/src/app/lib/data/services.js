import salonImg from "../../../../public/images/services/salon-services.jpg";
import residentialImg from "../../../../public/images/services/residential-services.jpg";
import commercialImg from "../../../../public/images/services/commercial-services.jpg";

// Single source of truth for all service content. Consumed by:
//   - services/page.js         (the /services cards → `services`)
//   - services/[slug]/page.js  (detail pages + generateStaticParams/Metadata → `services`)
//   - sitemap.js                (service URLs → `services`)
//
// `icon` is a key mapped to a lucide-react component in each consumer (data
// modules stay free of JSX). `tagline` is the one-liner on the /services cards;
// `label` is the short 2–3 word tag on the detail-page hero + <title>.
export const services = [
  {
    slug: "salon",
    icon: "scissors",
    title: "Salon Interiors",
    tagline: "Luxury salon spaces with premium aesthetics",
    label: "Luxury Beauty Spaces",
    image: salonImg,
    description:
      "We design premium salon interiors with a strong focus on customer experience, lighting, luxury aesthetics, and functionality. Every salon is crafted to elevate your brand identity.",
    features: [
      "Salon Layout Planning",
      "Luxury Styling Stations",
      "Ambient & Task Lighting",
      "Premium Waiting Lounge",
      "Spa & Treatment Rooms",
      "Custom Furniture & Decor",
    ],
    process: [
      "Concept Discussion",
      "Space Zoning",
      "Luxury Material Selection",
      "3D Design Approval",
      "Turnkey Execution",
    ],
  },
  {
    slug: "residential",
    icon: "home",
    title: "Residential Interiors",
    tagline: "Elegant homes crafted around your lifestyle",
    label: "Luxury Living Spaces",
    image: residentialImg,
    description:
      "We create elegant residential interiors designed around your lifestyle, comfort, and personality. From premium apartments to luxury villas, every detail is crafted with precision and sophistication.",
    features: [
      "Living Room Design",
      "Luxury Bedroom Interiors",
      "Modular Kitchen",
      "False Ceiling & Lighting",
      "Furniture & Decor",
      "Turnkey Execution",
    ],
    process: [
      "Consultation & Space Planning",
      "2D Layout & Moodboards",
      "3D Visualization",
      "Material Selection",
      "Execution & Supervision",
    ],
  },
  {
    slug: "commercial",
    icon: "building",
    title: "Commercial Interiors",
    tagline: "Professional spaces built for productivity",
    label: "Modern Business Environments",
    image: commercialImg,
    description:
      "Professional commercial interiors that improve productivity, branding, and customer experience. We design offices, retail stores, studios, and modern workspaces with a premium approach.",
    features: [
      "Office Interiors",
      "Reception Design",
      "Workspace Planning",
      "Retail Stores",
      "Lighting Solutions",
      "Brand Integration",
    ],
    process: [
      "Requirement Analysis",
      "Space Optimization",
      "Brand Concept Design",
      "Execution Planning",
      "Final Installation",
    ],
  },
];

