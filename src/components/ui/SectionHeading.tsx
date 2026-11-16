import { cn } from "@/lib/utils/cn";

/**
 * Standard section heading (design §16): optional mono eyebrow, display title,
 * optional muted subtitle. `align` centers or left-aligns. Reused by the
 * FEAT-005 admin UI.
 */
export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow ? (
        <span className="font-mono text-small uppercase tracking-widest text-depth">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="font-display text-display-3 font-bold text-text">{title}</h2>
      {subtitle ? (
        <p
          className={cn(
            "max-w-2xl text-body text-muted",
            align === "center" && "mx-auto",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
