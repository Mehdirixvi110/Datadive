/**
 * Minimal structured logger (design §14). Standardizes `info|warn|error` and
 * guarantees that no env secret value is ever interpolated into a message —
 * known secret env values are redacted from both the message and any metadata
 * before anything reaches the console (NFR-11.6).
 */

type LogLevel = "info" | "warn" | "error";

/** Env vars whose VALUES must never appear in a log line. */
const SECRET_ENV_KEYS = [
  "AIRTABLE_API_KEY",
  "AUTH_SECRET",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "BLOB_READ_WRITE_TOKEN",
  "REVALIDATE_SECRET",
  "RESEND_API_KEY",
] as const;

function secretValues(): string[] {
  const out: string[] = [];
  for (const key of SECRET_ENV_KEYS) {
    const v = process.env[key];
    if (v && v.length >= 4) out.push(v);
  }
  return out;
}

function redactString(input: string): string {
  let out = input;
  for (const secret of secretValues()) {
    out = out.split(secret).join("[redacted]");
  }
  return out;
}

function redact(value: unknown): unknown {
  if (typeof value === "string") return redactString(value);
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = redact(v);
    }
    return out;
  }
  return value;
}

function emit(level: LogLevel, message: string, meta?: unknown): void {
  const safeMessage = redactString(message);
  const line = `[datadive] ${safeMessage}`;
  const sink =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.info;
  if (meta === undefined) sink(line);
  else sink(line, redact(meta));
}

export const logger = {
  info: (message: string, meta?: unknown) => emit("info", message, meta),
  warn: (message: string, meta?: unknown) => emit("warn", message, meta),
  error: (message: string, meta?: unknown) => emit("error", message, meta),
};
