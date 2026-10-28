<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# For every coding agent (Claude, Codex, Cursor, Copilot, …)

Before doing anything in this repository, read, in this order:

1. **`CLAUDE.md`** — stack, commands, layout and the **standing rules**. They apply to every
   agent, not only Claude.
2. **`docs/HANDOFF.md`** — where the work stands now, the owner's open decisions, and the safe
   order for the next steps.

The rules that matter most (details in `CLAUDE.md`):

- **Ask the owner before** any commit, push, merge, deploy, or write to Sanity.
- **Never delete a file.** Move anything unwanted to `archive/` at the same path.
- **Never read out, copy or edit `.env.local`.** Name its variables only, never their values.
- **Never push the old local branches** (or run `git push --all`); only `new-main` → `main`.
- **Never stop the dev server on port 3000**; test production builds on port 3100.
- **Keep the 17 old-URL redirects** in `next.config.mjs`.
