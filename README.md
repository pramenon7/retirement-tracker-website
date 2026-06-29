# Retirement Tracker

A retirement-savings projector that goes deeper than the usual calculator: enter a
balance, a per-paycheck contribution, and a growth assumption for **every account**
(401k, 403b, IRAs, HSA, brokerage, cash, and more) and project what you'll have when
you retire — plus 5/10/15/20-year milestones and a withdrawal sustainability check.

## Stack
- React + Vite (static SPA, all math runs client-side)
- Deploys to Netlify

## Run locally
```bash
npm install
npm run dev
```
Then open the URL Vite prints (default http://localhost:5173).

## Build
```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build
```

## Deploy (Netlify)
Connect this repo in Netlify. Build settings are in `netlify.toml`
(build command `npm run build`, publish directory `dist`). No env vars needed.

## Project structure
```
src/
  config/irsLimits.js   # 2026 IRS contribution limits + helpers (update yearly here)
  lib/
    accounts.js         # account definitions grouped by category
    calculations.js     # projection engine (pure functions)
    format.js           # currency / percent formatters
  components/           # UI sections (profile, accounts, assumptions, results, methodology)
  App.jsx               # state wiring + layout
```

## Notes
- Contributions are entered **per paycheck**; the model annualizes them by the
  paycheck frequency you select.
- IRS limit warnings are advisory only (never block input). To update for a new tax
  year, edit `src/config/irsLimits.js`.
- Educational planning tool — not financial advice.
