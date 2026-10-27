# 6. Private spaces without accounts

Status: proposed (waiting on John's choice)

## Context

What Nudge stores is personal: what someone is avoiding, how overwhelmed they felt. A public deployment with server storage must keep each person's data separate. A sign-up form, though, is exactly the kind of barrier Nudge exists to remove.

## Decision

- Each browser gets a private, anonymous space, named by a random id in an http-only cookie. No names, emails or passwords are stored.
- A short linking code (two words and a number, valid once for 15 minutes) moves another device into the same space.
- "Delete everything" removes the space and all its events from the server.

## Consequences

- Clearing cookies loses access to the space on that device; if the browser still has its local copy, Nudge uploads it into a new space.
- Real accounts (for example Clerk) can be added later by attaching a space to a user, without changing the journal.
- The external API idea (old issue #17) needs real authentication, so it waits for accounts.
