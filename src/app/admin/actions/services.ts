"use server";

import { serviceSchema, type ServiceInput } from "@/lib/validation/entities";
import {
  createService,
  updateService,
  deleteService,
  reorderServices,
} from "@/lib/airtable/write";
import { adminMutate, adminWrite } from "@/lib/admin/mutate";
import type { AdminFormState } from "@/lib/admin/result";
import { TAGS } from "@/lib/airtable/tags";

/** Services CRUD + reorder server actions (design §12). */
const LIST = "/admin/services";
const TAGS_FOR = [TAGS.services] as const;

export async function createServiceAction(values: unknown): Promise<AdminFormState> {
  return adminMutate({
    schema: serviceSchema,
    values,
    write: (input: ServiceInput) => createService(input),
    tags: TAGS_FOR,
    redirectTo: LIST,
  });
}

export async function updateServiceAction(
  id: string,
  values: unknown,
): Promise<AdminFormState> {
  return adminMutate({
    schema: serviceSchema,
    values,
    write: (input: ServiceInput) => updateService(id, input),
    tags: TAGS_FOR,
    redirectTo: LIST,
  });
}

export async function deleteServiceAction(id: string): Promise<AdminFormState> {
  return adminWrite({ write: () => deleteService(id), tags: TAGS_FOR });
}

export async function reorderServicesAction(
  items: { id: string; order: number }[],
): Promise<AdminFormState> {
  return adminWrite({ write: () => reorderServices(items), tags: TAGS_FOR });
}
