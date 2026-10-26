# Roadmap

The 2026 rebuild replaced the first version's code. This is where the original issues stand against it.

## Done in the rebuild

| Issue                                                                     | What it asked for                                                                                  | Where it landed                                                                                                                                                                                       |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [#12](https://github.com/John-Dennehy/nudge/issues/12) Server persistence | Tasks, reflections and progress on a server, synced across devices, with a move from local storage | Event journal on Neon Postgres ([ADR 5](adr/0005-event-journal.md)), device linking codes ([ADR 6](adr/0006-private-spaces-without-accounts.md)), and a one-time import of old `nudge_tasks_v1` tasks |
| [#15](https://github.com/John-Dennehy/nudge/issues/15) Learning nudges    | Suggestions that adapt from reflection history                                                     | Calibration from the pattern of results, with plain-English notes ([ADR 2](adr/0002-smart-goals-and-calibration.md)) and energy-led nudges ([ADR 4](adr/0004-energy-led-nudges.md))                   |
| [#16](https://github.com/John-Dennehy/nudge/issues/16) Quiet Progress hub | A place to see quiet momentum, with no streaks                                                     | The Progress page: counts, what Nudge has learned, results by size and recent wins and lessons                                                                                                        |
| [#14](https://github.com/John-Dennehy/nudge/issues/14) Card polish        | Keyboard, touch and write-in for the card hand                                                     | Keyboard, tap and sideways scroll on phones, and write-ins read for the question asked ([ADR 3](adr/0003-one-question-at-a-time.md))                                                                  |

## Partly done

- [#13](https://github.com/John-Dennehy/nudge/issues/13) Streaming untangling: the AI engine and offline rules both exist and are checked ([ADR 7](adr/0007-optional-ai.md)), but replies aren't streamed yet.

## Waiting

- [#17](https://github.com/John-Dennehy/nudge/issues/17) External API for a CLI or voice assistant: needs real accounts first (see ADR 6).
- Voice input for brain dumps.
- Reminders before a due date, if they can be done without becoming nagging.
