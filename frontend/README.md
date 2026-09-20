# Sentinel Verification — Frontend

React / Next.js / TypeScript frontend for the Sentinel Verification Node ("Fact Proofing Without Records"): a merchant terminal and a citizen app, talking to the Express verifier in `../src`.

## Routes

- `/terminal` — merchant-facing verification terminal (real-time VERIFIED/REJECTED states, QR handoff, Day-4 attack demo).
- `/citizen` — citizen app view (selective-disclosure approval + demo credential).

## Running locally

Two servers, in two terminals, from the repo root:

```bash
# Terminal A — backend (port 3000)
npx tsx src/server.ts

# Terminal B — frontend (port 3001 by default)
cd frontend
npm run dev
```

Open `http://localhost:3001`. The frontend never calls the backend cross-origin — `next.config.ts` proxies same-origin `/api/v1/*` requests to `BACKEND_URL` (see `.env.local.example`) server-side, so no CORS setup is needed on the backend.

The merchant terminal and citizen app talk to each other via a same-origin, browser-local channel (no real-time backend transport yet) — open `/terminal` and `/citizen` in two tabs of the same browser to run a full demo.

## Commands

```bash
npm run dev     # start dev server
npm run build   # production build
npm run lint    # eslint
npx tsc --noEmit  # typecheck
```
