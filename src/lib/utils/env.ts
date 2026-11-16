/**
 * Credential-detection helpers (design §8/§9, NFR-4). These gate whether the
 * app calls Airtable / NextAuth at all — missing creds degrade a single
 * privileged feature, never the public build or render.
 */

/** True only when BOTH Airtable secrets are present (§8). */
export function hasAirtableCreds(): boolean {
  return Boolean(process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID);
}

/**
 * True only when ALL auth secrets are present (§9). Checked before every
 * `auth()` call to avoid Auth.js v5's lazy `MissingSecret` 500.
 */
export function hasAuthCreds(): boolean {
  return Boolean(
    process.env.AUTH_SECRET &&
      process.env.AUTH_GOOGLE_ID &&
      process.env.AUTH_GOOGLE_SECRET,
  );
}

/**
 * True when the Vercel Blob write token is present (§10). When absent the admin
 * `ImageField` disables upload but still accepts a pasted, host-validated Blob
 * URL. Server-only value — passed to client admin forms as a plain boolean.
 */
export function hasBlobToken(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}
