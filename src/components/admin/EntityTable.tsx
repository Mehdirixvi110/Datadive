"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { OrderControls } from "./OrderControls";
import { DeleteButton } from "./DeleteButton";
import type { AdminFormState } from "@/lib/admin/result";

/**
 * Admin list table (design §12). Renders each record's order (with up/down
 * reorder controls writing `Order`), a visibility/published flag, an edit link,
 * and a confirm-to-delete button. Reorder and delete go through the entity's
 * server actions; both are disabled in the degraded no-backend mode.
 */
export interface AdminRow {
  id: string;
  primary: string;
  secondary?: string;
  order: number;
  flag?: { label: string; on: boolean };
  editHref: string;
}

export interface EntityTableProps {
  rows: AdminRow[];
  editable: boolean;
  /** Omit for entities with no `Order` field (e.g. blog). */
  reorderAction?: (items: { id: string; order: number }[]) => Promise<AdminFormState>;
  deleteAction: (id: string) => Promise<AdminFormState>;
}

export function EntityTable({
  rows,
  editable,
  reorderAction,
  deleteAction,
}: EntityTableProps) {
  const router = useRouter();
  const [items, setItems] = useState(rows);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Keep local order in sync when the server component re-renders with new data.
  useEffect(() => setItems(rows), [rows]);

  function move(index: number, direction: "up" | "down") {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    if (!reorderAction) return;
    const reorder = reorderAction;
    const changed = [
      { id: next[index].id, order: index },
      { id: next[target].id, order: target },
    ];
    next[index] = { ...next[index], order: index };
    next[target] = { ...next[target], order: target };
    setItems(next);
    setError(null);
    startTransition(async () => {
      const result = await reorder(changed);
      if (result.ok) {
        router.refresh();
      } else {
        setItems(rows);
        setError(result.message ?? "Couldn't reorder.");
      }
    });
  }

  if (items.length === 0) {
    return (
      <Card className="text-muted">No records yet. Create the first one.</Card>
    );
  }

  return (
    <div className="space-y-2">
      {error ? <p className="text-small text-accent-red">{error}</p> : null}
      <ul className="divide-y divide-border rounded-xl border border-border">
        {items.map((row, index) => (
          <li
            key={row.id}
            className="flex items-center gap-4 px-4 py-3"
          >
            {reorderAction ? (
              <OrderControls
                onUp={() => move(index, "up")}
                onDown={() => move(index, "down")}
                disableUp={index === 0}
                disableDown={index === items.length - 1}
                disabled={!editable || pending}
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-text">{row.primary}</p>
              {row.secondary ? (
                <p className="truncate text-small text-muted">{row.secondary}</p>
              ) : null}
            </div>
            {row.flag ? (
              <Badge tone={row.flag.on ? "green" : "neutral"}>
                {row.flag.label}
              </Badge>
            ) : null}
            <Link
              href={row.editHref}
              className="text-small font-medium text-brand-400 hover:underline"
            >
              Edit
            </Link>
            <DeleteButton
              action={() => deleteAction(row.id)}
              label={row.primary}
              disabled={!editable}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
