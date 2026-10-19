import type { Stat } from "@/lib/types";

/**
 * Stat display formatting (design §5.8). When `displayOverride` is set it wins
 * verbatim (non-numeric cases, no count-up); otherwise the numeric value is
 * wrapped with its optional prefix/suffix, e.g. `150` + `K+` → `150K+`.
 */
export function formatStat(
  stat: Pick<Stat, "value" | "prefix" | "suffix" | "displayOverride">,
): string {
  const override = (stat.displayOverride ?? "").trim();
  if (override.length > 0) return override;
  const prefix = stat.prefix ?? "";
  const suffix = stat.suffix ?? "";
  return `${prefix}${stat.value}${suffix}`;
}
