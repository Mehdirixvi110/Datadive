"use server";

import { statSchema, type StatInput } from "@/lib/validation/entities";
import {
  createStat,
  updateStat,
  deleteStat,
  reorderStats,
} from "@/lib/airtable/write";
import { adminMutate, adminWrite } from "@/lib/admin/mutate";
import type { AdminFormState } from "@/lib/admin/result";
import { TAGS } from "@/lib/airtable/tags";

/** Stats CRUD + reorder server actions (design §12). */
const LIST = "/admin/stats";
const TAGS_FOR = [TAGS.stats] as const;

export async function createStatAction(values: unknown): Promise<AdminFormState> {
  return adminMutate({
    schema: statSchema,
    values,
    write: (input: StatInput) => createStat(input),
    tags: TAGS_FOR,
    redirectTo: LIST,
  });
}

export async function updateStatAction(
  id: string,
  values: unknown,
): Promise<AdminFormState> {
  return adminMutate({
    schema: statSchema,
    values,
    write: (input: StatInput) => updateStat(id, input),
    tags: TAGS_FOR,
    redirectTo: LIST,
  });
}

export async function deleteStatAction(id: string): Promise<AdminFormState> {
  return adminWrite({ write: () => deleteStat(id), tags: TAGS_FOR });
}

export async function reorderStatsAction(
  items: { id: string; order: number }[],
): Promise<AdminFormState> {
  return adminWrite({ write: () => reorderStats(items), tags: TAGS_FOR });
}
