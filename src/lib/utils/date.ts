/**
 * Human date formatting (design §11). Formats an ISO date string as e.g.
 * "Jan 15, 2024" using a fixed UTC locale so server and client render the same
 * string (no hydration mismatch). Returns "" for an unparseable value.
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return "";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(ts));
}
