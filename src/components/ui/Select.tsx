import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Native select (design §16, §18) — native for free keyboard/scroll behavior.
 * Forwards a ref for react-hook-form. Reused by the FEAT-005 admin UI.
 */
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ invalid, className, children, ...props }, ref) => (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "h-11 w-full rounded-lg border bg-card px-3 text-body text-text",
        "transition-colors focus-visible:border-brand-400",
        invalid ? "border-accent-red" : "border-border",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";
