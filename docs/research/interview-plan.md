# Nudge user research plan (ON HOLD)

> **Status: On hold (24 Nov 2026).** No real-world interviews or external tests for the foreseeable future. Nudge is proceeding as John's personal tool first, using best guesses from [market-2026-11.md](market-2026-11.md) (see [ADR 0008](../adr/0008-personal-first-and-cross-device-storage.md)). Revisit this plan only if John later decides to test paid consumer demand.

**Goal:** Decide if Nudge should be a small, non-predatory paid product or a personal-only tool — before building anything more.  
**Scope:** Parked. Phase 1 (8–10 short chats) and Phase 2 (1-week prototype and any paid waitlist/deposit) are both paused until John asks to resume them.

---

## 1. Who to ask and where

Look for **8–10 adults with ADHD, autism, or AuDHD** who regularly hit task freeze (know what needs doing, feel stuck, abandon planners).

**Where to find them:**
- **Friends and personal network first** (easiest 3–4 chats, lowest friction).
- **Online ND communities:** e.g. `r/AutisticWithADHD`, `r/ADHDUK`, `r/ADHD`, ND Discord servers, or Bluesky/Mastodon ND threads. Check community rules first and ask mods if research posts need approval.

**Hard boundary:**
- **Do not recruit Fedcap clients** (or anyone from your day job caseload). Keep work and personal projects completely separate.

**Copy-paste invite (for friends or approved posts):**
> "I'm exploring a tiny, calm tool for AuDHD task freeze — dump a messy thought, get just one tiny next step, no timers or guilt. It might become a small, fairly priced app one day, or just stay a personal tool. Before I decide, I'm doing 10 quick chats (15 mins, or async by text/voice note) to hear how task paralysis actually shows up for people and why other apps don't stick. Fancy helping out?"

---

## 2. The 5-question interview script

Keep it to **15 minutes**. Ask about **real past moments**, not hypotheticals ("would you use...").
1. **The last freeze:** "Think about the last time you knew you had to do something, felt frozen, and couldn't start. What was it, and what happened?"
2. **What broke the stuckness:** "What did you do instead, or what eventually got you moving — even a tiny bit?"
3. **Why other tools failed:** "Have you tried apps or systems for this (like Goblin Tools, Tiimo, planners, or AI chat)? What made you stop using them?"
4. **Live 1-step check (3 mins):** "Pick one annoying thing on your plate right now. If a tool hid everything else and only showed one tiny 2-minute physical step — with just 'Done' or 'Make it smaller' — would that help or annoy you? Why?"
5. **Fair pricing vs traps:** "Have you ever paid for an app to help with executive dysfunction? What made it feel fair — or feel like a waste of money?"

_Wrap-up:_ "If I put a rough free web version together later, would you want to try it for a week?"

---

## 3. Low-effort way to run it

Foot In Work stays top priority, so keep this lightweight:
- **Pace:** 2–3 people a week over 3–4 weeks. Max 1 chat per day.
- **Offer async by default:** Let people answer the 5 questions by text or voice notes if they prefer. Many ND people find that easier than calls, and it removes scheduling friction.
- **Zero-effort notes:** Right after each chat, log just 4 short bullets in one file (`docs/research/interview-notes.md`):
  1. Trigger (what froze them)
  2. Why other apps died
  3. Reaction to the single-step idea
  4. Willing to try the 1-week prototype? (Y/N)
- **Privacy:** Don't record calls unless they explicitly say yes. Store notes using numbers (`P1`, `P2`), not real names, since people may mention diagnoses or health details.

---

## 4. Phase 2 — 1-week prototype & waitlist test (needs John's yes first)

> **Not started yet.** Both the hosted prototype and taking any money go beyond the current "planning only" decision. Do not host a prototype, open a waitlist, or take deposits without a separate, explicit yes from John after Phase 1.

If the chats point to real demand, the next step is a small test with the 8–10 people who opted in (still no public launch):
- **What to test:** A stripped-down, no-account web link of the existing core loop only: **brain dump → one tiny next step → "Done" or "Make it smaller"**. Local browser storage only, plus a clear note not to paste private medical/financial details.
- **How to measure (behaviour, not compliments):**
  - Day 1: Send the link; ask them to use it on one real stuck task.
  - Day 4: One short check-in message ("Did you open it again, or forget it existed?").
  - Day 7: Send a 2-minute feedback + pricing check.
  - Day 14: Check who came back during week 2 without being nudged.
- **Real payment-intent check (waitlist):** At Day 7, don't ask "would you pay?" Show two honest founding options — **£3/month** or **£25 one-off** (always with a useful free tier and no lapse penalties) — and ask them to join the paid waitlist with a **refundable £5 deposit** (or cancel-anytime pre-order) only if they actually want it built.
- **Before taking any money:** Taking deposits triggers UK consumer law, cancellation/refund handling, clear terms, and payment-processor obligations. Review those rules and get John's explicit sign-off before collecting a penny.

---

## 5. Clear Go / No-Go decision bar

From [market-2026-11.md](market-2026-11.md):

| Signal                      | Target to build as a paid product            |
| --------------------------- | -------------------------------------------- |
| Repeated use in week 1      | **6 / 10** use it on multiple days           |
| Unprompted return in week 2 | **4 / 10** come back without a reminder      |
| Real willingness to pay     | **3 / 10** pay or place a refundable deposit |
- **Hits the bar:** Worth building as a small, calm, non-predatory paid product.
- **Misses the bar (people are polite, but don't return or pay):** Keep Nudge as a free personal tool for John, or rethink the problem before writing more code.
