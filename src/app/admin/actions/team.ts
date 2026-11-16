"use server";

import { teamMemberSchema, type TeamMemberInput } from "@/lib/validation/entities";
import {
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  reorderTeam,
} from "@/lib/airtable/write";
import { adminMutate, adminWrite } from "@/lib/admin/mutate";
import type { AdminFormState } from "@/lib/admin/result";
import { TAGS } from "@/lib/airtable/tags";

/** Team CRUD + reorder server actions (design §12). */
const LIST = "/admin/team";
const TAGS_FOR = [TAGS.team] as const;

export async function createTeamMemberAction(values: unknown): Promise<AdminFormState> {
  return adminMutate({
    schema: teamMemberSchema,
    values,
    write: (input: TeamMemberInput) => createTeamMember(input),
    tags: TAGS_FOR,
    redirectTo: LIST,
  });
}

export async function updateTeamMemberAction(
  id: string,
  values: unknown,
): Promise<AdminFormState> {
  return adminMutate({
    schema: teamMemberSchema,
    values,
    write: (input: TeamMemberInput) => updateTeamMember(id, input),
    tags: TAGS_FOR,
    redirectTo: LIST,
  });
}

export async function deleteTeamMemberAction(id: string): Promise<AdminFormState> {
  return adminWrite({ write: () => deleteTeamMember(id), tags: TAGS_FOR });
}

export async function reorderTeamAction(
  items: { id: string; order: number }[],
): Promise<AdminFormState> {
  return adminWrite({ write: () => reorderTeam(items), tags: TAGS_FOR });
}
