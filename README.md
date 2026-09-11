# Nudge 🧠

> **An executive function and decision-support second brain designed for people with AuDHD to overcome task paralysis, transform raw brain dumps into actionable atomic goals, and surface curated next steps based on current energy and emotional state.**

---

## The Problem

Traditional task managers and productivity frameworks (Jira, Linear, Todoist, GTD) fail people with ADHD, autism, and executive dysfunction because they impose high upfront administrative overhead:
1. **The Blank Form Trap**: Forcing users to specify categories, deadlines, priority dropdowns, and sub-tasks before an idea can even be captured triggers immediate executive shutdown.
2. **Cognitive Overload & Paralysis**: Staring at a list of 40 tasks induces overwhelm and shame spirals.
3. **Rigid Dogma ("Eat the Frog")**: Insisting users tackle their hardest, most dreaded task first thing causes chronic avoidance when executive dopamine is depleted.
4. **Time Blindness & Rejection Sensitivity**: Missing a deadline feels like moral failure, and struggling individuals frequently feel they have "done nothing today," blinded to their quiet, incremental progress.

---

## Core Principles & Design Philosophy

Nudge fundamentally inverts the relationship between the user and the tool:

### 1. You Dump, Nudge Deconstructs
The user's sole responsibility during capture is an unstructured **Brain Dump** (via text or voice). Nudge bears the cognitive burden of parsing, evaluating, and structuring thoughts into manageable pieces.

### 2. Atomic SMART Goals
A goal is **not considered ready if it can be reasonably split further** (down to atomic ~2–15 minute steps). If a task is too big (e.g. *"Do my taxes"*), Nudge automatically slices it into physical starter steps. Parent-to-child relationships are tracked behind the scenes, shielding the user from tree overwhelm.

### 3. Balatro-Style Clarification Deck
When an idea is ambiguous or too large, Nudge asks strictly **one question at a time**. Options are presented as a tactile "hand" of cards (inspired by the game *Balatro*) that can be cycled and selected across any modality:
* **Keyboard**: Arrow keys (`←` / `→` or `h` / `l`), numbers (`1`, `2`, `3`), and `Enter` / `Space` to select.
* **Mouse**: Hover elevation and click.
* **Touch**: Tap and swipe on mobile/tablet.
* **Write-In**: Clean fallback input immediately beneath the cards.

### 4. Adaptive Curated Nudges (Not Rigid Limits)
Rather than an overwhelming backlog or an arbitrary 3-task limit, Nudge surfaces a small, intelligent selection of context-aware options:
* ☕ **Quick Win (Momentum)**: A sub-atomic physical action with near-zero activation barrier to break inertia.
* 🛡️ **Clear the Dread ("Eat the Frog")**: Tackles lingering anxiety when emotional bandwidth permits.
* ⚡ **Best Return (Leverage)**: Highest ratio of impact to required effort.
* ⏰ **Needs Attention Soon (Urgent Slice)**: Deconstructs urgent deadlines into an immediate 5-minute starter step so the user is never frozen by magnitude.

### 5. Continuous Two-Way Reflection (Timerless & Shame-Free)
Execution is **completely free of countdown timers, alarms, or judgment**. When a task concludes, Nudge prompts constructive reflection:
* **On Success**: Checks whether you pushed outside your comfort zone or stayed comfortably safe, guarding against stagnation.
* **On Failure**: Normalizes failure as iterative data. Asks *"Was this a reasonable goal?"* and *"Did you feel overwhelmed?"*, then creates a calibrated replacement goal with a fresh target.

### 6. Quiet Progress
Gentle, visible counters highlight non-obvious wins (*thoughts untangled*, *atomic steps finished*, *lessons recorded*, *comfort zones stretched*) to combat ADHD time-blindness and the demoralizing feeling of having achieved nothing.

### 7. Strict Plain English Policy (Zero Jargon)
Under the hood, Nudge utilizes formal state machines, SMART criteria evaluation, DAG dependency trees, and LLM scoring. **However, zero engineering or productivity jargon is ever presented to the user.** Copy is always warm, human, conversational, and direct.

---

## Domain Model & Architecture

For full architectural records and domain glossaries:
* **Domain Vocabulary**: [`CONTEXT.md`](./CONTEXT.md)
* **ADR 0001**: [`Continuous Reflection Across Both Failure and Success`](./docs/adr/0001-reclaiming-failure-as-learning.md)
* **ADR 0002**: [`Adaptive Curated Nudges (Beyond Rigid Limits)`](./docs/adr/0002-adaptive-curated-nudges.md)
* **ADR 0003**: [`Automated SMART Formulation and Progressive Clarification Cards`](./docs/adr/0003-automated-smart-formulation.md)
* **ADR 0004**: [`Balatro-Style Multi-Modal Clarification Deck`](./docs/adr/0004-balatro-style-clarification-deck.md)

---

## Technical Stack

* **Framework**: [TanStack Start](https://tanstack.com/start) (Full-stack React 19 + SSR + Nitro Server Functions)
* **Routing**: [TanStack Router](https://tanstack.com/router) (Type-safe file-based routing)
* **Server State**: [TanStack Query v5](https://tanstack.com/query)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + Shadcn/Radix primitives
* **Code Quality & Linting**: [Biome](https://biomejs.dev/)
* **Test Suite**: [Vitest](https://vitest.dev/)
* **AI Engine**: Gemini Flash-Lite / Google Generative AI over HTTPS server functions with deterministic heuristics fallback.

---

## Development Setup

### Prerequisites
* [Node.js](https://nodejs.org/) v20+
* [pnpm](https://pnpm.io/) v9+

### Install Dependencies
```bash
pnpm install
```

### Environment Configuration
Create a `.env` file in the project root:
```env
GEMINI_API_KEY="your-gemini-api-key"
```
*(Note: Nudge includes a heuristic offline engine, so core features function even without an API key).*

### Running Locally
```bash
pnpm dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Quality Checks & Testing
```bash
# Run unit and integration tests
pnpm test

# Format and lint code with Biome
pnpm check

# Build production client and server bundles
pnpm build
```

---

## Project Structure

```
nudge/
├── docs/
│   └── adr/                  # Architectural Decision Records
├── src/
│   ├── components/           # Shared UI primitives (Buttons, Cards, Dialogs)
│   ├── core/
│   │   └── types/            # Canonical domain types & state machines
│   ├── features/
│   │   └── tasks/
│   │       ├── api/          # Server functions (AI deconstructor, repositories)
│   │       ├── components/   # Feature UI (ClarificationDeck, AgreedTaskHero, etc.)
│   │       ├── hooks/        # React Query hooks (useTasks, useQuietProgress)
│   │       └── utils/        # Pure domain logic (nudges curation, transitions)
│   └── routes/               # TanStack Router routes (__root, index, dashboard)
├── CONTEXT.md                # Ubiquitous domain language & anti-jargon guidelines
└── README.md
```

---

## Contributing & Multi-Agent Development

Nudge is designed to be developed modularly using **tracer-bullet vertical slices**. All feature work is tracked via GitHub Issues declaring explicit blocking dependencies. Check the [Engineering Roadmap](./docs/ROADMAP.md) or the issue tracker for tickets tagged [`ready-for-agent`](https://github.com/John-Dennehy/nudge/labels/ready-for-agent).

