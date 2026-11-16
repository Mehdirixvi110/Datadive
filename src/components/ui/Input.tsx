import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Text input (design §16, §18). Forwards a ref for react-hook-form `register`.
 * `invalid` toggles the alert-red border used for inline validation errors.
 * Reused by the FEAT-005 admin UI.
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ invalid, className, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "h-11 w-full rounded-lg border bg-card px-3 text-body text-text placeholder:text-muted/70",
        "transition-colors focus-visible:border-brand-400",
        invalid ? "border-accent-red" : "border-border",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
