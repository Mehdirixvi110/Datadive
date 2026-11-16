"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * "DiveField" — the one playful signature feature (design §16, FR-17).
 *
 * A decorative `aria-hidden` <canvas> of floating data points behind the real
 * hero headline/CTA (which stay fully accessible DOM). Pointer movement lifts
 * nearby points toward the surface and links them with thin lines — a sense of
 * diving through a sea of data.
 *
 * Performance budget (strictly bounded so it never jeopardizes build/perf):
 *   - ≤60 points, requestAnimationFrame, devicePixelRatio-aware.
 *   - PAUSED when offscreen (IntersectionObserver) and when the tab is hidden
 *     (visibilitychange).
 *   - Pointer parallax uses transforms only.
 *   - On touch (no fine pointer) or prefers-reduced-motion it draws a single
 *     STATIC constellation frame and never animates.
 *
 * NICE-TO-HAVE: if this ever regresses the build/perf/layout it can be removed
 * from Hero with zero requirement impact — the hero keeps its gradient glow.
 */
const MAX_POINTS = 60;
const LINK_DISTANCE = 120;
const POINT_COLOR = "rgba(125, 211, 252, 0.9)";
const LINK_COLOR = "rgba(34, 211, 238, 0.28)";

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

export function DiveField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const finePointer = window.matchMedia?.("(pointer: fine)").matches ?? false;
    const animate = !reduceMotion && finePointer;

    let width = 0;
    let height = 0;
    let dpr = 1;
    const points: Point[] = [];
    const pointer = { x: -9999, y: -9999, active: false };

    const seedPoints = () => {
      points.length = 0;
      // Scale count to area, capped at MAX_POINTS.
      const count = Math.min(
        MAX_POINTS,
        Math.round((width * height) / 22000) || 10,
      );
      for (let i = 0; i < count; i++) {
        points.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: 1 + Math.random() * 2.5,
        });
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedPoints();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of points) {
        // Pointer lift: nearby points drift toward the surface (pointer).
        if (animate && pointer.active) {
          const dx = pointer.x - p.x;
          const dy = pointer.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DISTANCE && dist > 0.01) {
            const pull = (1 - dist / LINK_DISTANCE) * 0.4;
            p.x += (dx / dist) * pull;
            p.y += (dy / dist) * pull;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = POINT_COLOR;
        ctx.fill();
      }

      // Link near points with thin lines.
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const a = points[i];
          const b = points[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < LINK_DISTANCE) {
            ctx.beginPath();
            ctx.globalAlpha = 1 - dist / LINK_DISTANCE;
            ctx.strokeStyle = LINK_COLOR;
            ctx.lineWidth = 1;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }
    };

    let raf = 0;
    let running = false;

    const tick = () => {
      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }
      draw();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || !animate) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    resize();
    draw(); // always paint at least one static frame (constellation)

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };

    // Pause offscreen.
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (visible && !document.hidden) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    // Pause when tab hidden.
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    if (animate) {
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerleave", onPointerLeave);
    }

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    />
  );
}
