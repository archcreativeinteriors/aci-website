"use client";

// Vercel Analytics, behind the same consent as the map.
//
// Two things worth knowing before changing this:
//
// 1. IT IS CURRENTLY DEAD WEIGHT. The site is deployed to a self-managed
//    Ubuntu VPS behind nginx, not to Vercel (CLAUDE.md "Deployment"), and
//    @vercel/analytics beacons to /_vercel/insights/* — a path only Vercel's
//    edge serves. On the VPS those POSTs 404. So gating it costs no real
//    measurement today; it stops a script loading and a request firing.
// 2. Vercel's analytics is cookieless and Vercel argues it needs no consent.
//    It is gated anyway, so the privacy policy can make ONE simple claim —
//    "nothing third-party loads until you agree" — instead of a claim with an
//    exception in it. If the planned Vercel migration happens and the owner
//    wants the numbers back unconditionally, move <Analytics /> back into
//    layout.js and correct the policy in the same commit.

import { Analytics } from "@vercel/analytics/next";
import { useEffect, useState } from "react";
import { hasFullConsent, subscribeConsent } from "../lib/consent";

export default function ConsentedAnalytics() {
    const [ok, setOk] = useState(false);

    useEffect(() => {
        setOk(hasFullConsent());
        return subscribeConsent(() => setOk(hasFullConsent()));
    }, []);

    return ok ? <Analytics /> : null;
}
