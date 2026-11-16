import type { ZodError } from "zod";

/**
 * Shared admin server-action result (design §12/§14). Every mutating admin
 * action returns this typed shape so the client `EntityForm`/`EntityTable` can
 * render field errors, the degraded "content backend not configured" banner,
 * or a success toast uniformly. Pure module (no server-only imports) so both
 * the server actions and the client admin UI can share the type.
 */
export type AdminErrorCode = "unauthorized" | "validation" | "no-backend" | "error";

export type AdminFormState =
  | { ok: true; message?: string }
  | {
      ok: false;
      code: AdminErrorCode;
      message?: string;
      fieldErrors?: Record<string, string>;
    };

/** Collapse a Zod error into one message per top-level field. */
export function toFieldErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }
  return fieldErrors;
}
