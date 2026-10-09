import ScrollReveal from "./ScrollReveal";

// Kept as a distinct name for existing imports; same resilient behaviour.
export default function ServiceReveal({ children }) {
    return <ScrollReveal>{children}</ScrollReveal>;
}
