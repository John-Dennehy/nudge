# 0005: Personal-First Core Loop (Based on Desk Research)

**Status:** Accepted (24 November 2026)  
**Inputs:** [Nudge market desk research (Nov 2026)](../research/market-2026-11.md), [interview-plan.md (On Hold)](../research/interview-plan.md)

## Context

Desk research in November 2026 showed:

1. **Task splitting is commoditised.** Goblin Tools already breaks tasks into steps for free on web (and cheaply on mobile), and general AI chat does the same.
2. **The plausible gap is less output, not more features.** Neurodivergent users repeatedly report setup burden, maintenance fatigue, paywall frustration, and a "graveyard of productivity apps". A calm interface that accepts a messy brain dump and shows **one genuinely doable next step** — with no timers, streaks, or system upkeep — is the real UX bet.
3. **Willingness to pay is unproven**, and real-world user research is parked for the foreseeable future.
4. **Brain dumps can include sensitive health information**, meaning UK GDPR special-category rules, minimal retention, export/delete controls, and no model training on user dumps matter if Nudge ever opens to other users.

## Decisions

### 1. Build for John first; keep the paid door open
- Treat Nudge as **John's own daily tool first**, not a commercial launch.
- Do not build accounts, billing, marketing pages, or paywalls yet.
- Keep architecture and data boundaries clean so a fair paid version later (e.g. useful permanent free tier + modest ~£3/month or ~£25 one-off, no lapse penalties) remains easy to add without a rewrite.

### 2. Narrow the UI to one calm core loop
Every screen and interaction should serve one loop:
> **Brain dump → one small next step → "Done" or "Make it smaller"**

In practice, compared to the current dashboard:
- **Show one clear next step at a time** instead of competing lists (nudges list, pending clarifications list, banners). Secondary items stay tucked away until needed.
- **Make "Done" frictionless.** Clicking "Done" should immediately register quiet progress and smoothly surface the next step (or let the user stop). Reflection (ADR 0001) becomes optional rather than a mandatory modal after every step.
- **Make "Make it smaller" actually shrink the step.** Replace the hardcoded generic 3-option fallback with real step-shrinking (AI-assisted with a sensible offline fallback) that keeps the user focused on the smaller step rather than dropping it back to a list.
- **Keep timers, streaks, and guilt out** (consistent with existing plain-English and zero-shame principles).

### 3. Defer non-core roadmap items
Until the core loop earns real daily use for John, defer:
- Balatro card spring polish & swipe deck ([ADR 0004](0004-balatro-style-clarification-deck.md), issue #14)
- Adaptive scoring / ML learning engine ([ADR 0002](0002-adaptive-curated-nudges.md), issue #15)
- Dedicated Quiet Progress Hub route (issue #16)
- External REST / CLI / voice API (issue #17)
- Unused AI endpoints (`generateSmartCriteria`, `prioritiseTasks`) — prune or keep out of the active path until needed.

### 4. Local-first, low-cost, privacy-ready by default
- **Zero-setup local persistence first**, behind the existing `TaskRepository` interface so server-backed SQLite sync (issue #12) can be swapped in cleanly if John wants phone + desktop access.
- **Data control built in early:** plain JSON export and one-click local clear/delete, aligning with future UK GDPR readiness.
- **Cheap, resilient AI:** keep prompts tiny and run on a low-cost small model (e.g. Gemini Flash-Lite) with a clean offline heuristic fallback so Nudge never breaks when offline and stays pennies per user per month at scale. Never enable model training on user dumps.

## Consequences

- **Positive:** Fast path to a tool John can actually use when frozen; avoids over-engineering unvalidated features; preserves privacy and low running costs.
- **Trade-off:** We are building on desk-research hypotheses rather than live user interviews, so commercial viability remains untested until John decides to revisit [interview-plan.md](../research/interview-plan.md).
- **Reversibility:** High. Deferred features and ADR 0001–0004 remain documented in the repo and can be revived once the core loop is solid.
