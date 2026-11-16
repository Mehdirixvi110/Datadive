"use server";

import { blogPostSchema, type BlogPostInput } from "@/lib/validation/entities";
import {
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from "@/lib/airtable/write";
import { getAllBlogPosts } from "@/lib/airtable/read";
import { adminMutate, adminWrite } from "@/lib/admin/mutate";
import type { AdminFormState } from "@/lib/admin/result";
import { TAGS, blogPostTag } from "@/lib/airtable/tags";
import { slugify, uniqueSlug } from "@/lib/utils";

/**
 * Resolve the slug to persist (design §13): auto-generate from the title when
 * blank and make it unique against the other posts, appending `-2`, `-3`, … on
 * conflict. The record being edited is excluded so re-saving keeps its slug.
 */
async function resolveBlogPostSlug(
  input: BlogPostInput,
  excludeId?: string,
): Promise<BlogPostInput> {
  const existing = (await getAllBlogPosts())
    .filter((p) => p.id !== excludeId)
    .map((p) => p.slug);
  return {
    ...input,
    slug: uniqueSlug(input.slug || slugify(input.title), existing),
  };
}

/**
 * BlogPosts CRUD server actions (design §12). The listing sorts by PublishDate
 * (no Order field), so there is no reorder action. Writes revalidate the
 * `blogposts` list tag AND the per-item `blogpost:{slug}` tag (§7).
 */
const LIST = "/admin/blog";

export async function createBlogPostAction(values: unknown): Promise<AdminFormState> {
  return adminMutate({
    schema: blogPostSchema,
    values,
    prepare: (input: BlogPostInput) => resolveBlogPostSlug(input),
    write: (input: BlogPostInput) => createBlogPost(input),
    tags: (input: BlogPostInput) => [TAGS.blogPosts, blogPostTag(input.slug)],
    redirectTo: LIST,
  });
}

export async function updateBlogPostAction(
  id: string,
  values: unknown,
): Promise<AdminFormState> {
  return adminMutate({
    schema: blogPostSchema,
    values,
    prepare: (input: BlogPostInput) => resolveBlogPostSlug(input, id),
    write: (input: BlogPostInput) => updateBlogPost(id, input),
    tags: (input: BlogPostInput) => [TAGS.blogPosts, blogPostTag(input.slug)],
    redirectTo: LIST,
  });
}

export async function deleteBlogPostAction(id: string): Promise<AdminFormState> {
  return adminWrite({ write: () => deleteBlogPost(id), tags: [TAGS.blogPosts] });
}
