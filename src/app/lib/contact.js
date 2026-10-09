// Every format a phone number is used in, derived from the number itself.
//
// The site uses each number several ways — a tel: link, a display form, a
// wa.me link, the Organization JSON-LD. They used to be typed separately
// (`telephone: "+91-9811141227"` AND `telephoneDisplay: "+91 98111 41227"`),
// which is two chances to disagree. Now the editor types a number once (in
// Sanity → Site settings) and everything below comes from its 10
// digits, so the link can never dial a different number from the one it shows.
//
// Indian numbers only: 10 digits, optionally written with +91 / 91 / 0 in
// front. sanity/schemas/siteSettings.js validates the same rule, so a number
// that reaches this file always parses; a bad one here throws at BUILD time
// rather than shipping a dead link.

function tenDigits(value, label) {
    const digits = String(value || "")
        .replace(/\D/g, "")
        .replace(/^(91|0)(?=\d{10}$)/, "");
    if (!/^[1-9]\d{9}$/.test(digits)) {
        throw new Error(`${label}: "${value}" is not a 10-digit Indian phone number.`);
    }
    return digits;
}

const display = (d) => `+91 ${d.slice(0, 5)} ${d.slice(5)}`;

/**
 * { email, phone, callPhone, whatsappPhone } as typed ->
 *   email
 *   telephone          "+91-9811141227"   tel: href + JSON-LD `telephone`
 *   telephoneDisplay   "+91 98111 41227"
 *   callNumber         "+919599299979"    tel: href of the call button
 *   callNumberDisplay  "+91 95992 99979"
 *   whatsappNumber     "919599299980"     wa.me/<this>
 *   callNumbers        [{ tel, display }]  every number shown for calling
 */
export function toContact({ email, phone, callPhone, whatsappPhone }) {
    const primary = tenDigits(phone, "Contact number");
    const call = tenDigits(callPhone, "Call button number");
    const whatsapp = tenDigits(whatsappPhone, "WhatsApp number");
    // TWO CALL NUMBERS everywhere a number is shown (owner, 2026-10-07): the
    // call button's number first, then the contact number — "+91 95992 99980,
    // +91 98111 41227". One entry if the two are ever set to the same number.
    // The JSON-LD `telephone` stays the single contact number, matching the
    // Google Business Profile.
    const callNumbers = [
        { tel: `+91${call}`, display: display(call) },
        ...(call === primary ? [] : [{ tel: `+91-${primary}`, display: display(primary) }]),
    ];
    return {
        email,
        telephone: `+91-${primary}`,
        telephoneDisplay: display(primary),
        callNumber: `+91${call}`,
        callNumberDisplay: display(call),
        whatsappNumber: `91${whatsapp}`,
        callNumbers,
    };
}
