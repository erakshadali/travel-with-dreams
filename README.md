# Travel With Dreams

A small-group travel agency website: browse trips, read full itineraries, discover offbeat "unexplored escapes", and send booking requests or enquiries.

**Live site:** https://travel-with-dreams.vercel.app

**Stack:** React 19 + Vite (frontend) · Express 5 (API) · React Router · Lucide icons

## Features

- **Home** – hero with trip search, popular destinations, featured packages, unexplored escapes, testimonials
- **Trips** – filter by destination, type and duration, search and sort (filters live in the URL)
- **Trip details** – gallery with lightbox, day-by-day itinerary, inclusions/exclusions, price breakdown, live price calculator
- **Unexplored escapes** – offbeat nature spots with best season, best view, nature notes and an expert tip
- **Booking request & enquiry forms** – validated on the client and the server; the server recalculates the price
- **About, Contact (FAQ), 404** – fully responsive, keyboard and screen-reader friendly

## Getting started

```bash
npm install
npm run dev
```

`npm run dev` starts the Express API on **http://localhost:4000** and the Vite dev server (it prints its own URL — usually
`http://localhost:5173`, or the next free port). Vite proxies `/api` to Express.

| Script | What it does |
| --- | --- |
| `npm run dev` | API + Vite dev server together |
| `npm run build` | Production build into `dist/` |
| `npm start` | Express serves the API **and** the built site on `:4000` |
| `npm run lint` | ESLint |

## Project structure

```
api/            Vercel serverless entry (re-exports the Express app)
server/         Express app: routes, data (trips, destinations, gems, testimonials), storage helper
src/            React app: pages, components, styles, hooks, utils
```

Trips, destinations and unexplored spots live in `server/data/`. Business details (phone, email, address) live in
`src/config/site.js`.

## API

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/trips` | list; `?featured=true`, `?destination=`, `?limit=` |
| GET | `/api/trips/:slug` | full detail with itinerary, price breakdown and upcoming departures |
| GET | `/api/destinations` | with trip counts |
| GET | `/api/gems` | unexplored spots; `?featured=true`, `?theme=`, `?destination=`, `?trip=` |
| GET | `/api/testimonials` | |
| POST | `/api/enquiries` | contact/enquiry form |
| POST | `/api/bookings` | booking request (no payment is taken) |

## Where submissions go

Enquiries and bookings are saved by `server/lib/store.js`, which picks a destination automatically:

1. **Postgres (Neon)** whenever `DATABASE_URL` is set — this is what production on Vercel uses. The `submissions` table
   is created on first use.
2. **Function logs** on Vercel if no database is connected.
3. **`server/storage/*.json`** on a developer machine (git-ignored).

To read what has come in:

```bash
vercel env pull .env.local        # once — downloads DATABASE_URL (git-ignored)
npm run submissions               # all, newest first
npm run submissions -- bookings   # or: enquiries
```

You can also browse the table in the Neon console via the Vercel dashboard → Storage.

### Email alerts

`server/lib/notify.js` emails your team on every new booking request and enquiry (via [Resend](https://resend.com)).
The customer's address is set as `Reply-To`, so replying goes straight to them. A failed email never fails the booking.
It is switched on by these Vercel environment variables (alerts are skipped if the first two are missing):

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | added automatically by the Resend integration |
| `ALERT_EMAIL_TO` | who receives alerts — one address or a comma-separated list |
| `ALERT_EMAIL_FROM` | optional sender, default `Travel With Dreams <onboarding@resend.dev>` |

Until you verify your own domain in Resend, it only delivers to the email address of your Resend account.

## Deploying to Vercel

The repo is set up for zero-config deploys: Vercel builds the Vite app to `dist/` and runs `api/index.js` as the API.
`vercel.json` rewrites `/api/*` to the function and every other path to `index.html` (client-side routing).

The Vercel project is connected to this GitHub repo, so every push to `main` deploys to production automatically.
To deploy manually:

```bash
npx vercel          # preview deploy
npx vercel --prod   # production deploy
```

## Replace before launch

- Photos are hot-linked from Unsplash and are illustrative — use your own photography.
- Contact details in `src/config/site.js` are placeholders.
- Sample testimonials (`server/data/testimonials.js`), About-page copy, trip prices/itineraries, and the unexplored-spot
  copy and expert tips (`server/data/gems.js`) are drafts — have your team review them.
