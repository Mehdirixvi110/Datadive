"use server";

import {
  projectSchema,
  projectImageSchema,
  type ProjectInput,
  type ProjectImageInput,
} from "@/lib/validation/entities";
import {
  createProject,
  updateProject,
  deleteProject,
  reorderProjects,
  createProjectImage,
  updateProjectImage,
  deleteProjectImage,
} from "@/lib/airtable/write";
import { getAllProjects } from "@/lib/airtable/read";
import { adminMutate, adminWrite } from "@/lib/admin/mutate";
import type { AdminFormState } from "@/lib/admin/result";
import { TAGS, projectTag } from "@/lib/airtable/tags";
import { slugify, uniqueSlug } from "@/lib/utils";

/**
 * Resolve the slug to persist (design §13): auto-generate from the name when
 * blank and make it unique against the other Projects, appending `-2`, `-3`, …
 * on conflict. The record being edited is excluded so re-saving keeps its slug.
 */
async function resolveProjectSlug(
  input: ProjectInput,
  excludeId?: string,
): Promise<ProjectInput> {
  const existing = (await getAllProjects())
    .filter((p) => p.id !== excludeId)
    .map((p) => p.slug);
  return {
    ...input,
    slug: uniqueSlug(input.slug || slugify(input.name), existing),
  };
}

/**
 * Projects CRUD + reorder, plus the inline ProjectImages gallery editor
 * (design §12). Project writes revalidate the `projects` list tag AND the
 * per-item `project:{slug}` tag (§7). Gallery writes have no tag of their own,
 * so they revalidate the parent project's `project:{slug}` + `projects`.
 */
const LIST = "/admin/projects";

export async function createProjectAction(values: unknown): Promise<AdminFormState> {
  return adminMutate({
    schema: projectSchema,
    values,
    prepare: (input: ProjectInput) => resolveProjectSlug(input),
    write: (input: ProjectInput) => createProject(input),
    tags: (input: ProjectInput) => [TAGS.projects, projectTag(input.slug)],
    redirectTo: LIST,
  });
}

export async function updateProjectAction(
  id: string,
  values: unknown,
): Promise<AdminFormState> {
  return adminMutate({
    schema: projectSchema,
    values,
    prepare: (input: ProjectInput) => resolveProjectSlug(input, id),
    write: (input: ProjectInput) => updateProject(id, input),
    tags: (input: ProjectInput) => [TAGS.projects, projectTag(input.slug)],
    redirectTo: LIST,
  });
}

export async function deleteProjectAction(id: string): Promise<AdminFormState> {
  return adminWrite({ write: () => deleteProject(id), tags: [TAGS.projects] });
}

export async function reorderProjectsAction(
  items: { id: string; order: number }[],
): Promise<AdminFormState> {
  return adminWrite({ write: () => reorderProjects(items), tags: [TAGS.projects] });
}

// --- Inline gallery (ProjectImages) -----------------------------------------

export async function addProjectImageAction(
  projectId: string,
  slug: string,
  values: unknown,
): Promise<AdminFormState> {
  return adminMutate({
    schema: projectImageSchema,
    values,
    write: (input: ProjectImageInput) =>
      createProjectImage({ ...input, projectId }),
    tags: [TAGS.projects, projectTag(slug)],
  });
}

export async function updateProjectImageAction(
  id: string,
  slug: string,
  values: unknown,
): Promise<AdminFormState> {
  return adminMutate({
    schema: projectImageSchema,
    values,
    write: (input: ProjectImageInput) => updateProjectImage(id, input),
    tags: [TAGS.projects, projectTag(slug)],
  });
}

export async function deleteProjectImageAction(
  id: string,
  slug: string,
): Promise<AdminFormState> {
  return adminWrite({
    write: () => deleteProjectImage(id),
    tags: [TAGS.projects, projectTag(slug)],
  });
}
