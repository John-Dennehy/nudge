# Nudge

An executive-function second brain for people with ADHD and autism (AuDHD). It turns raw brain dumps into small SMART goals, offers a few next steps that fit current energy, and learns from every success and failure to pitch the next goal well.

This is the shared vocabulary for the code, the docs and conversations about Nudge. The words on the left are for us. Most of them never appear in the app (see the plain-English rule below).

## Language

**Brain Dump**:
Unstructured text from the user. Nudge splits it into separate goals and guesses what it can about each one.
_Avoid_: Task creation form, ticket submission

**SMART Goal**:
A goal with all five parts in place: **Specific** (the first physical action), **Measurable** (what done looks like), **Achievable** (a size in minutes that fits the user's track record), **Relevant** (why it matters, or the bigger goal it serves) and **Time-bound** (a due date). A goal can't be started until all five are there. A goal too big to start is split into Steps instead.
_Avoid_: Epic, project, composite task, backlog item

**Step**:
A small goal (about 2 to 15 minutes) under a bigger goal. Nudge tracks the bigger goal quietly and asks for the next step when one finishes, so the user never manages a tree.
_Avoid_: Subtask, child ticket

**Clarification Card**:
One question about one missing part of a goal, with a few answers to pick from and a write-in. Only one is shown at a time.
_Avoid_: Form wizard, setup questionnaire, planning modal

**Ready**:
A goal whose five parts are all in place. Replaces the old idea of a confidence score: readiness is a fact about the goal, not a number.
_Avoid_: Confidence score, completion percentage

**Agreed Task**:
The one goal being worked on now. Shown with its five parts and its due date as a date, never as a countdown.
_Avoid_: In progress list, active sprint, WIP column

**Adaptive Nudges**:
A few options to choose the next goal from, chosen by the user's energy right now and by what Nudge has learned. Each says why it's there.
_Avoid_: Fixed 3-task limit, rigid categories, Kanban columns, backlog ranking

**Failed**:
A goal that wasn't done by its due date, or that the user says didn't happen. Goals fail by themselves when their date passes, so nobody marks failures by hand. Failure is feedback, not a verdict: practice is repeated failure until you succeed. Nudge records whether the goal was **never started** (getting started was the hard part) or **ran out of time** (it was sized wrong).
_Avoid_: Shelved, dropped, abandoned, softened labels that hide it

**Reflection**:
Optional answers after a goal finishes. After a failure: was it reasonable, was I overwhelmed? After a success: did it stretch me, how long did it really take? Nudge learns from the pattern whether or not the user reflects.
_Avoid_: Retrospective, review form

**Calibration**:
How Nudge adjusts the size and timing of future goals from the pattern of successes and failures. The aim is goals the user usually manages, but not always: achievable without being too achievable. Every adjustment is explained in plain words.
_Avoid_: Algorithm, score, personalisation engine

**Quiet Progress**:
Gentle counts of work that's easy to miss: thoughts untangled, things done, lessons learned (failures), reflections saved, comfort zones stretched.
_Avoid_: Streaks, productivity score, leaderboard, gamification badges

**Space**:
The private, anonymous place a user's journal lives, linked to their browser. There are no accounts; a short code links another device.
_Avoid_: Account, profile, workspace

## Communication rule: pure plain English

Everything the user sees must be free of technical and productivity jargon. A test scans every screen and every built-in suggestion for a list of banned words (`src/core/plainEnglish.ts`), and AI suggestions that use one are thrown away.
- Never show terms like "SMART", "criteria", "confidence score", "dependency", "state machine", "atomic", "scope" or "leverage".
- Use warm, direct, everyday language:
  - Instead of _"Specific criterion unmet"_, ask _"What's the very first thing you'd physically do?"_
  - Instead of _"Time-bound: missing"_, ask _"When should this be done by?"_
  - Instead of _"Deconstructing parent entity"_, say _"This sounds like a big one. What's a small first step?"_
  - Instead of _"Task transitioned to Failed"_, say _"Failed: its date passed. That's feedback, not a verdict."_
