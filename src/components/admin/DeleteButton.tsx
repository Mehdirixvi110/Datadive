"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import type { AdminFormState } from "@/lib/admin/result";

/**
 * Delete with a confirm step (design §12). Calls the entity's delete server
 * action (already bound to the record id) inside a transition, then refreshes
 * the admin list. Disabled in the degraded no-backend mode.
 */
export interface DeleteButtonProps {
  action: () => Promise<AdminFormState>;
  label?: string;
  disabled?: boolean;
}

export function DeleteButton({ action, label, disabled }: DeleteButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setConfirming(false);
        router.refresh();
      } else {
        setError(result.message ?? "Couldn't delete.");
      }
    });
  }

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => setConfirming(true)}
        aria-label={label ? `Delete ${label}` : "Delete"}
      >
        <Trash2 aria-hidden="true" className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-small text-muted">Delete?</span>
      <Button
        type="button"
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={onDelete}
      >
        {pending ? "…" : "Yes"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => setConfirming(false)}
      >
        No
      </Button>
      {error ? <span className="text-small text-accent-red">{error}</span> : null}
    </div>
  );
}
