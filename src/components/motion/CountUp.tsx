"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Count-up number animation (design §16, FR-7.3). Animates 0→`value` with
 * `requestAnimationFrame` the first time it scrolls into view, wrapping the
 * number with optional `prefix`/`suffix`. Under `prefers-reduced-motion` (or
 * when IO/rAF are unavailable) it shows the final value instantly. When
 * `displayOverride` is set it is shown verbatim with no animation.
 */
export interface CountUpProps {
  value: number;
  prefix?: string;
  suffix?: string;
  displayOverride?: string;
  durationMs?: number;
}

export function CountUp({
  value,
  prefix = "",
  suffix = "",
  displayOverride = "",
  durationMs = 1600,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);
  const override = displayOverride.trim();

  useEffect(() => {
    if (override.length > 0) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (
      prefersReduced ||
      typeof IntersectionObserver === "undefined" ||
      typeof requestAnimationFrame === "undefined"
    ) {
      setDisplay(value);
      return;
    }

    const node = ref.current;
    if (!node) {
      setDisplay(value);
      return;
    }

    let raf = 0;
    let started = false;
    const run = () => {
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(Math.round(eased * value));
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!started && entries.some((e) => e.isIntersecting)) {
          started = true;
          run();
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [value, durationMs, override]);

  return (
    <span ref={ref} className="tabular-nums">
      {override.length > 0 ? override : `${prefix}${display}${suffix}`}
    </span>
  );
}
