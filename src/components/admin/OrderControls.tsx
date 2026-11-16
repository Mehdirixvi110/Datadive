"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * Up/down reorder buttons (design §12). Presentational — the parent
 * `EntityTable` owns the ordered list and persists the new `Order` via the
 * entity's reorder server action.
 */
export interface OrderControlsProps {
  onUp: () => void;
  onDown: () => void;
  disableUp: boolean;
  disableDown: boolean;
  disabled?: boolean;
}

export function OrderControls({
  onUp,
  onDown,
  disableUp,
  disableDown,
  disabled,
}: OrderControlsProps) {
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onUp}
        disabled={disabled || disableUp}
        aria-label="Move up"
        className="rounded p-1 text-muted hover:text-text disabled:opacity-30"
      >
        <ChevronUp aria-hidden="true" className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onDown}
        disabled={disabled || disableDown}
        aria-label="Move down"
        className="rounded p-1 text-muted hover:text-text disabled:opacity-30"
      >
        <ChevronDown aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}
