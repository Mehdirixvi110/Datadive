/**
 * Tiny className joiner (design §16). Client-safe and dependency-free — kept in
 * its own module so client components can import it without pulling the rest of
 * `@/lib/utils` (logger/env) into the browser bundle.
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
