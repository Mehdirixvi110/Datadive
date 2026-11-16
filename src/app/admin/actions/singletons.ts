"use server";

import {
  aboutSchema,
  ctaSchema,
  heroSchema,
  type AboutInput,
  type CtaInput,
  type HeroInput,
} from "@/lib/validation/entities";
import { settingsSchema, type SettingsInput } from "@/lib/validation/settings";
import {
  updateAbout,
  updateCta,
  updateHero,
  updateSettings,
} from "@/lib/airtable/write";
import { adminMutate } from "@/lib/admin/mutate";
import type { AdminFormState } from "@/lib/admin/result";
import { TAGS } from "@/lib/airtable/tags";

/**
 * Singleton save actions (design §12). Each upserts the single row via the DAL,
 * re-validates with the entity Zod schema, and revalidates the matching tag.
 * Saving Settings also revalidates `nav` because the shared layout reads both
 * (§7). No redirect — the form shows an inline success toast and refreshes.
 */

export async function saveSettings(values: unknown): Promise<AdminFormState> {
  return adminMutate({
    schema: settingsSchema,
    values,
    write: (input: SettingsInput) => updateSettings(input),
    tags: [TAGS.settings, TAGS.nav],
  });
}

export async function saveHero(values: unknown): Promise<AdminFormState> {
  return adminMutate({
    schema: heroSchema,
    values,
    write: (input: HeroInput) => updateHero(input),
    tags: [TAGS.hero],
  });
}

export async function saveAbout(values: unknown): Promise<AdminFormState> {
  return adminMutate({
    schema: aboutSchema,
    values,
    write: (input: AboutInput) => updateAbout(input),
    tags: [TAGS.about],
  });
}

export async function saveCta(values: unknown): Promise<AdminFormState> {
  return adminMutate({
    schema: ctaSchema,
    values,
    write: (input: CtaInput) => updateCta(input),
    tags: [TAGS.cta],
  });
}
