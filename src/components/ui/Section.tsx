import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Container } from "./Container";

/**
 * Vertical section rhythm (design §16): consistent `py-24 md:py-32` and an
 * optional elevated `surface` band. Wraps children in a <Container> unless
 * `bleed` is set (for full-width visuals). Reused by the FEAT-005 admin UI.
 */
export interface SectionProps extends HTMLAttributes<HTMLElement> {
  id?: string;
  surface?: boolean;
  bleed?: boolean;
  children: ReactNode;
}

export function Section({
  id,
  surface = false,
  bleed = false,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-20 py-24 md:py-32",
        surface && "bg-surface",
        className,
      )}
      {...props}
    >
      {bleed ? children : <Container>{children}</Container>}
    </section>
  );
}
