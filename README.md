# Askboard: live Q&A with AI

Your audience scans a QR code, asks questions, and upvotes the best ones. Questions appear live
on the presenter's screen. AI hides spam and groups similar questions by topic, and can write a
summary at the end.

Built with Next.js (App Router), React, Tailwind CSS, PostgreSQL with Prisma, and plain
JavaScript (no TypeScript).

Theme: paper `#EFF3F1`, ink `#22333B`, sage `#5E8B7E`, sand `#C7A17A`. The page background is
never white.

---

## Quick start (about 10 minutes, one free account)

You need Node.js 20 or newer.

1. **Create a free Postgres database** at [neon.tech](https://neon.tech). Copy the pooled
   connection string (the host contains `-pooler`) and the direct one.
2. **Copy the env file** and paste the two strings in:
   ```bash
   cp .env.example .env
   ```
   Fill in `DATABASE_URL` (pooled) and `DIRECT_URL` (direct). With a local Postgres, use the same
   string for both.
3. **Install and create the tables:**
   ```bash
   npm install
   npx prisma migrate dev --name init
   ```
4. **Run it:**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000, click **Start a session**, then open the join link in a second
   browser window or on your phone.

That is all you need. Everything else is optional and the app works without it:

| Optional service | Without it | With it |
|---|---|---|
| Pusher (`PUSHER_*`, `NEXT_PUBLIC_PUSHER_*`) | Screens refresh every 3 seconds | Updates arrive instantly |
| Upstash Redis (`UPSTASH_*`) | In-memory rate limits (fine for one server) | Shared rate limits across servers |
| Anthropic key (`ANTHROPIC_API_KEY`) | Free built-in fake AI (`AI_MODE=mock`) | Real AI moderation, grouping and summaries |

## Check that it works

1. Create a session. You land on the presenter board with a QR code and a six-character code.
2. Open the join link in another window. Post a question. It appears on the board.
3. Upvote it. The count goes up once. Voting again does nothing.
4. Post four questions within a minute. The fourth is rejected.
5. Post `buy now at https://spam.com`. In test mode it disappears within a few seconds.
6. Post `Pricing for teams?` and `Pricing for students?`. Both get the topic label Pricing.
7. On the presenter board, use **Pin**, **Mark answered**, **Hide**, **Summarize questions**,
   and **End session**.

Run the unit tests with `npm test`.

## Test from your phone

Your phone and computer must be on the same Wi-Fi.

1. Find your computer's local IP address, for example `192.168.1.20`.
2. In `.env`, set `DEV_ORIGINS=192.168.1.20`, then restart `npm run dev`.
3. Open `http://192.168.1.20:3000/create` **on your computer** (not localhost). The QR code uses
   the address open in the presenter's browser, so it now works on phones.

## Use the real AI

In `.env`, remove `AI_MODE=mock` (or change it) and set `ANTHROPIC_API_KEY`. The model name is set
in `lib/ai.js` (or with `AI_MODEL`). Check the Anthropic docs for current model names, and set a
monthly spending limit in the console. Each question costs one small call, and
`MAX_AI_QUESTIONS_PER_SESSION` caps the AI work per session.

If the AI fails for any reason, questions stay visible and ungrouped. The app never blocks on it.

## How it works

```
Audience scans QR -> posts question -> API validates, rate limits, saves to Postgres
   -> broadcasts "question:new" (Pusher, or picked up by polling)
   -> responds right away
   -> after the response: AI hides spam / assigns a topic -> broadcasts "question:updated"
```

- **Save first, then broadcast.** The database is the source of truth.
- **Respond first, run the AI after** (Next.js `after()`).
- **Fail open.** An AI error never hides or blocks a question.
- **One vote per person** is enforced by a database unique constraint.
- **The presenter token** is created with the session, stored only in the presenter's browser, and
  checked on every moderation route. It is never sent to audience pages.
- **Rate limits:** 3 questions per minute per browser, 40 votes per minute per browser, and a
  generous per-IP limit (venue Wi-Fi puts many people behind one IP).

## Project structure

```
app/
  page.js                       landing page
  template.js                   page fade on every navigation
  globals.css                   theme colors, fonts, and all animation keyframes
  create/page.js                create a session, with a live preview card
  join/[code]/page.js           audience page (server) -> AudienceView
  present/[id]/page.js          presenter page (server) -> PresenterBoard
  api/
    sessions/route.js           POST create session
    sessions/[id]/summary       POST AI summary (presenter)
    sessions/[id]/status        PATCH end or reopen (presenter)
    questions/route.js          GET sync, POST submit
    questions/[id]/route.js     PATCH pin / answer / hide (presenter)
    upvote/route.js             POST upvote
components/
  AudienceView, PresenterBoard  the two live screens
  NegativeHeading, DemoBoard    landing page heading effect and the self-playing sample board
  Button, JoinForm, Logo        shared UI
  Marquee, Reveal, LiveDot      ticker, scroll reveal, pulsing status dot
  AnimatedNumber, Skeleton      counting numbers, loading placeholders
hooks/
  useLiveQuestions.js           Pusher or polling, one reducer
  useFlip.js                    smooth re-ordering of lists
  useFreshIds.js                highlights questions that just arrived
lib/                            db, serialize, voter, sort, ratelimit, pusher, ai, similarity
prisma/schema.prisma            Session, Question, Cluster, Upvote
tests/                          Vitest unit tests
```

## Animations and interactions

| Where | What it does |
|---|---|
| Landing heading | **Negative mask reveal.** A line draws across each heading line, opens into an inverted block (paper text on ink), then wipes away to reveal the heading. A sand line draws underneath. Hover the heading to replay it. |
| Landing sample board | Plays by itself: votes tick up, rows re-order smoothly, vote bars fill, a spam message arrives and is hidden. A sand spotlight follows the pointer. |
| Landing page | Use-case ticker (pauses on hover), three steps that rise into view once, hover effects on steps and the final call-to-action card. |
| Buttons | A colour sweeps up from the bottom on hover, and buttons press in when clicked. |
| Create page | A preview card updates with your title and a sample code as you type. |
| Audience page | New questions slide in with a sand highlight. Votes pop when the number changes. The list re-orders smoothly. The live dot pulses. The header blurs as you scroll. |
| Presenter board | Same live behaviour, plus counting numbers for questions and votes, and a QR card that tilts on hover. |
| Page changes | A quick fade between pages, and shimmering placeholders while a session loads. |

**Tweaking:** all keyframes live in `app/globals.css`. For the heading, change the `1.5s`
duration and the `170ms` per-line delay in the `.neg-block` and `.neg-base` rules, and edit the
text lines in `app/page.js`. Everything respects the reduced-motion setting on a device: with it
on, animations are skipped and the finished state is shown.

## Change the theme

All four colors live at the top of `app/globals.css` in the `@theme` block (`paper`, `ink`,
`sage`, `sand`). Components use them as Tailwind classes such as `bg-paper`, `text-ink`,
`bg-sage/20`, and `bg-sand`. Fonts are Bricolage Grotesque (headings) and Instrument Sans (body),
loaded in `app/layout.js`. To swap a font, change the import there.

## Deploy to Vercel

1. Push the project to GitHub (`.env` is already in `.gitignore`).
2. Import the repository in Vercel and add the variables from `.env`. Optionally set
   `NEXT_PUBLIC_APP_URL` to your deployed address.
3. Apply the tables to your production database from your computer, with the production strings
   in `.env`:
   ```bash
   npx prisma migrate deploy
   ```
4. Deploy, then run the checks above on your phone using the live URL.

The `build` script runs `prisma generate` first, which Vercel needs.

Before a real event: add the Pusher keys (instant updates), add Upstash (shared rate limits), set
an AI spending limit, and test with 10 or more people. Free-tier limits change, so check each
service's current limits.

## Troubleshooting

| Problem | Fix |
|---|---|
| `Environment variable not found: DATABASE_URL` | Create `.env` from `.env.example` and fill it in |
| Prisma cannot reach the database | Check both strings, keep `sslmode=require`, and make sure the Neon project is not paused |
| Migrations hang | Set `DIRECT_URL` to the direct (non-pooled) string |
| `@prisma/client did not initialize` | Run `npx prisma generate` |
| Phone cannot open the site | Same Wi-Fi, use the IP address, and set `DEV_ORIGINS` in `.env` |
| QR code does not work on a phone | Open the presenter page at your IP address, not localhost |
| Live updates feel slow | Without Pusher the app polls every 3 seconds. Add the Pusher keys |
| Font build error | In `app/layout.js`, replace the two fonts with another Google font such as `Inter` |
| Spam is not hidden | In real-AI mode check the API key, model name and server logs. Mock mode only catches obvious spam |

## Known limitations

- If two similar questions arrive at the same instant, the AI may create two topic labels.
- The voter token is stored in the browser. It deters double voting but is not strong security,
  which is why the server also rate limits by IP.
- Hidden questions are removed from the board with no undo in this version.
- Presenters have no accounts. Whoever holds the presenter token (the creating browser) moderates.
