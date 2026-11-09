# Hexa AskBoard

Live Q&A for talks, classes and meetings. People scan a QR code (or use the scanner built into the
site), ask questions and vote. The presenter sees the best questions first and can **reply privately
to one person, with text and files of any type**. Nobody else can see the reply. Spam is hidden and
similar questions are grouped by topic, and a summary is one click away.

Built with Next.js (App Router), React, Tailwind CSS, PostgreSQL with Prisma, and plain JavaScript
(no TypeScript).

Colors: paper `#E8E2D3` (page, never white), sheet `#F0ECE1`, ink `#22333B`, pine `#35584D` (dark
green for text and buttons), sage `#5E8B7E`, sand `#C7A17A`. Fonts: Familjen Grotesk and IBM Plex Mono.

---

## Quick start (about 10 minutes, one free account)

You need Node.js 20 or newer.

1. **Create a free Postgres database** at [neon.tech](https://neon.tech). Copy the pooled connection
   string (the host contains `-pooler`) and the direct one.
2. **Copy the env file** and paste the two strings in:
   ```bash
   cp .env.example .env
   ```
   Fill in `DATABASE_URL` (pooled) and `DIRECT_URL` (direct).
3. **Install and create the tables:**
   ```bash
   npm install
   npx prisma db push
   ```
4. **Run it:**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

Everything else is optional and the app works without it:

| Optional service | Without it | With it |
|---|---|---|
| Pusher (`PUSHER_*`) | The page checks the server every 3 to 4 seconds | Updates arrive instantly, and there is far less server load |
| Upstash Redis (`UPSTASH_*`) | In-memory rate limits (fine for one server) | Shared rate limits across servers |
| Anthropic key | Free built-in fake AI (`AI_MODE=mock`) | Real AI moderation, grouping and summaries |

## Updating from the last version

1. Unzip this version into a new folder, then copy your old `.env` file into it.
2. Run `npm install` (a new package, `jsqr`, powers the scanner).
3. Run `npx prisma db push` only if you have not already applied the private-replies tables.
4. Push to GitHub so Vercel redeploys.

Replacing the whole folder matters: this version removes some old files (the hexagon components, the
old data hooks, `app/api/replies`), and leftovers would just add clutter.

## The QR scanner

Every page that needs it has a **Scan a code** button, and there is a full-screen scanner at `/scan`.
It opens the phone or tablet camera, reads the QR code, and goes straight to the session. It uses the
phone's built-in QR detector where there is one, and a small JavaScript decoder everywhere else.
There are buttons to flip the camera and turn the light on where the phone supports them.

- **Browsers only allow the camera on a secure address:** `https://` (so your Vercel site is fine) or
  `localhost`. On your computer's local network address (`http://192.168...`) the camera is blocked by
  the browser. The scanner then shows a **Take a photo of the code** button, which uses the phone's
  own camera app and works on any address. For live camera testing on a phone, use your deployed site.
- If the camera permission was denied, the scanner says so and explains how to allow it.
- Codes from any address are accepted, but only join links for Hexa AskBoard sessions (or the bare
  six characters). Anything else is ignored.

## Why it was slow, and what changed

A free database in another country adds 100 to 300 ms to every query, and the app used to make 3 to 6
queries one after another for each action, plus an extra request every few seconds per screen. Now:

- Each action makes **one or two** database calls, and independent calls run at the same time.
- Telling other screens (and the AI work) happens **after** the response is sent.
- The join and presenter pages **show immediately**. A new session appears on the presenter screen
  from what the browser already knows, then loads the questions.
- A quiet **warm-up call** wakes the sleeping free database and the server while a visitor is still on
  the home page or the create page.
- Without Pusher, each screen makes **one request per check** (it used to make two or three).
- The heavy visual effects (full-screen grain, blur, glow, big shadows) are gone. They make phones slow.
- The most recent session lookups are cached in memory for 5 seconds, so posting a question is usually
  a single database write.

**Two things only you can do, and they matter most:**

1. **Put the server in the same region as your database.** In Vercel: your project, Settings,
   Functions, **Function Region**. If your Neon database is in Singapore, choose Singapore (`sin1`). If
   it is in US East 2 (Ohio), choose Washington D.C. (`iad1`) or Cleveland (`cle1`). Then redeploy. A
   mismatch alone can add a full second to every action.
2. **Turn on Pusher** (free). It removes the repeated checking entirely.

For local use, `npm run dev` now uses Turbopack. The first visit to each page still has to compile, so
for a true speed test run `npm run build` and then `npm start`.

I could not measure real speed in the environment this was built in. The changes remove database round
trips and work, but the numbers you see depend on your regions and your connection.

## Private replies

- **Presenter:** on the presenter board, click **Reply privately** on any question. Write a reply and add
  files by choosing them, dragging them in, or pasting a screenshot. Any file type, up to 3 files and
  4 MB in total. You can also mark the question as answered on the shared board (everyone sees the
  label, nobody sees the reply).
- **The person who asked:** a **Private from the presenter** box appears at the top of their page, on the
  device and browser they asked from, with download buttons.
- **Everyone else:** sees nothing, and no sign that a reply exists.
- **Names:** askers can add an optional name, shown with their question, so the presenter knows who is
  who.

How the privacy works:

- A reply is matched to its asker by a secret token kept in their browser. The server only returns a
  reply or its files to a request carrying that token (or the presenter's token).
- Replies never travel on the shared live channel. The live ping to the asker holds no content.
- Files download with a POST request (the token never appears in a URL), and are always sent as
  attachments with `application/octet-stream` and `nosniff`. Anyone without access gets a plain 404.

Limits to know about:

- If the asker clears their browser data or switches device, they lose access to replies. Askers are
  anonymous, so there is no other way to prove who they are.
- Files are stored in the database. That is simple, but large or many uploads grow it quickly. For
  heavier use, move storage to Vercel Blob or S3.
- Vercel limits a request to about 4.5 MB, which is why the total is capped at 4 MB.

## Check that it works

1. Click **Start a session**, give it a title, and create it. The board opens at once.
2. Open the join link in a second browser window, and post a question with a name.
3. Upvote it. The count goes up once. Voting again does nothing.
4. Post four questions in a minute. The fourth is rejected.
5. Post `buy now at https://spam.com`. In test mode it disappears within a few seconds.
6. Post `Pricing for teams?` and `Pricing for students?`. Both get the topic Pricing.
7. On the board, try Pin, Mark answered, Hide, Summarize questions and End session.
8. Click **Reply privately**, write a reply, attach a file, and send. It appears in the asker's window
   under **Private from the presenter**, with a working Download button.
9. Open the join link in a third window and confirm it shows no reply.
10. On a phone, open the deployed site, tap **Scan a code**, and scan the board's QR code.

Run the unit tests with `npm test`.

## Test from a phone on your own network

1. Find your computer's local IP address, for example `192.168.1.20`.
2. In `.env`, set `DEV_ORIGINS=192.168.1.20`, then restart `npm run dev`.
3. Open `http://192.168.1.20:3000/create` on your computer so the QR code carries that address.
4. Remember the live camera is blocked on `http://` addresses. Use **Take a photo of the code**, or test
   the camera on your deployed site.

## Project structure

```
app/
  page.js                       landing page
  scan/page.js                  full-screen scanner
  create/page.js                create a session
  join/[code]/page.js           audience page (shell) -> AudienceView
  present/[id]/page.js          presenter page (shell) -> PresenterBoard
  api/
    sync                        POST everything a screen needs, in one request
    warm                        GET wakes the database and the server
    sessions                    POST create
    sessions/[id]/summary       POST AI summary (presenter)
    sessions/[id]/status        PATCH end or reopen (presenter)
    sessions/[id]/replies       POST replies already sent (presenter)
    questions                   POST submit
    questions/[id]              PATCH pin / answer / hide (presenter)
    questions/[id]/reply        POST private reply with files (presenter)
    upvote                      POST upvote
    files/[id]                  POST private file download (asker or presenter only)
components/                     AudienceView, PresenterBoard, ReplyDrawer, PrivateInbox, QrScanner,
                                ScanButton, JoinForm, Button, FileBadge, FileChip, NegativeHeading,
                                DemoBoard, PrivateReplyDemo, Warmup, Logo, LiveDot
hooks/                          useRoom (all live data), useFlip (smooth re-ordering), useFreshIds
lib/                            db, serialize, voter, sort, ratelimit, pusher, ai, files, download,
                                joinCode, sessionCache, similarity
prisma/schema.prisma            Session, Question, Cluster, Upvote, Reply, ReplyFile
tests/                          Vitest unit tests
```

## Use the real AI

In `.env`, remove `AI_MODE=mock` and set `ANTHROPIC_API_KEY`. The model name is in `lib/ai.js` (or set
`AI_MODEL`); check the Anthropic docs for current names, and set a monthly spending limit in the
console. If the AI fails, questions stay visible and ungrouped.

## Change the colors

All colors are at the top of `app/globals.css` in the `@theme` block. Components use them as Tailwind
classes such as `bg-paper`, `bg-pine`, `text-ink`, `bg-sand`. The heading animation is in the same
file (`.neg-block`, `.neg-base`), and its text lines are set in `app/page.js`. Reduced-motion settings
on a device switch the animations off.

## Deploy to Vercel

1. Push to GitHub (`.env` is already in `.gitignore`).
2. Import the repository in Vercel and add the variables from `.env`.
3. Set the **Function Region** next to your database (see above).
4. Deploy, then run the checklist on your phone.

## Troubleshooting

| Problem | Fix |
|---|---|
| `Environment variable not found: DATABASE_URL` | Create `.env` from `.env.example` and fill it in |
| Prisma cannot reach the database | Check both strings, keep `sslmode=require`, and wake a paused Neon project |
| Everything feels slow | Match the Vercel Function Region to your database, and turn on Pusher |
| The scanner shows "camera is not available" | You are on an `http://` address, or permission was denied. Use the photo option, or the deployed site |
| Phone cannot open the dev site | Same Wi-Fi, use the IP address, and set `DEV_ORIGINS` in `.env` |
| Font build error | In `app/layout.js`, replace the two fonts with another Google font such as `Inter` |

## Known limitations

- If two similar questions arrive at the same instant, the AI may create two topic labels.
- The voter token lives in the browser. It deters double voting but is not strong security, which is
  why the server also rate limits by IP.
- Hidden questions are removed from the board with no undo in this version.
- Presenters have no accounts. Whoever holds the presenter token (the creating browser) moderates.
