/**
 * Slug helpers (design §13). `slugify` produces a URL-safe slug matching
 * `^[a-z0-9]+(?:-[a-z0-9]+)*$`; `uniqueSlug` appends `-2`, `-3`, … when the
 * base collides with an existing set (uniqueness checked on save, §13).
 */
export function slugify(input: string): string {
  return (input ?? "")
    .toString()
    .normalize("NFKD")
    // strip accents/diacritics
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    // non-alphanumeric → hyphen
    .replace(/[^a-z0-9]+/g, "-")
    // collapse and trim hyphens
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/**
 * Returns a slug derived from `desired` (or `fallback` when `desired` is blank)
 * that does not collide with `existing`. On conflict it appends `-2`, `-3`, ….
 */
export function uniqueSlug(
  desired: string,
  existing: Iterable<string>,
  fallback = "item",
): string {
  const taken = new Set(existing);
  const base = slugify(desired) || slugify(fallback) || "item";
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}
