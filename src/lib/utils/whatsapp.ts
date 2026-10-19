/**
 * wa.me link builder (design §11, FR-13). Strips the stored number to digits
 * and appends an optional URL-encoded prefill message. Returns null when no
 * usable number is present, so callers hide the WhatsApp button entirely
 * rather than linking somewhere wrong (FR-13.4).
 */
export function buildWaMeUrl(
  rawNumber: string | null | undefined,
  prefill?: string | null,
): string | null {
  const digits = (rawNumber ?? "").replace(/\D/g, "");
  if (digits.length === 0) return null;
  const base = `https://wa.me/${digits}`;
  const text = (prefill ?? "").trim();
  if (text.length === 0) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}
