# Robinson Starter Pack (Non‑coder Edition)

This pack contains the orchestrator and ready-to-run plans to get your 6‑server toolkit reliable and bring up a multi‑crawler → Postgres pipeline.

## A) Requirements
- Node.js 20+ and Git
- Local checkout of your repo
- Optional: GitHub CLI (`gh`)
- Optional: Postgres + `DATABASE_URL`

## B) Install
1. Unzip this pack into the **root of your repo**.
2. Open `.robinson/config.json` and set:
   - `repo`: "your-org/your-repo"
   - `baseBranch` if not `main`
   - Adjust `build`/`test` if you don't use npm
3. Commit and push the added files (except inbox/outbox per .gitignore).

## C) Run orchestrator
```bash
node tools/robinson-orchestrator.mjs
```what 
Leave it running; it watches `.robinson/inbox/`.

## D) Sanity test
- The sample plan is already in the inbox: `.robinson/inbox/sample.plan.json`.
- Watch it create/update `sandbox/hello.txt`, then push a branch and open a PR.

## E) Next
- Move `plans/toolkit_broker_min.json` into `.robinson/inbox/` to stabilize your 6‑server toolkit.
- When ready for crawling:
  - Ensure `DATABASE_URL` is set and reachable.
  - Run VS Code task “Radcrawler: DB init” (or `psql "$DATABASE_URL" -f db/radcrawler.sql`).
  - Move `plans/radcrawler_mvp.json` into `.robinson/inbox/`.
  - Start API: `cd apps/radcrawler && node server.mjs`
  - Start 1–N workers: `cd apps/radcrawler && node worker.mjs`

## What generates code?
You (or an AI) provide **PlanSpec JSON** with exact file contents. The orchestrator writes files, audits placeholders, runs build/tests, and opens a PR.
