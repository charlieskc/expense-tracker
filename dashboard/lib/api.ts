import type { OverviewResponse, ReceiptDetail, ReceiptListItem } from './types';

const DEFAULT_API = 'http://localhost:8787';

export function getApiBase(): string {
  return (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API).replace(/\/$/, '');
}

async function getJson<T>(path: string): Promise<T> {
  const url = `${getApiBase()}${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status} ${path}: ${body || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function fetchOverview(): Promise<OverviewResponse> {
  return getJson('/api/overview');
}

export function fetchReceipts(params?: {
  merchant?: string;
  from?: string;
  to?: string;
}): Promise<ReceiptListItem[]> {
  const q = new URLSearchParams();
  if (params?.merchant) q.set('merchant', params.merchant);
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  const qs = q.toString();
  return getJson(`/api/receipts${qs ? `?${qs}` : ''}`);
}

export function fetchReceipt(id: string): Promise<ReceiptDetail> {
  return getJson(`/api/receipts/${encodeURIComponent(id)}`);
}
