# 8. Personal-first scope and cross-device storage

Status: scope accepted; storage privacy plan proposed (waiting on John's choice)
Inputs: [Nudge market desk research (Nov 2026)](../research/market-2026-11.md), [interview-plan.md (On Hold)](../research/interview-plan.md), [ADR 5 (Event journal)](0005-event-journal.md), [ADR 6 (Private spaces)](0006-private-spaces-without-accounts.md)

## Context

1. **Desk research (Nov 2026)** showed task splitting is already commoditised (Goblin Tools is free on web and low-cost on mobile). The plausible gap is a calmer, less-output loop — one doable next step with no timers, streaks, or guilt — but willingness to pay is unproven and real-world interviews are parked (`interview-plan.md`).
2. **Cross-device use is required.** John ruled out browser-only storage: Nudge must work reliably across his devices (desktop and phone).
3. **Brain dumps are sensitive data.** Unstructured dumps and reflections can reveal mental-health and personal information. UK GDPR special-category principles (data minimisation, strong encryption, export/delete controls, and no AI model training) are good hygiene even for a solo tool and keep the door open if Nudge is ever shared.
4. **Current baseline on `main`.** The rebuild (ADR 5–7) already stores an append-only event journal in Neon Postgres (`@neondatabase/serverless` + Drizzle) with optimistic local caching and optional Gemini untangling. Two privacy gaps remain before daily personal use: `events.event` stores raw `dumped.text` (up to 4,000 chars) and reflection notes in plaintext JSONB, and open anonymous cookie spaces (ADR 6) have unthrottled pairing codes and no JSON export yet.

## Decision

### 1. Build for John first; keep the paid door open (accepted)

- Treat Nudge as **John's own daily tool first**, not a commercial launch. Do not build public accounts, billing, marketing pages, or paywalls yet.
- Keep non-core extras deferred — external REST/CLI API (#17), streaming AI (#13), voice input, and reminders — until daily use shows what is actually needed.
- Keep data boundaries clean so a fair paid version later (permanent useful free tier plus ~£3/month or ~£25 one-off, no lapse penalties) remains possible without a rewrite.

### 2. Recommended cross-device storage: Neon Postgres (London `eu-west-2`) + privacy hardening (proposed — planning only)

Keep the **Neon Postgres** event journal already built on `main` (ADR 5), hosted in **AWS London (`eu-west-2`)**, and plan a small privacy-hardening pass before daily use:
- **Why:** John already uses Neon, the Drizzle schema and optimistic local-cache sync are already built and tested on `main`, Neon offers UK data residency (`eu-west-2`), AES-256 encryption at rest, TLS 1.2+ in transit, and GDPR DPA / SOC 2 Type II compliance, with standard Postgres portability and zero vendor lock-in.
- **Monthly cost (solo):**
  - **Neon Free tier:** **$0/month** (1 GB storage, 100 CU-hours/month, automatic scale-to-zero after 5 minutes idle; a personal 20,000-event journal uses roughly 10–20 MB and a few CU-hours/month). If Free limits are ever exceeded, Neon Launch is usage-based with no base fee ($0.106/CU-hour, $0.35/GB-month — roughly $1–$3/month for solo use).
  - **Hosting (Vercel Hobby, personal use):** **$0/month**.
  - **AI untangling (optional):** **$0/month** using the built-in offline rules, or roughly **$0.05–$0.35/month** for solo use if enabled on a paid, non-training Gemini Flash-Lite API tier.
- **Sensitive-data controls (planning only — no code built in this ADR):**
  1. **UK data residency:** Provision the Neon project in AWS London (`eu-west-2`).
  2. **Client-side end-to-end encryption (E2EE) of event payloads:** Encrypt each event payload in the browser (Web Crypto AES-256-GCM) with a personal key kept in John's password manager / passkey (and shared when linking a device), so Neon and Vercel only hold opaque ciphertext. _(Trade-off: the server enforces `(owner_id, seq)` ordering and batch limits while the browser runs `apply()` validation — fine for a solo tool.)_
  3. **Minimise raw dump retention:** Discard raw `dumped.text` once untangled into structured goals (or make raw retention opt-in/auto-pruned) instead of keeping full raw brain dumps forever.
  4. **Lock down solo access and add export:** Gate the deployment with real single-user authentication (updating ADR 6's open anonymous spaces) and add plain JSON export alongside "Delete everything".
  5. **Keep AI opt-in and non-training:** Offline rules remain the default; only turn on `GEMINI_API_KEY` on a paid non-training API tier, keeping the existing UI notice next to the brain dump box.

### 3. Alternative considered: Jazz (`jazz.tools`) sync-first CRDT mesh

- **What it offers:** Local-first sync (`cojson` CRDTs backed by IndexedDB + WebAssembly) with zero-knowledge end-to-end encryption built in by default and multi-device passkey/passphrase sync.
- **Monthly cost:** **$0/month** on Jazz Cloud Starter (10 GB storage, 100 MAU, 0.2 GB sync egress/month) or **$0/month** self-hosted (for example on John's own machine over Tailscale).
- **Why not recommended:** Would require replacing the already-built, tested Neon Postgres + Drizzle event journal on `main`, introduces a niche sync SDK/data format with higher lock-in than standard Postgres, and offers less straightforward SQL/JSON inspection and backup.

_(Other options checked and ruled out: Supabase Free and PowerSync Free pause after 7 days of inactivity and jump to $25/month and $49/month respectively; InstantDB's hosted cloud is winding down.)_

## Consequences

- **Positive:** Multi-device sync runs at **$0/month** on tools John already knows and code already on `main`, while explicitly closing the plaintext brain-dump and open-space privacy gaps before daily personal use.
- **Open trade-off for John:** Client-side E2EE gives true zero-knowledge protection against a database or host breach, but requires saving a recovery key (e.g. in a password manager) and moves event-replay validation to the client. Relying on Neon's standard encryption at rest + dropping raw dump text + single-user login avoids key management and keeps server-side `apply()` checks intact, at the cost of trusting Neon/Vercel not to read stored goal titles and reflections.
- **Reversibility:** High. This record is planning only and changes no application code or schema.
