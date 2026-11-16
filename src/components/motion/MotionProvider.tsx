"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * App-wide motion guard (design §16). `reducedMotion="user"` makes every Framer
 * Motion animation honor the OS `prefers-reduced-motion` setting; the CSS
 * `@media (prefers-reduced-motion: reduce)` rule in globals.css covers the
 * plain-CSS motion. Children are server-rendered and pass straight through.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
