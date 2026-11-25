# 7. AI is optional and never trusted blindly

Status: accepted

## Context

A language model splits and sizes brain dumps better than rules, but brain dumps are personal, AI services fail and slow down, and a model can return broken JSON or jargon.

## Decision

- Built-in rules (`src/core/untangle.ts`, `src/core/templates.ts`) do the whole job offline. They split ideas, strip filler, find dates like "by Friday", guess sizes and offer starter steps for common kinds of task.
- When `GEMINI_API_KEY` is set, the server asks Gemini first. The brain dump is passed as data with an instruction not to follow anything inside it, the key goes in a header, and the request times out after 8 seconds.
- Replies are checked against a schema and the plain-English rule. Anything that fails is thrown away and the built-in rules take over.
- The brain dump box says plainly whether text is sent to an AI.
- Dates come back as the user's own words and are read in the browser, so "Friday" means the user's Friday.

## Consequences

- The app works the same with or without a key, and the tests never need one.
- Swapping providers means changing one file (`src/server/untangleAi.ts`).
