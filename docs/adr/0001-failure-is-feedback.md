# 1. Failure is feedback, and goals fail by themselves

Status: accepted

## Context

Many apps for neurodivergent people soften failure ("shelved", "archived") to avoid triggering rejection sensitivity. That hides the most useful information there is: what didn't work. Practice is repeated failure until you succeed. Asking people to mark their own failures, though, is a chore that gets skipped, and the record ends up only showing wins.

## Decision

- `Failed` is a first-class outcome, shown plainly and framed as feedback.
- Every goal has a due date. When it passes, the goal fails by itself. Nobody marks failures by hand.
- Each failure records whether the goal was **never started** or **ran out of time**, because they teach different things.
- Reflection is optional, after successes as well as failures. Nudge learns from the pattern either way.
- After a failure, Nudge offers a fresh try sized by what the failure taught (smaller, later, or "just start").

## Consequences

- The journal holds an honest record of what gets done and what doesn't, which calibration (ADR 2) depends on.
- Failing automatically must never feel like a punishment: no timers or countdowns are shown, the copy is calm, and Quiet Progress counts failures as lessons learned.
- The server refuses an automatic failure dated before the goal's due date, so a device with a wrong clock can't fail goals early.
