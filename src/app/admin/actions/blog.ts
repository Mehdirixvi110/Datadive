"use server";

import { blogPostSchema, type BlogPostInput } from "@/lib/validation/entities";
import {
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from "@/lib/airtable/write";
import { adminMutate, adminWrite } from "@/lib/admin/mutate";
import type { AdminFormState } from "@/lib/admin/result";
import { TAGS, blogPostTag } from "@/lib/airtable/tags";

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
    write: (input: BlogPostInput) => updateBlogPost(id, input),
    tags: (input: BlogPostInput) => [TAGS.blogPosts, blogPostTag(input.slug)],
    redirectTo: LIST,
  });
}

export async function deleteBlogPostAction(id: string): Promise<AdminFormState> {
  return adminWrite({ write: () => deleteBlogPost(id), tags: [TAGS.blogPosts] });
}
