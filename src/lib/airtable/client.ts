import "server-only";

/**
 * Raw Airtable REST client (design §6). THE single place that touches the
 * network for Airtable. `import 'server-only'` keeps it out of any client
 * bundle, and the ESLint `no-restricted-imports` rule forbids importing this
 * module (or `airtable`) anywhere outside `src/lib/airtable/**`.
 *
 * Responsibilities: PAT-bearer requests to the Airtable REST API, an
 * in-process token-bucket rate limiter (capacity 5, refill ~4/sec) with a
 * concurrency cap of 4, offset pagination for lists, 3× exponential backoff on
 * 429/5xx (base 500ms), and audience-split caching (public reads
 * `next:{revalidate:3600,tags}`; admin reads + writes `cache:'no-store'`).
 */

const API_ROOT = "https://api.airtable.com/v0";
const PAGE_SIZE = 100;
const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 500;

// --- Token-bucket rate limiter (in-process, per-instance — §6 N5) -----------
const BUCKET_CAPACITY = 5;
const REFILL_PER_SEC = 4;
const MAX_CONCURRENCY = 4;

let tokens = BUCKET_CAPACITY;
let lastRefill = Date.now();
let active = 0;
const concurrencyWaiters: Array<() => void> = [];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function refillTokens(): void {
  const now = Date.now();
  const elapsedSec = (now - lastRefill) / 1000;
  if (elapsedSec > 0) {
    tokens = Math.min(BUCKET_CAPACITY, tokens + elapsedSec * REFILL_PER_SEC);
    lastRefill = now;
  }
}

async function acquireToken(): Promise<void> {
  // Lazy refill (no interval timers). Wait only when the bucket is empty.
  for (;;) {
    refillTokens();
    if (tokens >= 1) {
      tokens -= 1;
      return;
    }
    const waitMs = Math.ceil(((1 - tokens) / REFILL_PER_SEC) * 1000);
    await sleep(Math.max(waitMs, 1));
  }
}

async function withLimit<T>(fn: () => Promise<T>): Promise<T> {
  while (active >= MAX_CONCURRENCY) {
    await new Promise<void>((resolve) => concurrencyWaiters.push(resolve));
  }
  active += 1;
  try {
    await acquireToken();
    return await fn();
  } finally {
    active -= 1;
    const next = concurrencyWaiters.shift();
    if (next) next();
  }
}

// --- Request plumbing --------------------------------------------------------

export type ReadAudience = "public" | "admin";

export interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
}

export class AirtableError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AirtableError";
    this.status = status;
  }
}

interface AirtableConfig {
  apiKey: string;
  baseId: string;
}

function requireConfig(): AirtableConfig {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) {
    // Callers gate on hasAirtableCreds() first; this is a defensive guard.
    throw new AirtableError("Airtable credentials are not configured", 0);
  }
  return { apiKey, baseId };
}

function tableUrl(baseId: string, table: string): string {
  return `${API_ROOT}/${baseId}/${encodeURIComponent(table)}`;
}

function cacheInit(audience: ReadAudience, tags: string[]): RequestInit {
  if (audience === "public") {
    return { next: { revalidate: 3600, tags } } as RequestInit;
  }
  // Admin reads are always live; no Data Cache, no tags (§6/§7, M2).
  return { cache: "no-store" };
}

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

/** Fetch with the limiter + 3× exponential backoff on 429/5xx. */
async function airtableFetch(
  url: string,
  init: RequestInit,
): Promise<Response> {
  return withLimit(async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      let res: Response;
      try {
        res = await fetch(url, init);
      } catch (err) {
        lastError = err;
        if (attempt < MAX_RETRIES) {
          await sleep(BACKOFF_BASE_MS * 2 ** attempt);
          continue;
        }
        throw new AirtableError(
          `Network error reaching Airtable: ${String(
            err instanceof Error ? err.message : err,
          )}`,
          0,
        );
      }
      if (isRetryable(res.status) && attempt < MAX_RETRIES) {
        await sleep(BACKOFF_BASE_MS * 2 ** attempt);
        continue;
      }
      return res;
    }
    // Unreachable in practice; keeps TS happy.
    throw new AirtableError(
      `Airtable request failed: ${String(lastError)}`,
      0,
    );
  });
}

async function readBody(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}

const jsonHeaders = (apiKey: string): Record<string, string> => ({
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
});

// --- Public API --------------------------------------------------------------

export interface ListOptions {
  audience: ReadAudience;
  /** Cache tags for public reads (ignored for admin reads). */
  tags?: string[];
}

/** List every record in a table, following `offset` pagination to exhaustion. */
export async function listRecords(
  table: string,
  options: ListOptions,
): Promise<AirtableRecord[]> {
  const { apiKey, baseId } = requireConfig();
  const base = tableUrl(baseId, table);
  const init: RequestInit = {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` },
    ...cacheInit(options.audience, options.tags ?? []),
  };

  const out: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const params = new URLSearchParams({ pageSize: String(PAGE_SIZE) });
    if (offset) params.set("offset", offset);
    const res = await airtableFetch(`${base}?${params.toString()}`, init);
    if (!res.ok) {
      throw new AirtableError(
        `Airtable list ${table} failed`,
        res.status,
      );
    }
    const body = (await readBody(res)) as
      | { records?: AirtableRecord[]; offset?: string }
      | undefined;
    if (body?.records) out.push(...body.records);
    offset = body?.offset;
  } while (offset);
  return out;
}

/** Fetch a single record by id. Returns null on 404. */
export async function getRecordById(
  table: string,
  id: string,
  options: ListOptions,
): Promise<AirtableRecord | null> {
  const { apiKey, baseId } = requireConfig();
  const url = `${tableUrl(baseId, table)}/${encodeURIComponent(id)}`;
  const init: RequestInit = {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` },
    ...cacheInit(options.audience, options.tags ?? []),
  };
  const res = await airtableFetch(url, init);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new AirtableError(`Airtable get ${table}/${id} failed`, res.status);
  }
  return (await readBody(res)) as AirtableRecord;
}

/** Create a record. Uncached (write). */
export async function createRecord(
  table: string,
  fields: Record<string, unknown>,
): Promise<AirtableRecord> {
  const { apiKey, baseId } = requireConfig();
  const res = await airtableFetch(tableUrl(baseId, table), {
    method: "POST",
    headers: jsonHeaders(apiKey),
    cache: "no-store",
    body: JSON.stringify({ fields, typecast: true }),
  });
  if (!res.ok) {
    throw new AirtableError(`Airtable create ${table} failed`, res.status);
  }
  return (await readBody(res)) as AirtableRecord;
}

/** Update (PATCH) a record. Uncached (write). */
export async function updateRecord(
  table: string,
  id: string,
  fields: Record<string, unknown>,
): Promise<AirtableRecord> {
  const { apiKey, baseId } = requireConfig();
  const url = `${tableUrl(baseId, table)}/${encodeURIComponent(id)}`;
  const res = await airtableFetch(url, {
    method: "PATCH",
    headers: jsonHeaders(apiKey),
    cache: "no-store",
    body: JSON.stringify({ fields, typecast: true }),
  });
  if (!res.ok) {
    throw new AirtableError(`Airtable update ${table}/${id} failed`, res.status);
  }
  return (await readBody(res)) as AirtableRecord;
}

/** Delete a record. Uncached (write). */
export async function deleteRecord(table: string, id: string): Promise<void> {
  const { apiKey, baseId } = requireConfig();
  const url = `${tableUrl(baseId, table)}/${encodeURIComponent(id)}`;
  const res = await airtableFetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new AirtableError(`Airtable delete ${table}/${id} failed`, res.status);
  }
}
