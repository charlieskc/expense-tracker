import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load dashboard/.env (never committed)
config({ path: resolve(__dirname, '../.env') });

/** Allowed Neon project only — never production pantry-ledger. */
const ALLOWED_MARKERS = ['noisy-wind-96288646', 'pantry-ledger-grok'] as const;
const BLOCKED_MARKERS = ['royal-darkness-06669792'] as const;

/**
 * Neon connection hosts are often endpoint ids (ep-…) and omit the project id.
 * pantry-ledger-grok uses proxy_host c-4.ap-southeast-1.aws.neon.tech;
 * production pantry-ledger uses c-2.us-east-2.aws.neon.tech.
 */
const ALLOWED_HOST_SUFFIXES = ['c-4.ap-southeast-1.aws.neon.tech'] as const;
const BLOCKED_HOST_SUFFIXES = ['c-2.us-east-2.aws.neon.tech'] as const;

function hostnameOf(databaseUrl: string): string {
  try {
    // URL parser wants a web scheme; postgres URLs share the same authority form.
    return new URL(databaseUrl.replace(/^postgres(ql)?:/i, 'https:')).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function projectHaystack(databaseUrl: string): string {
  return [
    databaseUrl,
    process.env.NEON_PROJECT ?? '',
    process.env.NEON_PROJECT_ID ?? '',
  ]
    .join('\n')
    .toLowerCase();
}

/**
 * Refuse DATABASE_URL that targets prod Neon (pantry-ledger / royal-darkness-06669792).
 * Allow only pantry-ledger-grok / noisy-wind-96288646 via:
 * - substring in URL or NEON_PROJECT / NEON_PROJECT_ID, or
 * - known grok proxy host suffix.
 */
export function assertAllowedDatabaseUrl(url: string): void {
  const haystack = projectHaystack(url);
  const host = hostnameOf(url);

  for (const blocked of BLOCKED_MARKERS) {
    if (haystack.includes(blocked)) {
      throw new Error(
        `Refusing to start: DATABASE_URL points at blocked Neon project (${blocked}). Use pantry-ledger-grok / noisy-wind-96288646 only.`,
      );
    }
  }

  for (const suffix of BLOCKED_HOST_SUFFIXES) {
    if (host === suffix || host.endsWith(`.${suffix}`) || host.endsWith(suffix)) {
      throw new Error(
        'Refusing to start: DATABASE_URL host matches production Neon pantry-ledger. Use pantry-ledger-grok / noisy-wind-96288646 only.',
      );
    }
  }

  // Bare project name "pantry-ledger" without "-grok" is production.
  if (haystack.includes('pantry-ledger') && !haystack.includes('pantry-ledger-grok')) {
    throw new Error(
      'Refusing to start: DATABASE_URL points at production Neon project pantry-ledger. Use pantry-ledger-grok / noisy-wind-96288646 only.',
    );
  }

  const markerAllowed = ALLOWED_MARKERS.some((m) => haystack.includes(m));
  const hostAllowed = ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`) || host.endsWith(suffix),
  );

  if (!markerAllowed && !hostAllowed) {
    throw new Error(
      'Refusing to start: DATABASE_URL must target pantry-ledger-grok / noisy-wind-96288646 only (match project id/name in the URL or NEON_PROJECT, or the grok proxy host).',
    );
  }
}

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env and add the Neon connection string (pantry-ledger-grok / noisy-wind-96288646 only).',
    );
  }
  assertAllowedDatabaseUrl(url);
  return neon(url);
}
