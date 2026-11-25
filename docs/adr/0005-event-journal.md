# 5. An event journal as the only stored data

Status: accepted

## Context

Nudge needs to sync between devices, let the server check every change, count Quiet Progress accurately and learn from history.

## Decision

- Every change is an event (`dumped`, `answered`, `agreed`, `finished`, `reflected` and so on) in an append-only journal. The current state is rebuilt by replaying it (`src/core/journal.ts`).
- Commands go through `decide()`, which works out everything that needs judgement (ids, the next question, reading a write-in) and puts it in the events. Replay is then exact anywhere.
- The browser and the server run the same `apply()` function. The server refuses any batch that doesn't replay cleanly.
- Saving is optimistic: changes show at once, are cached locally, and are sent in order. A save names the position it expects; if another device got there first, the browser catches up and replays its unsaved changes on top, dropping any that no longer fit.
- Storage is Postgres on Neon, with `(owner_id, seq)` as the primary key so two conflicting saves can't both land. Without `DATABASE_URL` the server keeps journals in memory for local work.

## Consequences

- Quiet Progress, calibration and "what happened today" are all worked out from the journal, so they can't drift.
- Journals grow forever; a space is capped at 20,000 events, which is years of normal use.
- The roadmap's original choice of SQLite was dropped, because serverless hosting doesn't keep local files.
