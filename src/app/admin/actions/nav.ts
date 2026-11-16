"use server";

import { navLinkSchema, type NavLinkInput } from "@/lib/validation/entities";
import {
  createNavLink,
  updateNavLink,
  deleteNavLink,
  reorderNavLinks,
} from "@/lib/airtable/write";
import { adminMutate, adminWrite } from "@/lib/admin/mutate";
import type { AdminFormState } from "@/lib/admin/result";
import { TAGS } from "@/lib/airtable/tags";

/**
 * NavLinks CRUD + reorder server actions (design §12). Nav changes revalidate
 * the `nav` tag, which the shared layout reads — refreshing the header/footer
 * across the whole site (§7).
 */
const LIST = "/admin/nav";
const TAGS_FOR = [TAGS.nav] as const;

export async function createNavLinkAction(values: unknown): Promise<AdminFormState> {
  return adminMutate({
    schema: navLinkSchema,
    values,
    write: (input: NavLinkInput) => createNavLink(input),
    tags: TAGS_FOR,
    redirectTo: LIST,
  });
}

export async function updateNavLinkAction(
  id: string,
  values: unknown,
): Promise<AdminFormState> {
  return adminMutate({
    schema: navLinkSchema,
    values,
    write: (input: NavLinkInput) => updateNavLink(id, input),
    tags: TAGS_FOR,
    redirectTo: LIST,
  });
}

export async function deleteNavLinkAction(id: string): Promise<AdminFormState> {
  return adminWrite({ write: () => deleteNavLink(id), tags: TAGS_FOR });
}

export async function reorderNavLinksAction(
  items: { id: string; order: number }[],
): Promise<AdminFormState> {
  return adminWrite({ write: () => reorderNavLinks(items), tags: TAGS_FOR });
}
