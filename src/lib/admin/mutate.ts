import "server-only";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { withAdmin, type AdminActionError } from "@/lib/auth/require-admin";
import type { WriteResult } from "@/lib/airtable/write";
import { toFieldErrors, type AdminFormState } from "./result";

/**
 * Admin mutation plumbing (design §9/§12/§14). Each helper runs inside
 * `withAdmin()` so the action is authorized BEFORE any DAL call, re-validates
 * external input with the entity Zod schema server-side, writes through the
 * DAL, revalidates the affected cache tags, and (for create/update) redirects
 * back to the list. A thrown `AuthError` surfaces as a typed `unauthorized`
 * result; `redirect()`/`notFound()` control-flow propagates (withAdmin's narrow
 * catch). When `!hasAirtableCreds()` the DAL writer returns the typed
 * `no-backend` result and makes NO network call — surfaced here unchanged.
 */

function isAuthError(res: unknown): res is AdminActionError {
  return typeof res === "object" && res !== null && "status" in res;
}

function normalize(res: AdminFormState | AdminActionError): AdminFormState {
  if (isAuthError(res)) {
    return {
      ok: false,
      code: "unauthorized",
      message: "You are not authorized to perform this action.",
    };
  }
  return res;
}

function writeFailure(result: {
  error: "no-backend" | "airtable";
  message: string;
}): AdminFormState {
  return {
    ok: false,
    code: result.error === "no-backend" ? "no-backend" : "error",
    message: result.message,
  };
}

/** Validate → DAL write → revalidate → redirect. Used by create/update/save. */
export async function adminMutate<S extends z.ZodTypeAny>(config: {
  schema: S;
  values: unknown;
  write: (input: z.infer<S>) => Promise<WriteResult<unknown>>;
  tags: readonly string[] | ((input: z.infer<S>) => readonly string[]);
  redirectTo?: string;
}): Promise<AdminFormState> {
  const res = await withAdmin(async (): Promise<AdminFormState> => {
    const parsed = config.schema.safeParse(config.values);
    if (!parsed.success) {
      return {
        ok: false,
        code: "validation",
        fieldErrors: toFieldErrors(parsed.error),
      };
    }
    const result = await config.write(parsed.data);
    if (!result.ok) return writeFailure(result);

    const tags =
      typeof config.tags === "function" ? config.tags(parsed.data) : config.tags;
    for (const tag of tags) revalidateTag(tag);

    if (config.redirectTo) redirect(config.redirectTo);
    return { ok: true, message: "Saved." };
  });
  return normalize(res);
}

/** DAL write with no schema (delete/reorder/status) → revalidate. */
export async function adminWrite(config: {
  write: () => Promise<WriteResult<unknown>>;
  tags: readonly string[];
  redirectTo?: string;
}): Promise<AdminFormState> {
  const res = await withAdmin(async (): Promise<AdminFormState> => {
    const result = await config.write();
    if (!result.ok) return writeFailure(result);

    for (const tag of config.tags) revalidateTag(tag);

    if (config.redirectTo) redirect(config.redirectTo);
    return { ok: true, message: "Done." };
  });
  return normalize(res);
}
