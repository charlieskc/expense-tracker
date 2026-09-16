# VERIFICATION — Pantry Expense Dashboard MVP

For Jasmine / reviewers.

## What to prove

1. Repo builds (TypeScript).
2. Smoke SELECTs return approved spend from `grok_pantry` when `DATABASE_URL` is set.
3. API serves overview / receipts / detail without exposing `DATABASE_URL` to the client.
4. No secrets in git (`.env` gitignored; only `.env.example` with `DATABASE_URL=`).

## Steps

```bash
cd dashboard
cp .env.example .env   # set DATABASE_URL to pantry-ledger-grok only
npm install
npm run typecheck
npm run smoke
npm run server &
sleep 2
curl -s http://localhost:8787/health
curl -s http://localhost:8787/api/overview | head -c 400
curl -s 'http://localhost:8787/api/receipts?merchant=Kai' | head -c 400
# pick an id from receipts, then:
# curl -s http://localhost:8787/api/receipts/<uuid>
```

## Expected smoke signals (live snapshot may drift)

- `receipt_count` ≈ 27 approved
- `total_paid_cents` ≈ 260480 → **HK$2,604.80**
- Top categories include Snacks & Drinks, Produce, Meat & Seafood
- Top merchants include Best Mart 360°, PARKnSHOP fusion Garden Road, Kai Bo

## Security checks

- `git grep -n DATABASE_URL` should only hit `.env.example`, README, server docs — not a real password.
- Client code under `app/` and `lib/api.ts` must call the HTTP API only (no Neon import).
- No INSERT/UPDATE/DELETE against receipts tables in this MVP.
