/** Shared types for pantry expense dashboard (approved spend only). */

export const CATEGORIES = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Bakery',
  'Pantry',
  'Frozen',
  'Snacks & Drinks',
  'Household',
  'Health & Personal Care',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export type OverviewTotals = {
  receiptCount: number;
  totalPaidCents: number;
  minDate: string | null;
  maxDate: string | null;
  currency: string;
};

export type CategorySpend = {
  category: string;
  totalCents: number;
  itemCount: number;
};

export type MerchantSpend = {
  merchant: string;
  receiptCount: number;
  totalCents: number;
};

export type OverviewResponse = {
  totals: OverviewTotals;
  byCategory: CategorySpend[];
  byMerchant: MerchantSpend[];
};

export type ReceiptListItem = {
  id: string;
  merchant: string;
  receiptDate: string | null;
  currency: string;
  actualPaidCents: number;
  itemCount: number;
};

export type ReceiptItem = {
  id: string;
  lineNumber: number;
  description: string;
  category: string;
  quantity: number | null;
  lineTotalCents: number;
};

export type ReceiptDetail = {
  id: string;
  merchant: string;
  receiptDate: string | null;
  receiptTime: string | null;
  currency: string;
  actualPaidCents: number;
  paymentMethod: string | null;
  items: ReceiptItem[];
};
