import type {
  CategorySpend,
  MerchantSpend,
  OverviewResponse,
  OverviewTotals,
  ReceiptDetail,
  ReceiptItem,
  ReceiptListItem,
} from '../lib/types';
import { getSql } from './db';

function num(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v) || 0;
  if (v == null) return 0;
  return Number(v) || 0;
}

export async function getOverview(): Promise<OverviewResponse> {
  const sql = getSql();

  const totalsRows = await sql`
    SELECT
      COUNT(*)::int AS receipt_count,
      COALESCE(SUM(actual_paid_cents), 0)::bigint AS total_paid_cents,
      MIN(receipt_date)::text AS min_date,
      MAX(receipt_date)::text AS max_date
    FROM grok_pantry.receipts
    WHERE status = 'approved'
  `;

  const t = totalsRows[0] ?? {};
  const totals: OverviewTotals = {
    receiptCount: num(t.receipt_count),
    totalPaidCents: num(t.total_paid_cents),
    minDate: (t.min_date as string) ?? null,
    maxDate: (t.max_date as string) ?? null,
    currency: 'HKD',
  };

  const categoryRows = await sql`
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

  const byCategory: CategorySpend[] = categoryRows.map((row) => ({
    category: String(row.category ?? 'Other'),
    totalCents: num(row.total_cents),
    itemCount: num(row.item_count),
  }));

  const merchantRows = await sql`
    SELECT
      COALESCE(merchant, 'Unknown') AS merchant,
      COUNT(*)::int AS receipt_count,
      COALESCE(SUM(actual_paid_cents), 0)::bigint AS total_cents
    FROM grok_pantry.receipts
    WHERE status = 'approved'
    GROUP BY 1
    ORDER BY total_cents DESC
    LIMIT 15
  `;

  const byMerchant: MerchantSpend[] = merchantRows.map((row) => ({
    merchant: String(row.merchant ?? 'Unknown'),
    receiptCount: num(row.receipt_count),
    totalCents: num(row.total_cents),
  }));

  return { totals, byCategory, byMerchant };
}

/** Default / max page size for receipt list (prevents unbounded scans). */
export const RECEIPT_LIST_DEFAULT_LIMIT = 100;
export const RECEIPT_LIST_MAX_LIMIT = 500;

function clampReceiptLimit(raw?: number): number {
  if (raw == null || !Number.isFinite(raw)) return RECEIPT_LIST_DEFAULT_LIMIT;
  const n = Math.trunc(raw);
  if (n < 1) return RECEIPT_LIST_DEFAULT_LIMIT;
  return Math.min(n, RECEIPT_LIST_MAX_LIMIT);
}

export async function listReceipts(opts: {
  merchant?: string;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<ReceiptListItem[]> {
  const sql = getSql();
  const merchant = opts.merchant?.trim() || null;
  const from = opts.from || null;
  const to = opts.to || null;
  const limit = clampReceiptLimit(opts.limit);

  const rows = await sql`
    SELECT
      r.id::text AS id,
      COALESCE(r.merchant, 'Unknown') AS merchant,
      r.receipt_date::text AS receipt_date,
      COALESCE(r.currency, 'HKD') AS currency,
      COALESCE(r.actual_paid_cents, 0)::int AS actual_paid_cents,
      (
        SELECT COUNT(*)::int
        FROM grok_pantry.receipt_items i
        WHERE i.receipt_id = r.id
      ) AS item_count
    FROM grok_pantry.receipts r
    WHERE r.status = 'approved'
      AND (${merchant}::text IS NULL OR r.merchant ILIKE '%' || ${merchant} || '%')
      AND (${from}::date IS NULL OR r.receipt_date >= ${from}::date)
      AND (${to}::date IS NULL OR r.receipt_date <= ${to}::date)
    ORDER BY r.receipt_date DESC NULLS LAST, r.merchant ASC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    id: String(row.id),
    merchant: String(row.merchant),
    receiptDate: (row.receipt_date as string) ?? null,
    currency: String(row.currency ?? 'HKD'),
    actualPaidCents: num(row.actual_paid_cents),
    itemCount: num(row.item_count),
  }));
}

export async function getReceipt(id: string): Promise<ReceiptDetail | null> {
  const sql = getSql();

  const headerRows = await sql`
    SELECT
      r.id::text AS id,
      COALESCE(r.merchant, 'Unknown') AS merchant,
      r.receipt_date::text AS receipt_date,
      r.receipt_time::text AS receipt_time,
      COALESCE(r.currency, 'HKD') AS currency,
      COALESCE(r.actual_paid_cents, 0)::int AS actual_paid_cents,
      r.payment_method
    FROM grok_pantry.receipts r
    WHERE r.id = ${id}::uuid
      AND r.status = 'approved'
    LIMIT 1
  `;

  if (!headerRows.length) return null;
  const h = headerRows[0];

  const itemRows = await sql`
    SELECT
      i.id::text AS id,
      i.line_number,
      COALESCE(i.description, '') AS description,
      COALESCE(i.category, 'Other') AS category,
      i.quantity,
      COALESCE(i.line_total_cents, 0)::int AS line_total_cents
    FROM grok_pantry.receipt_items i
    WHERE i.receipt_id = ${id}::uuid
    ORDER BY i.line_number ASC
  `;

  const items: ReceiptItem[] = itemRows.map((row) => ({
    id: String(row.id),
    lineNumber: num(row.line_number),
    description: String(row.description ?? ''),
    category: String(row.category ?? 'Other'),
    quantity: row.quantity == null ? null : num(row.quantity),
    lineTotalCents: num(row.line_total_cents),
  }));

  return {
    id: String(h.id),
    merchant: String(h.merchant),
    receiptDate: (h.receipt_date as string) ?? null,
    receiptTime: (h.receipt_time as string) ?? null,
    currency: String(h.currency ?? 'HKD'),
    actualPaidCents: num(h.actual_paid_cents),
    paymentMethod: (h.payment_method as string) ?? null,
    items,
  };
}
