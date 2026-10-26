# 2. SMART goals, calibrated from the pattern of results

Status: accepted

## Context

A goal that's too big or too vague doesn't get started. A goal that's too easy doesn't build anything. The SMART framework names what a startable goal needs, and the results of past goals say how big and how soon to pitch the next one.

The first version modelled SMART but nothing ever filled the parts in, so nothing could be learned. A form to fill them in would bring back the blank-form problem Nudge exists to remove.

## Decision

- Every goal carries five parts: specific (first physical action), measurable (what done looks like), achievable (minutes), relevant (why) and time-bound (due date).
- A goal can't be started until all five are in place. The rule lives in the core (`src/core/journal.ts`), so no screen can skip it.
- Nudge guesses what it can from the brain dump and asks for the rest with Clarification Cards, one part at a time (ADR 3).
- Calibration looks at the last 20 results. With five or more, it aims for a success rate between 60% and 85%: above that it suggests bigger steps and sooner dates; below it, smaller steps and more time. It also learns whether things take longer than guessed and whether starting is the hard part.
- Each adjustment comes with a plain-English note, shown on the Progress page.

## Consequences

- People see why suggestions change, which matters for autistic users who rely on predictability.
- Calibration is deliberately simple and explainable rather than a model. It can grow later without changing the journal.
- The word "SMART" never appears in the app (see the plain-English rule in CONTEXT.md).
