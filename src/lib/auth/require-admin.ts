import "server-only";
import { redirect } from "next/navigation";
// `AuthError` is imported from its origin package — `next-auth` merely
// re-exports this exact class (`export { AuthError } from "@auth/core/errors"`).
// Importing it here avoids pulling the full `next-auth` request graph
// (next/server, next/headers) into this Node-only guard module.
import { AuthError } from "@auth/core/errors";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { hasAuthCreds } from "@/lib/utils";
import { isAllowedAdminEmail } from "./allowlist";

/**
 * Admin access control (design §9). Two guards over ONE shared `auth()` +
 * allowlist check, each with a context-appropriate deny behavior, plus a
 * narrow `withAdmin()` wrapper for server actions.
 *
 * Fail safe (F2): all three short-circuit on `!hasAuthCreds()` BEFORE any
 * `auth()` call, because Auth.js v5 throws `MissingSecret` lazily at request
 * time when `AUTH_SECRET` is unset — an unguarded `auth()` would turn
 * `/admin/*` into a 500 instead of a safe redirect/401.
 */

/** Error result returned by `withAdmin()` when access is denied. */
export interface AdminActionError {
  ok: false;
  status: number;
  error: string;
}

/** Typed result shape for admin server actions (success carries `data`). */
export type AdminActionResult<T = void> =
  | { ok: true; data: T }
  | AdminActionError;

/** Canonical 401 result for an unauthorized admin action. */
export const UNAUTHORIZED_RESULT: AdminActionError = {
  ok: false,
  status: 401,
  error: "Unauthorized",
};

/**
 * Shared check: returns the admin session, or `null` when access is denied.
 * Returns `null` WITHOUT calling `auth()` when creds are missing (fail safe),
 * and re-checks the allowlist on every call so revocation is immediate.
 */
async function resolveAdminSession(): Promise<Session | null> {
  if (!hasAuthCreds()) return null;
  const session = await auth();
  const email = session?.user?.email;
  if (!email || !isAllowedAdminEmail(email)) return null;
  return session;
}

/**
 * Page/layout guard — returns the session or `redirect('/admin/login')`.
 * Used by the `(protected)` admin layout and admin pages.
 */
export async function requireAdminPage(): Promise<Session> {
  const session = await resolveAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

/**
 * Action/route guard — returns the session or THROWS `AuthError`; never
 * redirects. Used by server actions via `withAdmin()` and by
 * `/api/blob/upload` (which maps the throw to a 401 Response).
 */
export async function requireAdmin(): Promise<Session> {
  const session = await resolveAdminSession();
  if (!session) throw new AuthError("Unauthorized: admin access required");
  return session;
}

/**
 * True for Next.js control-flow throws from `redirect()` / `notFound()`, whose
 * `digest` begins with `NEXT_REDIRECT` / `NEXT_NOT_FOUND`. These must NOT be
 * swallowed by `withAdmin()` or admin success navigation would break (N2).
 */
function isControlFlowError(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return (
    typeof digest === "string" &&
    (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND"))
  );
}

/**
 * Wrap a mutating admin action: run `requireAdmin()` then the action with the
 * authenticated session. The `catch` is NARROW — it maps ONLY a thrown
 * `AuthError` to the typed 401 result, RE-THROWS framework control-flow
 * (`NEXT_REDIRECT` / `NEXT_NOT_FOUND`) so success `redirect()`/`notFound()`
 * propagate, and RE-THROWS any other error unchanged (§9, N2).
 */
export async function withAdmin<T>(
  action: (session: Session) => Promise<T>,
): Promise<T | AdminActionError> {
  try {
    const session = await requireAdmin();
    return await action(session);
  } catch (error) {
    if (isControlFlowError(error)) throw error;
    if (error instanceof AuthError) return UNAUTHORIZED_RESULT;
    throw error;
  }
}
