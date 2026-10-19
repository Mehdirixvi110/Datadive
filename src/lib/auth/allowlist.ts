/**
 * Admin allowlist — pure, Edge-safe string logic (design §9). Shared by the
 * NextAuth `signIn` callback (src/lib/auth/config.ts) and the admin guards
 * (src/lib/auth/require-admin.ts) so the allowlist is enforced twice (defense
 * in depth, FR-18.3/18.4). `ADMIN_EMAILS` is read at call time so revoking an
 * email takes effect on the very next request without waiting for the JWT to
 * expire (FR-18.5). No Node-only imports — safe to pull into the Edge config.
 */

/** Parse `ADMIN_EMAILS` (comma-separated) into trimmed, lowercased entries. */
export function parseAdminEmails(raw = process.env.ADMIN_EMAILS): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

/** True when `email` (case-insensitive) is in the current `ADMIN_EMAILS`. */
export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return parseAdminEmails().includes(normalized);
}
