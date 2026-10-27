# Nudge

A gentle second brain for people with ADHD and autism. Dump whatever is on your mind, answer one small question at a time, pick one thing that fits your energy, and learn from how it went.

Nudge turns a messy brain dump into small SMART goals without ever showing a form, lets goals fail by themselves when their date passes, and treats every failure as feedback: it learns from the pattern and pitches the next goal so it's a stretch, but a doable one.

## How it works

1. **Dump it.** Write anything, however messy. Nudge splits it into separate goals, strips the "I really need to", spots dates like "by Friday" and guesses sizes.
2. **Answer one question at a time.** Each goal needs five parts before it can start: the first physical action, what done looks like, a size, a due date and why it matters. Nudge asks for whatever it couldn't guess, one card at a time. Big goals get small first steps instead, and Nudge asks for the next step when each one is done.
3. **Pick one thing.** Say how much energy you have, and Nudge offers two to four options (due soon, a quick win, something weighing on you, a step towards something bigger), each with a reason.
4. **Learn from how it went.** Mark it done, or failed. Anything not done by its date fails by itself, recording whether it was never started or ran out of time. Reflecting is optional. Nudge aims for goals you usually manage but not always, and says in plain words whenever it adjusts.

The full design is in [CONTEXT.md](CONTEXT.md) (vocabulary and the plain-English rule) and the [design records](docs/adr).

## Architecture

```
src/
├── core/                 Pure TypeScript, no React or server code, fully unit tested
│   ├── events.ts         The journal's event types, as zod schemas
│   ├── journal.ts        apply() and replay(): the rules every change must follow
│   ├── decide.ts         Commands → events: ids, next questions, write-ins, deadlines
│   ├── cards.ts          Clarification Cards for each missing part, steps and next steps
│   ├── untangle.ts       The offline engine: brain dump → drafts
│   ├── templates.ts      Starter steps and answers for common kinds of task
│   ├── dates.ts          "by Friday", "in 3 days", "half an hour"
│   ├── calibration.ts    Learning from the pattern of results
│   ├── nudges.ts         Energy-led suggestions
│   ├── progress.ts       Quiet Progress, worked out from the journal
│   └── plainEnglish.ts   The banned-words list
├── server/               Server functions, Drizzle schema, storage, the optional AI engine
├── lib/                  Browser sync (useJournal), energy, untangling
├── components/           The card hand, agreed task, nudges, feedback and so on
└── routes/               Home, Today, Progress
```

Everything is stored as an append-only journal of events. The browser and the server run the same `apply()` function, so the server can check every change; the browser shows changes instantly, caches them, and catches up if another device saved first.

### The plain-English rule, enforced

`src/plainEnglishUi.test.ts` scans every screen's text, and `src/core/__tests__/learning.test.ts` checks every built-in suggestion, question and learning note, against the banned-words list. AI replies that use a banned word are thrown away.

## Development

Needs Node 22 and pnpm.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

With no environment variables, journals are kept in server memory and brain dumps are untangled by the built-in rules. Copy `.env.example` to `.env` to add:
- `DATABASE_URL`: a Neon Postgres database. Run `pnpm db:migrate` once.
- `GEMINI_API_KEY`: turns on the AI engine. The app tells users when it's on.

| Script                         | What it does                                     |
| ------------------------------ | ------------------------------------------------ |
| `pnpm test`                    | Unit tests (Vitest)                              |
| `pnpm test:e2e`                | Browser tests on desktop and mobile (Playwright) |
| `pnpm lint` / `pnpm typecheck` | Biome and TypeScript                             |
| `pnpm db:generate`             | New migration after a schema change              |
| `pnpm build` / `pnpm start`    | Production build and server                      |

## Deploying

The app deploys to Vercel as is. Add a Neon database through the Vercel integration so `DATABASE_URL` is set, and `vercel.json` runs the migrations before each build.
