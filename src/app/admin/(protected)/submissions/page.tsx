import { Badge, Card } from "@/components/ui";
import { SubmissionTriage } from "@/components/admin/SubmissionTriage";
import { getSubmissions } from "@/lib/airtable/read";
import { hasAirtableCreds } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";

/**
 * Contact submissions triage (design §5.15/§12). Read-only list with a status
 * control — no create. Submissions exist only in live Airtable, so the no-creds
 * mode shows an empty state (there is no seed inbox).
 */
export const dynamic = "force-dynamic";

const STATUS_TONE = {
  New: "amber",
  Read: "brand",
  Archived: "neutral",
} as const;

function cut(value: string, max = 160): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export default async function SubmissionsPage() {
  const editable = hasAirtableCreds();
  const submissions = editable ? await getSubmissions() : [];

  return (
    <div className="space-y-6">
      <h1 className="text-h2 font-semibold text-text">Submissions</h1>

      {!editable ? (
        <div className="rounded-lg border border-accent-amber/40 bg-accent-amber/10 px-4 py-3 text-small text-text">
          Content backend not configured — connect Airtable
          (<code>AIRTABLE_API_KEY</code> + <code>AIRTABLE_BASE_ID</code>) to
          receive and triage contact submissions.
        </div>
      ) : null}

      {submissions.length === 0 ? (
        <Card className="text-muted">No submissions yet.</Card>
      ) : (
        <ul className="space-y-3">
          {submissions.map((s) => (
            <li key={s.id}>
              <Card className="space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-text">
                    {s.name}{" "}
                    <span className="font-normal text-muted">· {s.email}</span>
                  </p>
                  <p className="text-small text-muted">
                    {s.subject ? `${s.subject} · ` : ""}
                    {s.submittedAt ? formatDate(s.submittedAt) : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={STATUS_TONE[s.status]}>{s.status}</Badge>
                  <SubmissionTriage id={s.id} status={s.status} disabled={!editable} />
                </div>
              </div>
              <p className="text-body text-text">{cut(s.message)}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
