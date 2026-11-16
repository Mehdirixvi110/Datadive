"use client";

import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Presentational toast (design §16/§18). Controlled by the parent — it owns
 * when to show and dismiss. `polite` live region so screen readers announce
 * success/error without stealing focus. Reused by the FEAT-005 admin UI.
 */
export type ToastTone = "success" | "error";

export interface ToastProps {
  tone: ToastTone;
  message: string;
  onDismiss?: () => void;
}

export function Toast({ tone, message, onDismiss }: ToastProps) {
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-body",
        tone === "success"
          ? "border-accent-green/40 bg-accent-green/10 text-text"
          : "border-accent-red/40 bg-accent-red/10 text-text",
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          "mt-0.5 h-5 w-5 shrink-0",
          tone === "success" ? "text-accent-green" : "text-accent-red",
        )}
      />
      <p className="flex-1">{message}</p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded p-0.5 text-muted hover:text-text"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
