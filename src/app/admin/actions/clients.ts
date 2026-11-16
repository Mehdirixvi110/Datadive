"use server";

import { clientSchema, type ClientInput } from "@/lib/validation/entities";
import {
  createClient,
  updateClient,
  deleteClient,
  reorderClients,
} from "@/lib/airtable/write";
import { adminMutate, adminWrite } from "@/lib/admin/mutate";
import type { AdminFormState } from "@/lib/admin/result";
import { TAGS } from "@/lib/airtable/tags";

/** Clients CRUD + reorder server actions (design §12). */
const LIST = "/admin/clients";
const TAGS_FOR = [TAGS.clients] as const;

export async function createClientAction(values: unknown): Promise<AdminFormState> {
  return adminMutate({
    schema: clientSchema,
    values,
    write: (input: ClientInput) => createClient(input),
    tags: TAGS_FOR,
    redirectTo: LIST,
  });
}

export async function updateClientAction(
  id: string,
  values: unknown,
): Promise<AdminFormState> {
  return adminMutate({
    schema: clientSchema,
    values,
    write: (input: ClientInput) => updateClient(id, input),
    tags: TAGS_FOR,
    redirectTo: LIST,
  });
}

export async function deleteClientAction(id: string): Promise<AdminFormState> {
  return adminWrite({ write: () => deleteClient(id), tags: TAGS_FOR });
}

export async function reorderClientsAction(
  items: { id: string; order: number }[],
): Promise<AdminFormState> {
  return adminWrite({ write: () => reorderClients(items), tags: TAGS_FOR });
}
