"use server";

import { reviewSchema, type ReviewInput } from "@/lib/validation/entities";
import {
  createReview,
  updateReview,
  deleteReview,
  reorderReviews,
} from "@/lib/airtable/write";
import { adminMutate, adminWrite } from "@/lib/admin/mutate";
import type { AdminFormState } from "@/lib/admin/result";
import { TAGS } from "@/lib/airtable/tags";

/** Reviews CRUD + reorder server actions (design §12). */
const LIST = "/admin/reviews";
const TAGS_FOR = [TAGS.reviews] as const;

export async function createReviewAction(values: unknown): Promise<AdminFormState> {
  return adminMutate({
    schema: reviewSchema,
    values,
    write: (input: ReviewInput) => createReview(input),
    tags: TAGS_FOR,
    redirectTo: LIST,
  });
}

export async function updateReviewAction(
  id: string,
  values: unknown,
): Promise<AdminFormState> {
  return adminMutate({
    schema: reviewSchema,
    values,
    write: (input: ReviewInput) => updateReview(id, input),
    tags: TAGS_FOR,
    redirectTo: LIST,
  });
}

export async function deleteReviewAction(id: string): Promise<AdminFormState> {
  return adminWrite({ write: () => deleteReview(id), tags: TAGS_FOR });
}

export async function reorderReviewsAction(
  items: { id: string; order: number }[],
): Promise<AdminFormState> {
  return adminWrite({ write: () => reorderReviews(items), tags: TAGS_FOR });
}
