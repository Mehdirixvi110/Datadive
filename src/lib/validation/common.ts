import { z } from "zod";

/**
 * Shared Zod building blocks (design §13). These rules are the single source of
 * truth for every external-input check — reused by the contact form, the
 * settings form, and every per-entity admin schema. All run server-side before
 * any Airtable write; the same schemas back client-side UX.
 */

export const MAX_URL = 2048;

/** Same-origin root-relative asset path, e.g. `/seed/project.png`. */
const SAME_ORIGIN_PATH = /^\/[\w\-./]+$/;
/** Allowed Vercel Blob host suffix. */
const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

/** True for a same-origin path OR an https Blob URL (design §13 image rule). */
export function isAllowedImageUrl(value: string): boolean {
  if (value.length === 0 || value.length > MAX_URL) return false;
  if (SAME_ORIGIN_PATH.test(value)) return true;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && u.hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

/**
 * Image-URL field: a same-origin asset path OR an https Blob URL, ≤2048 chars.
 * Any other host is rejected so every stored image renders through next/image.
 */
export const imageUrlSchema = z
  .string()
  .max(MAX_URL, "URL too long")
  .refine(isAllowedImageUrl, {
    message:
      "Must be a /relative asset path or an https://*.public.blob.vercel-storage.com URL",
  });

/** Optional image URL — empty string allowed (field cleared). */
export const optionalImageUrlSchema = z
  .string()
  .max(MAX_URL, "URL too long")
  .refine((v) => v.length === 0 || isAllowedImageUrl(v), {
    message:
      "Must be empty, a /relative asset path, or an https://*.public.blob.vercel-storage.com URL",
  });

/** href field: in-page anchor, root-relative path, or absolute http(s) URL. */
const HREF_RE = /^(#[\w-]+|\/[\w\-/]*|https?:\/\/[^\s]+)$/;
export const hrefSchema = z
  .string()
  .max(MAX_URL, "URL too long")
  .regex(HREF_RE, "Must be an #anchor, /relative path, or http(s) URL");

/** Optional href — empty string allowed. */
export const optionalHrefSchema = z
  .string()
  .max(MAX_URL, "URL too long")
  .refine((v) => v.length === 0 || HREF_RE.test(v), {
    message: "Must be empty, an #anchor, a /relative path, or an http(s) URL",
  });

/** Generic external URL (non-image): http(s) only, ≤2048. NOT host-restricted. */
export const httpUrlSchema = z
  .string()
  .url("Must be a valid URL")
  .max(MAX_URL, "URL too long")
  .refine((v) => /^https?:\/\//.test(v), { message: "Must be an http(s) URL" });

/** Optional external URL — empty string allowed. */
export const optionalHttpUrlSchema = z
  .string()
  .max(MAX_URL, "URL too long")
  .refine((v) => v.length === 0 || /^https?:\/\/[^\s]+$/.test(v), {
    message: "Must be empty or an http(s) URL",
  });

/** URL-safe slug. */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const slugSchema = z
  .string()
  .min(1, "Required")
  .max(200, "Too long")
  .regex(SLUG_RE, "Lowercase letters, numbers, and single hyphens only");

/**
 * Optional slug — empty string allowed. A blank slug is auto-generated from the
 * title/name when the record is saved and made unique on conflict (design §13).
 */
export const optionalSlugSchema = z
  .string()
  .max(200, "Too long")
  .refine((v) => v.length === 0 || SLUG_RE.test(v), {
    message: "Lowercase letters, numbers, and single hyphens only",
  });

export const altSchema = z.string().max(200, "Alt text too long");

export const orderSchema = z.number().int("Must be an integer").min(0, "Must be ≥ 0");

export const ratingSchema = z
  .number()
  .int("Must be an integer")
  .min(1, "Min 1")
  .max(5, "Max 5");

export const shortTextSchema = z.string().max(200, "Too long");
export const longTextSchema = z.string().max(20000, "Too long");
export const titleSchema = z.string().min(1, "Required").max(200, "Too long");
export const accentSchema = z.enum(["blue", "amber", "green", "red"]);
export const emailSchema = z.string().email("Invalid email").max(254, "Too long");
export const isoDateSchema = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid date" });

/**
 * Cross-field rule: when a paired image URL is present, its alt text is
 * required (design §13). Apply with `.superRefine` on an entity schema.
 */
export function requireAltWhenUrl(
  urlField: string,
  altField: string,
): (data: Record<string, unknown>, ctx: z.RefinementCtx) => void {
  return (data, ctx) => {
    const url = data[urlField];
    const alt = data[altField];
    if (typeof url === "string" && url.length > 0 && !(typeof alt === "string" && alt.trim().length > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [altField],
        message: "Alt text is required when an image is set",
      });
    }
  };
}

/** Strip a WhatsApp-style number to digits (design §13 settings rule). */
export function normalizeWhatsapp(value: string): string {
  return (value ?? "").replace(/\D/g, "");
}
