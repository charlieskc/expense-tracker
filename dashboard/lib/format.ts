/** Format cents as HK$x.xx (default currency HKD). */
export function formatHkd(cents: number | null | undefined): string {
  const n = typeof cents === 'number' && Number.isFinite(cents) ? cents : 0;
  const dollars = n / 100;
  return `HK$${dollars.toLocaleString('en-HK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  // receipt_date comes as YYYY-MM-DD
  const d = iso.slice(0, 10);
  return d;
}
