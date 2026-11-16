import { cn } from "@/lib/utils/cn";

/**
 * Decorative blurred radial-gradient glow (design §16) behind the hero/CTA.
 * Pure CSS, `aria-hidden`, pointer-events-none. The optional slow drift is a
 * CSS animation neutralized under `prefers-reduced-motion` by the globals.css
 * rule (so no JS is involved). Cheap: one blurred element.
 */
export type GlowTone = "brand" | "depth";

export interface GlowBlobProps {
  tone?: GlowTone;
  className?: string;
  drift?: boolean;
}

const TONES: Record<GlowTone, string> = {
  brand:
    "bg-[radial-gradient(circle_at_center,rgba(30,111,235,0.5),transparent_70%)]",
  depth:
    "bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.4),transparent_70%)]",
};

export function GlowBlob({
  tone = "brand",
  className,
  drift = false,
}: GlowBlobProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute -z-10 rounded-full blur-3xl",
        TONES[tone],
        drift && "motion-safe:animate-glow-drift",
        className,
      )}
    />
  );
}
