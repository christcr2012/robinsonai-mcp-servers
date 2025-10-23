# RAD Crawler – Packaged Product Monetization Plan

Status: Draft v0.2 — refined with installer, licensing, and guardrails
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


### User Journeys (v1)
- Purchase → Download → Install → Activate license → Choose DB → Add sources → Start crawl → Ask first question
- Upgrade: buy 2→5 crawler seats in portal → app auto-detects and unlocks
- Migrate: export from local SQLite → import into cloud Postgres via wizard

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


- OS Support
  - Windows 10/11 x64 (code-signed)
  - macOS 12+ (Monterey) Intel + Apple Silicon (notarized)
  - Linux (Ubuntu 20.04+/Debian 11+, AppImage)

- System Requirements (baseline)
  - CPU with AVX2 recommended; 4+ cores preferred
  - RAM: 8 GB minimum (16 GB ideal for 3–5 crawlers)
  - Disk: 2 GB free for app + models; DB grows with usage
  - Network: not required for local-only mode; needed for crawling

- Installer Behavior
  - Offline-capable installer; downloads optional components on demand (e.g., Ollama)
  - Verifies code signatures; shows publisher and version
  - Elevation only when necessary (install location, firewall open for local UI)
  - Detects and imports previous data on re-install

- Data Directories (default)
  - App binaries: OS-standard install path
  - User data (DB, logs, exports): user home data directory
  - Config: JSON/TOML in user data; easy to back up

- Uninstall
  - Remove application; preserve user data by default
  - Optional "Remove all data" checkbox to purge DB and caches

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
- Payments: Stripe Checkout + Customer Portal (self-serve upgrades/refunds)
- License Lifecycle
  1. Purchase → Stripe webhook issues license key and sends email
  2. Enter key in installer or at first-run wizard
  3. Online validation; offline grace period (e.g., 14 days) with cached renewal
  4. Device binding: key bound to device hash (salted locally)
  5. Transfer: deactivate on old device → activate on new device via portal
- Enforcement & Privacy
  - No raw hardware IDs sent; only salted hash
  - Offline works within grace window; revalidates when online
  - Activation rate limits + abuse detection
- Tiers
  - Starter: 1 crawler, local DB only
  - Pro: 3 crawlers, local DB + cloud DB connector enabled
  - Business: 5 crawlers, scheduler, priority support
- Add-ons
  - Additional crawler seats (per-seat)
  - Managed Cloud DB subscription (storage tiered)
- Updates
  - In-app auto-updater with signed releases; Stable (default) and Beta (opt-in)
  - Rollback on failure; visible changelog

---

## 5) Database Options
- Local (Default: SQLite)
  - Single-file DB; practical 1–5 GB on commodity hardware
  - Zero ops; fast installs and backups
  - Optional encryption at rest (OS-keyed)
- Cloud (Upgrade: Postgres)
  - Neon by default (guided provisioning), or user-supplied Postgres URL
  - Benefits: 10–50+ GB scale, multi-device read/write, team sharing
  - One-click migrate from local (export/import assistant)
- Storage Strategy
  - Keep embeddings + small snippet in DB; full text compressed on disk
  - Deduplicate (hash + simhash); compact old content; TTL for low-value content
  - Partition/index by tenant_id; ANN indexes (pgvector) for cloud mode
- Data Portability
  - Export: JSONL, CSV, and embeddings format
  - Backup/restore tools; migration assistant (SQLite ↔ Postgres)

---

## 6) AI Agent (Local-first)
- Capabilities
  - Natural language search and Q&A over the user’s indexed data
  - Summarize, outline, compile docs; export to Markdown/PDF
  - Guide/control crawlers: start/stop, set budgets, add sources, review errors
  - Generate knowledge packs: curated exports for a topic/client
- Models
  - Local: small model via Ollama if installed (prompt to auto-install), or bundle a small CPU model for embeddings and utility tasks
  - Cloud Optional: user supplies OpenAI API key for top-tier responses
- Agent Control Flows
  - “Add these sources and crawl up to 2k pages, 1 page/min, weekdays 9a–6p.”
  - “Pause crawler #2 until tomorrow; prioritize React docs in crawler #1.”
  - “Export a cheatsheet for Stripe subscriptions with examples.”
- Privacy & Safety
  - All prompts and outputs stay local by default; explicit toggle per feature for cloud usage
  - One-click “Privacy Lockdown”: disable all network except crawling; no telemetry

---

## 7) Performance & Guardrails
- Default crawl rate: 1 page/min per crawler; per-domain concurrency = 1
- Budgets: per-crawler per-day page budgets (e.g., 1k3k5k) and global daily cap
- DB Guard: pause ingestion at 85% of tier; notify; resume after upgrade/cleanup
- Back-pressure: batch inserts; dedicated embedder worker pool; adaptive rate scaling
- Resilience: auto-backoff on 429/5xx, retries with jitter, per-domain cooldowns
- Monitoring: dashboard with pages/hour, backlog, errors, DB size, ETA; exportable logs

---

## 8) Monetization Models (no SaaS dependency)
- Licensing
  - One-time license + 12 months of updates; renewal at 50% list price thereafter
  - Subscription alternative (monthly/annual) for updates + managed features
  - License seats = number of concurrent crawlers enabled
- Add-ons
  - Additional crawler seats (one-time or monthly)
  - Managed Cloud DB (storage/throughput tiers)
  - Prebuilt Knowledge Packs marketplace (paid bundles)
- Services (optional)
  - One-off “Crawl Package” exports (turnkey deliverables)
  - Custom onboarding for teams
- Pricing (initial targets; validate with beta)
  - Starter $79 (1 crawler, local DB)
  - Pro $149 (3 crawlers, cloud connector)
  - Business $249 (5 crawlers, scheduler, priority support)
  - Add-on crawler: $29 one-time or $5/month
  - Managed Cloud DB: $15–$49/month by tier
- Policies
  - 14-day refund policy; license transfer allowed via portal
  - Discounts for students/nonprofits; VAT-aware checkout

---

## 9) Legal, Ops, and Trust
- Compliance
  - Respect robots.txt; per-domain rate limits; back off on 429/5xx
  - Allowlist/denylist controls per domain; crawl responsibly defaults
- Data Ownership
  - User is data controller; one-click export/delete for all content and logs
  - Local-only mode guarantees no external transmission
- Security
  - Code-signing (Win) and notarization (macOS)
  - Optional local DB encryption at rest; keys bound to OS user profile
  - Signed updates; integrity checked before install
- Privacy
  - Telemetry is opt-in; anonymized if enabled; local logs by default
  - "Privacy Lockdown" disables all network egress except crawling
- Legal
  - EULA and privacy policy shipped with installer; shown in first-run wizard
  - Clear notice to honor site terms; DMCA takedown process documented

---

## 10) MVP Scope (6–8 weeks conservative; 3–4 weeks aggressive)
- Desktop app (Electron MVP): sources, crawler control, search/Q&A, exports
- Local DB (SQLite), embeddings, ANN search (pgvector alt for cloud)
- 1–3 concurrent crawlers with budgets and politeness
- License activation, update channel, Stripe purchase flow
- Cloud DB connector wizard (Neon)
- Basic agent flows: “add sources”, “summarize topic”, “compile cheatsheet”

### Acceptance Criteria (MVP)
- Installer completes and launches in < 5 minutes on baseline hardware
- License activation succeeds online; offline grace works when disconnecting
- First crawl of 200 pages completes with no errors; dedupe rate displayed
- Search answers common queries in < 1 second with relevant passages
- DB guard triggers near capacity and pauses cleanly; resume works after upgrade
- Privacy Lockdown disables all external calls except crawling

### KPIs & Metrics
- Activation rate (install → first run → license activated)
- Time-to-first-answer (install → first successful Q&A)
- 7-day retention (opened the app again within a week)
- Crash-free sessions (%), update success rate (%), support tickets/week

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

