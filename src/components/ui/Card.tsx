import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import type { Accent } from "@/lib/types";

/**
 * Surface card (design §16). Optional per-card `accent` drives the hover border
 * so Services/Industries grids show an intentional, balanced color spread.
 * `interactive` adds the transform-lift + accent border on hover/focus-within
 * (keyboard-equivalent, FR-4.4). Reused by the FEAT-005 admin UI.
 */
const ACCENT_HOVER: Record<Accent, string> = {
  blue: "hover:border-brand-400 focus-within:border-brand-400",
  amber: "hover:border-accent-amber focus-within:border-accent-amber",
  green: "hover:border-accent-green focus-within:border-accent-green",
  red: "hover:border-accent-red focus-within:border-accent-red",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: Accent;
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ accent = "blue", interactive = false, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-border bg-card p-6",
        interactive &&
          cn(
            "transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20",
            ACCENT_HOVER[accent],
          ),
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";
