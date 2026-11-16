import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Pill badge for tags/metrics (design §16). `tone` maps to the accent-role
 * palette; `brand` and `amber` are the emphasis tones used for featured tags
 * and metric chips. Reused by the FEAT-005 admin UI.
 */
export type BadgeTone = "neutral" | "brand" | "amber" | "green" | "red";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface text-muted border-border",
  brand: "bg-brand-900/40 text-brand-200 border-brand-700/60",
  amber: "bg-accent-amber/10 text-accent-amber border-accent-amber/30",
  green: "bg-accent-green/10 text-accent-green border-accent-green/30",
  red: "bg-accent-red/10 text-accent-red border-accent-red/30",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-small font-medium",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}
