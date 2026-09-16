/**
 * Smoke test: runs the three main SELECTs against DATABASE_URL.
 * Skips gracefully if DATABASE_URL is missing.
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';

config({ path: resolve(__dirname, '../.env') });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log('SKIP: DATABASE_URL not set — copy .env.example to .env to run smoke.');
    process.exit(0);
  }

  const sql = neon(url);
  console.log('Smoke against grok_pantry (approved only)…');

  const totals = await sql`
    SELECT
      COUNT(*)::int AS receipt_count,
      COALESCE(SUM(actual_paid_cents), 0)::bigint AS total_paid_cents,
      MIN(receipt_date)::text AS min_date,
      MAX(receipt_date)::text AS max_date
    FROM grok_pantry.receipts
    WHERE status = 'approved'
  `;
  console.log('1) Overview totals:', totals[0]);

  const categories = await sql`
    SELECT
      COALESCE(ri.category, 'Other') AS category,
      COALESCE(SUM(ri.line_total_cents), 0)::bigint AS total_cents,
      COUNT(*)::int AS item_count
    FROM grok_pantry.receipt_items ri
    JOIN grok_pantry.receipts r ON r.id = ri.receipt_id
    WHERE r.status = 'approved'
    GROUP BY 1
    ORDER BY total_cents DESC
  `;
  console.log('2) Category rollup rows:', categories.length, 'top:', categories[0]);

  const receipts = await sql`
    SELECT
      r.id::text AS id,
      r.merchant,
      r.receipt_date::text AS receipt_date,
      COALESCE(r.actual_paid_cents, 0)::int AS actual_paid_cents
    FROM grok_pantry.receipts r
    WHERE r.status = 'approved'
    ORDER BY r.receipt_date DESC NULLS LAST
    LIMIT 5
  `;
  console.log('3) Receipt list sample:', receipts.length, 'first:', receipts[0]);

  const paid = Number(totals[0]?.total_paid_cents ?? 0);
  const count = Number(totals[0]?.receipt_count ?? 0);
  if (count < 1) {
    console.error('FAIL: expected approved receipts');
    process.exit(1);
  }
  console.log(`OK: ${count} approved receipts, total paid cents=${paid} (HK$${(paid / 100).toFixed(2)})`);
}

main().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});
