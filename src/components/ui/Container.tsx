import type { ElementType, HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Horizontal layout wrapper (design §16): `max-w-7xl` + `px-6`, centered.
 * The single source of page gutters/alignment. Reused by the FEAT-005 admin UI.
 */
export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
}

export function Container({
  as: Tag = "div",
  className,
  ...props
}: ContainerProps) {
  return (
    <Tag className={cn("mx-auto w-full max-w-7xl px-6", className)} {...props} />
  );
}
