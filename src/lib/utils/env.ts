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
