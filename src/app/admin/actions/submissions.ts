"use server";

import type { SubmissionStatus } from "@/lib/types";
import { updateSubmissionStatus } from "@/lib/airtable/write";
import { adminWrite } from "@/lib/admin/mutate";
import type { AdminFormState } from "@/lib/admin/result";

/**
 * ContactSubmissions triage (design §5.15/§12). No create/delete — only the
 * status moves between New / Read / Archived. Submissions are not public, so
 * there is no cache tag to revalidate; the admin list reads live (no-store).
 */
const STATUSES: SubmissionStatus[] = ["New", "Read", "Archived"];

export async function setSubmissionStatusAction(
  id: string,
  status: string,
): Promise<AdminFormState> {
  if (!STATUSES.includes(status as SubmissionStatus)) {
    return { ok: false, code: "validation", message: "Invalid status." };
  }
  return adminWrite({
    write: () => updateSubmissionStatus(id, status as SubmissionStatus),
    tags: [],
  });
}
