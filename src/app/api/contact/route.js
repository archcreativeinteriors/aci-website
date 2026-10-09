import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Sender must be a verified domain in Resend for real deliverability.
// onboarding@resend.dev is Resend's shared test address — fine for staging only.
// Set CONTACT_FROM to a Resend-verified domain sender for real deliverability.
// The fallback carries an explicit display name so the "From" never inherits
// the Resend account owner's personal name.
const FROM = process.env.CONTACT_FROM || "Arch Creative Interiors <onboarding@resend.dev>";
const TO = process.env.CONTACT_TO || "info.archcreativeinteriors@gmail.com";

const PROJECT_TYPES = ["Residential", "Commercial", "Salon"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MESSAGE_MAX = 2000;

// ── Rate limiting ──────────────────────────────────────────────────────────
// In-memory and per-process. That is the correct shape for THIS deployment and
// only this one: the VPS runs a single long-lived `next start` process, so one
// Map is shared by every request it serves.
//
// Two caveats that must travel with the code:
//   · It resets on deploy/restart. Acceptable — the failure mode is a wider
//     window, not a blocked visitor.
//   · On Vercel this route becomes a serverless function and the Map degrades
//     to per-instance, which is close to no limit at all. If that migration
//     happens, move this to a shared store (Upstash/Redis) or drop it and rely
//     on the platform's own protection. Do not assume it still works.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map();

function clientIp(req) {
  // nginx sets X-Forwarded-For and overwrites it for direct traffic, so the
  // left-most entry is the real client. Falls back to a single bucket rather
  // than failing open per-request.
  const fwd = req.headers.get("x-forwarded-for");
  const first = fwd ? fwd.split(",")[0].trim() : "";
  return first || req.headers.get("x-real-ip") || "unknown";
}

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);

  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent);
    return true;
  }

  recent.push(now);
  hits.set(ip, recent);

  // Opportunistic sweep. This process stays up for weeks at a time, so without
  // it the Map grows for every IP that ever posts.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (!times.some((t) => now - t < RATE_WINDOW_MS)) hits.delete(key);
    }
  }

  return false;
}

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);

function validate(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const projectType =
    typeof body.projectType === "string" ? body.projectType.trim() : "";
  // Optional by design. Requiring it would cut submissions from people who
  // want a call back but will not write a paragraph.
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (name.length < 2 || name.length > 100) return { error: "Invalid name" };
  if (!EMAIL_RE.test(email) || email.length > 200)
    return { error: "Invalid email address" };
  if (!/^[0-9]{10}$/.test(phone)) return { error: "Phone must be 10 digits" };
  if (!PROJECT_TYPES.includes(projectType))
    return { error: "Invalid project type" };
  if (message.length > MESSAGE_MAX)
    return { error: `Message must be under ${MESSAGE_MAX} characters` };

  return { data: { name, email, phone, projectType, message } };
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  if (rateLimited(clientIp(req))) {
    return Response.json(
      { success: false, error: "Too many requests, please try again later" },
      { status: 429 }
    );
  }

  // Honeypot. `company` is hidden from sighted users and skipped by keyboard
  // navigation, so a human never fills it — anything in it is a bot filling
  // every field it finds. Report success and send nothing: telling a bot it
  // was caught just teaches it to skip the field next time.
  if (typeof body?.company === "string" && body.company.trim() !== "") {
    return Response.json({ success: true });
  }

  const { error, data } = validate(body ?? {});
  if (error) {
    return Response.json({ success: false, error }, { status: 400 });
  }

  try {
    const sent = await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: data.email,
      subject: "New Interior Consultation Request",
      text: [
        "New Consultation Request",
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        `Phone: ${data.phone}`,
        `Project Type: ${data.projectType}`,
        ...(data.message ? ["", "Message:", data.message] : []),
      ].join("\n"),
      html: `
        <h2>New Consultation Request</h2>
        <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>
        <p><strong>Project Type:</strong> ${escapeHtml(data.projectType)}</p>
        ${
          data.message
            ? `<p><strong>Message:</strong><br>${escapeHtml(data.message).replace(
                /\n/g,
                "<br>"
              )}</p>`
            : ""
        }
      `,
    });

    if (sent.error) {
      console.error("Resend error:", sent.error);
      return Response.json(
        { success: false, error: "Could not send message" },
        { status: 502 }
      );
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("Contact route error:", err);
    return Response.json(
      { success: false, error: "Could not send message" },
      { status: 500 }
    );
  }
}
