# Pantry Expense Dashboard

Read-only household grocery spend dashboard (Expo + TypeScript + Expo Router) against Neon `pantry-ledger-grok` / schema `grok_pantry`.

## Stack

- Expo SDK 57 + Expo Router (web, iOS, Android)
- Colocated read-only API (`server/`) using `@neondatabase/serverless`
- Spend = `receipts.status = 'approved'`, metric = `actual_paid_cents`, display HK$

## Hard rules

- Neon project **pantry-ledger-grok** only (`noisy-wind-96288646`). Never touch `pantry-ledger` / `royal-darkness-06669792`.
- READ ONLY — no approve/reject, no ingest, no writes.
- `DATABASE_URL` stays on the server. Never put it in client code or commit `.env`.

## Setup

```bash
cd dashboard
cp .env.example .env
# Paste Neon connection string for pantry-ledger-grok into DATABASE_URL
npm install
```

## Run

Terminal 1 — API (required for live data):

```bash
npm run server
# listens on http://localhost:8787
```

Terminal 2 — Expo:

```bash
npm start
# then press w / i / a for web / iOS / Android
```

Optional: `EXPO_PUBLIC_API_URL=http://localhost:8787` (default).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run server` | Read-only Neon API |
| `npm start` | Expo dev server |
| `npm run smoke` | Three main SELECTs against DATABASE_URL (skips if unset) |
| `npm run typecheck` | `tsc --noEmit` |

## Screens

1. **Overview** — total approved spend, date range, by category, by merchant
2. **Receipts** — approved list with merchant filter
3. **Receipt detail** — header + line items

## Out of scope

Auth, ingest/OCR, approve/reject UI, writing to production pantry-ledger.
