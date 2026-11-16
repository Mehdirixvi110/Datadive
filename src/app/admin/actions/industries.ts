"use server";

import { industrySchema, type IndustryInput } from "@/lib/validation/entities";
import {
  createIndustry,
  updateIndustry,
  deleteIndustry,
  reorderIndustries,
} from "@/lib/airtable/write";
import { adminMutate, adminWrite } from "@/lib/admin/mutate";
import type { AdminFormState } from "@/lib/admin/result";
import { TAGS } from "@/lib/airtable/tags";

/** Industries CRUD + reorder server actions (design §12). */
const LIST = "/admin/industries";
const TAGS_FOR = [TAGS.industries] as const;

export async function createIndustryAction(values: unknown): Promise<AdminFormState> {
  return adminMutate({
    schema: industrySchema,
    values,
    write: (input: IndustryInput) => createIndustry(input),
    tags: TAGS_FOR,
    redirectTo: LIST,
  });
}

export async function updateIndustryAction(
  id: string,
  values: unknown,
): Promise<AdminFormState> {
  return adminMutate({
    schema: industrySchema,
    values,
    write: (input: IndustryInput) => updateIndustry(id, input),
    tags: TAGS_FOR,
    redirectTo: LIST,
  });
}

export async function deleteIndustryAction(id: string): Promise<AdminFormState> {
  return adminWrite({ write: () => deleteIndustry(id), tags: TAGS_FOR });
}

export async function reorderIndustriesAction(
  items: { id: string; order: number }[],
): Promise<AdminFormState> {
  return adminWrite({ write: () => reorderIndustries(items), tags: TAGS_FOR });
}
