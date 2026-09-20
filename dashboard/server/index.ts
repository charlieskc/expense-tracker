/**
 * Read-only pantry API. DATABASE_URL stays on the server — never shipped to the client.
 * Neon project: pantry-ledger-grok (noisy-wind-96288646), schema grok_pantry.
 * Listens on 127.0.0.1 only.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { assertAllowedDatabaseUrl } from './db';
import { getOverview, getReceipt, listReceipts } from './queries';

const PORT = Number(process.env.PORT || 8787);
const HOST = '127.0.0.1';

function cors(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function sendText(res: ServerResponse, status: number, text: string) {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(text);
}

function readUrl(req: IncomingMessage): URL {
  return new URL(req.url || '/', `http://${HOST}:${PORT}`);
}

function parseLimit(raw: string | null): number | undefined {
  if (raw == null || raw === '') return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) return undefined;
  return Math.trunc(n);
}

async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    cors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    sendText(res, 405, 'Method Not Allowed');
    return;
  }

  const url = readUrl(req);
  const path = url.pathname;

  try {
    if (path === '/health') {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (path === '/api/overview') {
      const data = await getOverview();
      sendJson(res, 200, data);
      return;
    }

    if (path === '/api/receipts') {
      const data = await listReceipts({
        merchant: url.searchParams.get('merchant') || undefined,
        from: url.searchParams.get('from') || undefined,
        to: url.searchParams.get('to') || undefined,
        limit: parseLimit(url.searchParams.get('limit')),
      });
      sendJson(res, 200, data);
      return;
    }

    const detailMatch = path.match(/^\/api\/receipts\/([0-9a-fA-F-]{36})$/);
    if (detailMatch) {
      const detail = await getReceipt(detailMatch[1]);
      if (!detail) {
        sendJson(res, 404, { error: 'Receipt not found or not approved' });
        return;
      }
      sendJson(res, 200, detail);
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api]', message);
    // Never return internal error details to clients
    sendJson(res, 500, { error: 'Internal server error' });
  }
}

// Fail fast if DATABASE_URL is missing or points at prod
const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) {
  assertAllowedDatabaseUrl(databaseUrl);
} else {
  // Load via db side-effect path happens on first query; still warn at boot
  console.warn(
    '[api] DATABASE_URL not set yet — set dashboard/.env before serving data routes.',
  );
}

createServer(handler).listen(PORT, HOST, () => {
  console.log(`Pantry API listening on http://${HOST}:${PORT}`);
  console.log('Routes: GET /health /api/overview /api/receipts /api/receipts/:id');
});
