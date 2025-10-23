# RAD Crawler – Packaged Product Monetization Plan

Status: Draft v0.1  
Goal: Single-file installer customers can buy, download, and run locally. Comes with:
- 1–5 crawler instances (license-gated, add-on for more)
- Local AI agent for: search/Q&A, summarization, report generation, and crawler guidance
- Local SQL database by default; optional managed cloud database upgrade
- Hands-off for us (seller): automated licensing, updates, minimal support

---

## 1) Product Concept
A downloadable desktop application that installs a local knowledge system in minutes. It crawls docs/sites/repos, builds a local index, and gives the user an AI agent to query and compile knowledge. Designed for privacy-first offline use, with an optional cloud DB for scale.

- Key Benefits
  - Own your data: runs locally by default
  - No monthly AI fees required (local embeddings + optional local LLM)
  - Fast setup: single installer, guided wizard, no dev skills needed
  - Scales up: enable 2–5+ concurrent crawlers with license upgrades

- Primary Use Cases
  - Teams bundling multiple docs (frameworks/SDKs/vendor docs) into one knowledge base
  - Agencies/consultants building client-specific KBs quickly
  - Engineers wanting supercharged local documentation with AI agent

---

## 2) Packaging & Installer
We will target a true “single installer, low-friction setup” across Windows/macOS/Linux.

- Option A (Fastest to market): Electron + Node services
  - Pros: Quickest, reuse existing TypeScript codebases, rich UI
  - Cons: Larger installer (~100–200 MB), higher RAM footprint
  - Installer: NSIS (Win), DMG/PKG (macOS), AppImage/Deb (Linux)

- Option B (Lean & polished): Tauri (Rust) + background services
  - Pros: Tiny binary, fast startup, great UX, cross-platform
  - Cons: Requires adapting Node-based MCP servers; more engineering upfront
  - Installer: Native per-OS bundlers; code-signing supported

- Recommendation: Start with Option A (Electron) for MVP; plan Tauri migration for v2.

- First-Run Wizard
  - License key activate → choose storage (Local SQLite vs Cloud DB) → connect crawler targets → set budgets → start

---

## 3) Architecture Overview
- Components
  - Crawler workers (1–5+): respect robots.txt, politeness delays, dedup, budgets
  - Indexer/Embedder: local embeddings (CPU) by default; supports GPU if available
  - Database: SQLite (local default), Postgres (cloud upgrade)
  - AI Agent: local-first; can route to a user-provided OpenAI key for higher quality
  - Queue/Orchestrator: local Redis optional, default to in-process queue for desktop

- Data Flow
  1) User adds sources (domains, sitemaps, repos)
  2) Crawlers fetch → dedupe → chunk → embed → store
  3) Agent/GUI provides search, Q&A, topic summaries, compilations, reports

- Privacy Modes
  - Fully offline: no data leaves the machine
  - Hybrid: cloud DB only if user opts in

---

## 4) Licensing, Payments, Updates
- Payments: Stripe (Checkout/Portal)
- License Issuance: Stripe + simple license server (Lemon Squeezy alternative supported)
- Enforcement: license key bound to device hash (with privacy); grace window for offline
- Tiers
  - Starter: 1 crawler, local DB only
  - Pro: 3 crawlers, local DB + optional cloud DB connector
  - Business: 5 crawlers, priority support, scheduled recrawls
  - Add-ons: additional crawler seats; managed cloud DB subscription
- Updates: in-app auto-updater with signed releases; show changelog, rollback on failure

---

## 5) Database Options
- Local (Default)
  - SQLite file; size: practical 1–5 GB on commodity hardware
  - Great for individuals/small teams; zero ops
- Cloud (Upgrade)
  - Managed Postgres (e.g., Neon) provisioned via guided setup
  - Benefits: scale to tens of GBs, multi-device access, team sharing
  - Optional: we can offer managed multi-tenant DB under our account as a service plan

- Storage Strategy
  - Store embeddings + small snippet in DB; archive full text in compressed files
  - Deduplicate (hash + simhash), compact older content, TTL for low-value data

---

## 6) AI Agent (Local-first)
- Capabilities
  - Natural language search and Q&A over the user’s indexed data
  - Summarize, outline, compile docs; export to Markdown/PDF
  - Guide/control crawlers: start/stop, set budgets, add sources, review errors
- Models
  - Local: small model via Ollama if installed (prompt to auto-install), or bundle a small CPU model for embeddings and pattern tasks
  - Cloud Optional: user supplies OpenAI API key for top-tier responses
- Safety
  - Keep all prompts and outputs local unless user opts in to cloud

---

## 7) Performance & Guardrails
- Default crawl rate: 1 page/min per crawler; per-domain concurrency = 1
- Budgets: pages/day per crawler; global DB size guard (pause at 85% of tier)
- Back-pressure: batching inserts, separate embedding worker
- Monitoring: mini dashboard with pages/hour, backlog, errors, DB size, ETA

---

## 8) Monetization Models (no SaaS dependency)
- One-time license + optional maintenance (12 months updates)
- Add-on crawlers: per-seat pricing (e.g., $29 each one-time or $5/mo)
- Cloud DB upgrade: pass-through or managed plan with margin
- “Crawl Package” export: turnkey data bundles sold per job (for agencies)

Example pricing (initial target, adjust after beta):
- Starter $79 (1 crawler, local DB)
- Pro $149 (3 crawlers, cloud connector)
- Business $249 (5 crawlers, scheduler, priority support)
- Add-on crawler seat: $29 (one-time) or $5/mo
- Managed Cloud DB: $15–$49/mo depending on storage tier

---

## 9) Legal, Ops, and Trust
- Respect robots.txt; per-domain rate limits; block on 429/5xx
- User is data controller; we provide tools to export/delete
- Code-signing: Windows, macOS notarization for smooth install
- Crash/metrics: opt-in, anonymized, local logs by default

---

## 10) MVP Scope (6–8 weeks conservative; 3–4 weeks aggressive)
- Desktop app (Electron MVP): sources, crawler control, search/Q&A, exports
- Local DB (SQLite), embeddings, ANN search (pgvector alt for cloud)
- 1–3 concurrent crawlers with budgets and politeness
- License activation, update channel, Stripe purchase flow
- Cloud DB connector wizard (Neon)
- Basic agent flows: “add sources”, “summarize topic”, “compile cheatsheet”

Stretch (post-MVP):
- Scheduler (weekly refresh)
- Team sharing via cloud DB
- Tauri migration for smaller footprint

---

## 11) Risks & Mitigations
- Installer size (Electron): acceptable for MVP; plan Tauri v2
- Local LLM size: don’t bundle huge models; prompt-install Ollama with a small model
- Website TOS: provide tooling to honor robots.txt and user-provided allowlists
- Support load: robust defaults + telemetry + in-app troubleshooting

---

## 12) Next Steps
1. Approve this plan and pricing direction
2. I’ll add a product backlog and wireframes (v0)
3. Implement Electron MVP skeleton + local crawler service
4. Integrate licensing + Stripe test mode
5. Ship private alpha build to you for validation

