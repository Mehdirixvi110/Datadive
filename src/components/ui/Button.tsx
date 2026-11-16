import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Button + `buttonVariants` (design §16, §18). The variant helper is exported
 * so anchor/`next/link` CTAs can share the exact button styling without
 * nesting a <button> in an <a>. Focus rings come from the global
 * `:focus-visible` rule; all variants meet AA contrast on the dark theme.
 *
 * Reused by the FEAT-005 admin UI.
 */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[background-color,border-color,color,transform,box-shadow] duration-150 disabled:pointer-events-none disabled:opacity-50";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-500 text-white shadow-sm hover:bg-brand-600 active:translate-y-px",
  secondary:
    "bg-card text-text border border-border hover:border-brand-400 hover:bg-surface",
  outline: "border border-border text-text hover:bg-surface hover:border-brand-400",
  ghost: "text-text hover:bg-surface",
  danger: "bg-accent-red text-white hover:brightness-110 active:translate-y-px",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-small",
  md: "h-11 px-5 text-body",
  lg: "h-12 px-7 text-body",
};

export function buttonVariants(opts?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}): string {
  const { variant = "primary", size = "md", className } = opts ?? {};
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, className, type, ...props }, ref) => (
    <button
      ref={ref}
      type={type ?? "button"}
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  ),
);
Button.displayName = "Button";
