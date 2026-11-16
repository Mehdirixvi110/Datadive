"use server";

import { headers } from "next/headers";
import { contactSchema } from "@/lib/validation/contact";
import { createContactSubmission } from "@/lib/airtable/write";
import { logger } from "@/lib/utils";

/**
 * `submitContact` server action (design §11/§13/§14, FR-12).
 *
 * Flow: server-side Zod validate → honeypot silent-drop (looks like success,
 * no write) → per-IP in-memory token-bucket rate limit (≤5/min, friendly 429)
 * → `createContactSubmission` → success/error result. A best-effort email
 * notification fires only when RESEND_API_KEY + CONTACT_NOTIFY_TO are set and
 * never fails the submission. No secrets or PII appear in client-visible
 * errors; values are preserved client-side on any non-success result.
 *
 * Documented limitation (FR-12.5): the rate limiter is in-memory and therefore
 * per-instance — the honeypot is the primary spam defense.
 */
export interface ContactValues {
  name: string;
  email: string;
  company?: string;
  subject?: string;
  phone?: string;
  message: string;
  /** Honeypot — must be empty for a human. */
  website?: string;
}

export type ContactResult =
  | { ok: true }
  | { ok: false; code: "validation"; fieldErrors: Record<string, string> }
  | { ok: false; code: "rate-limit"; message: string }
  | { ok: false; code: "error"; message: string };

// --- Per-IP token bucket (cap 5 / minute) -----------------------------------

const RATE_CAP = 5;
const RATE_WINDOW_MS = 60_000;

interface Bucket {
  tokens: number;
  updated: number;
}

const buckets = new Map<string, Bucket>();

function rateLimitOk(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: RATE_CAP, updated: now };
  const elapsed = now - bucket.updated;
  bucket.tokens = Math.min(
    RATE_CAP,
    bucket.tokens + (elapsed / RATE_WINDOW_MS) * RATE_CAP,
  );
  bucket.updated = now;
  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    return false;
  }
  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return true;
}

async function clientIp(): Promise<string> {
  try {
    const h = await headers();
    const fwd = h.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0]!.trim() || "unknown";
    const real = h.get("x-real-ip");
    if (real) return real.trim() || "unknown";
  } catch {
    // headers() unavailable (e.g. tests) — fall through.
  }
  return "unknown";
}

async function sourcePath(): Promise<string> {
  try {
    const h = await headers();
    return h.get("referer") ?? "";
  } catch {
    return "";
  }
}

async function notify(values: {
  name: string;
  email: string;
  company: string;
  subject: string;
  phone: string;
  message: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_NOTIFY_TO;
  if (!apiKey || !to) return;

  try {
    const lines = [
      `Name: ${values.name}`,
      `Email: ${values.email}`,
      values.company ? `Company: ${values.company}` : null,
      values.phone ? `Phone: ${values.phone}` : null,
      values.subject ? `Subject: ${values.subject}` : null,
      "",
      values.message,
    ]
      .filter((l) => l !== null)
      .join("\n");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Datadive <onboarding@resend.dev>",
        to: [to],
        reply_to: values.email,
        subject: `New contact: ${values.subject || values.name}`,
        text: lines,
      }),
    });
    if (!res.ok) {
      logger.error("contact notify failed", { status: res.status });
    }
  } catch (err) {
    // Best-effort only — a notification failure never fails the submission.
    logger.error("contact notify error", { err: String(err) });
  }
}

export async function submitContact(
  values: ContactValues,
): Promise<ContactResult> {
  // 1. Honeypot — silently accept (looks successful) but drop + log as spam.
  if (typeof values.website === "string" && values.website.length > 0) {
    logger.warn("contact: honeypot filled — dropping submission as spam");
    return { ok: true };
  }

  // 2. Server-side Zod validation.
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return { ok: false, code: "validation", fieldErrors };
  }

  // 3. Per-IP rate limit.
  const ip = await clientIp();
  if (!rateLimitOk(ip)) {
    logger.warn("contact: rate limit exceeded");
    return {
      ok: false,
      code: "rate-limit",
      message:
        "You've sent a few messages already. Please wait a minute and try again.",
    };
  }

  // 4. Write to Airtable (honeypot field stripped).
  const { website: _honeypot, ...data } = parsed.data;
  void _honeypot;
  const result = await createContactSubmission(data, await sourcePath());
  if (!result.ok) {
    return {
      ok: false,
      code: "error",
      message:
        "Something went wrong sending your message. Please try again, or email us directly.",
    };
  }

  // 5. Best-effort notification (never blocks a successful submission).
  await notify(data);

  return { ok: true };
}
