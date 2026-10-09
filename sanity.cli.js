// Sanity CLI configuration — what `sanity dev` / `sanity build` / `sanity deploy`
// read. Separate from sanity.config.js, which configures the Studio itself.
//
// The project id resolves the same way as in sanity.config.js; see the note
// there. `sanity deploy` also asks once for a studio hostname and writes it to
// sanity.io, not to this file.

import { defineCliConfig } from "sanity/cli";

const projectId =
    process.env.SANITY_STUDIO_PROJECT_ID ||
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
    "";

const dataset =
    process.env.SANITY_STUDIO_DATASET ||
    process.env.NEXT_PUBLIC_SANITY_DATASET ||
    "production";

export default defineCliConfig({
    api: { projectId, dataset },
});
