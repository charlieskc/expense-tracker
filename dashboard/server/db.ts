import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load dashboard/.env (never committed)
config({ path: resolve(__dirname, '../.env') });

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env and add the Neon connection string (pantry-ledger-grok / noisy-wind-96288646 only).',
    );
  }
  return neon(url);
}
