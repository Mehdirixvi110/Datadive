import { z } from "zod";
import {
  accentSchema,
  altSchema,
  hrefSchema,
  isoDateSchema,
  longTextSchema,
  optionalHrefSchema,
  optionalHttpUrlSchema,
  optionalImageUrlSchema,
  orderSchema,
  ratingSchema,
  requireAltWhenUrl,
  shortTextSchema,
  optionalSlugSchema,
  titleSchema,
} from "./common";

/**
 * Per-entity admin schemas (design §13). Each mirrors its §5 table and reuses
 * the shared rules in `common.ts`. Image fields are paired with an alt field
 * that is required only when the URL is set (`requireAltWhenUrl`).
 */

export const heroSchema = z
  .object({
    name: titleSchema,
    eyebrow: shortTextSchema.optional().default(""),
    headline: z.string().min(1, "Required").max(200, "Too long"),
    subheadline: longTextSchema.optional().default(""),
    primaryCtaLabel: shortTextSchema.optional().default(""),
    primaryCtaHref: optionalHrefSchema.optional().default(""),
    secondaryCtaLabel: shortTextSchema.optional().default(""),
    secondaryCtaHref: optionalHrefSchema.optional().default(""),
    imageUrl: optionalImageUrlSchema.optional().default(""),
    imageAlt: altSchema.optional().default(""),
  })
  .superRefine(requireAltWhenUrl("imageUrl", "imageAlt"));

export const aboutSchema = z
  .object({
    name: titleSchema,
    heading: z.string().min(1, "Required").max(200, "Too long"),
    body: longTextSchema,
    points: longTextSchema.optional().default(""),
    imageUrl: optionalImageUrlSchema.optional().default(""),
    imageAlt: altSchema.optional().default(""),
  })
  .superRefine(requireAltWhenUrl("imageUrl", "imageAlt"));

export const ctaSchema = z.object({
  name: titleSchema,
  heading: z.string().min(1, "Required").max(200, "Too long"),
  subtext: longTextSchema.optional().default(""),
  primaryCtaLabel: shortTextSchema.optional().default(""),
  primaryCtaHref: optionalHrefSchema.optional().default(""),
  secondaryCtaLabel: shortTextSchema.optional().default(""),
  secondaryCtaHref: optionalHrefSchema.optional().default(""),
});

export const navLinkSchema = z.object({
  name: titleSchema,
  href: hrefSchema,
  order: orderSchema,
  visible: z.boolean(),
  openInNewTab: z.boolean().optional().default(false),
});

export const serviceSchema = z.object({
  name: titleSchema,
  description: longTextSchema,
  icon: shortTextSchema.optional().default(""),
  accent: accentSchema.optional().default("blue"),
  order: orderSchema,
  visible: z.boolean(),
});

export const industrySchema = z.object({
  name: titleSchema,
  description: longTextSchema,
  icon: shortTextSchema.optional().default(""),
  accent: accentSchema.optional().default("blue"),
  order: orderSchema,
  visible: z.boolean(),
});

export const statSchema = z.object({
  name: titleSchema,
  value: z.number().int("Must be an integer"),
  prefix: shortTextSchema.optional().default(""),
  suffix: shortTextSchema.optional().default(""),
  displayOverride: shortTextSchema.optional().default(""),
  order: orderSchema,
  visible: z.boolean(),
});

export const clientSchema = z
  .object({
    name: titleSchema,
    logoUrl: optionalImageUrlSchema.optional().default(""),
    logoAlt: altSchema.optional().default(""),
    sectorGroup: z.enum([
      "International & Development",
      "Corporate & Technology",
      "Independent Case Studies",
    ]),
    websiteUrl: optionalHttpUrlSchema.optional().default(""),
    order: orderSchema,
    visible: z.boolean(),
  })
  .superRefine(requireAltWhenUrl("logoUrl", "logoAlt"));

export const reviewSchema = z
  .object({
    name: titleSchema,
    quote: longTextSchema,
    role: shortTextSchema.optional().default(""),
    company: shortTextSchema.optional().default(""),
    avatarUrl: optionalImageUrlSchema.optional().default(""),
    avatarAlt: altSchema.optional().default(""),
    rating: ratingSchema.optional().nullable(),
    order: orderSchema,
    published: z.boolean(),
  })
  .superRefine(requireAltWhenUrl("avatarUrl", "avatarAlt"));

export const teamMemberSchema = z
  .object({
    name: titleSchema,
    role: z.string().min(1, "Required").max(200, "Too long"),
    bio: longTextSchema.optional().default(""),
    photoUrl: optionalImageUrlSchema.optional().default(""),
    photoAlt: altSchema.optional().default(""),
    linkedinUrl: optionalHttpUrlSchema.optional().default(""),
    order: orderSchema,
    visible: z.boolean(),
  })
  .superRefine(requireAltWhenUrl("photoUrl", "photoAlt"));

export const projectSchema = z
  .object({
    name: titleSchema,
    slug: optionalSlugSchema.optional().default(""),
    summary: longTextSchema,
    body: longTextSchema.optional().default(""),
    coverImageUrl: optionalImageUrlSchema.optional().default(""),
    coverImageAlt: altSchema.optional().default(""),
    tags: z.array(z.string().max(80)).max(40).optional().default([]),
    metrics: longTextSchema.optional().default(""),
    featured: z.boolean().optional().default(false),
    order: orderSchema,
    published: z.boolean(),
  })
  .superRefine(requireAltWhenUrl("coverImageUrl", "coverImageAlt"));

export const projectImageSchema = z.object({
  name: titleSchema,
  imageUrl: optionalImageUrlSchema.refine((v) => v.length > 0, {
    message: "Image is required",
  }),
  alt: z.string().min(1, "Alt text is required").max(200, "Too long"),
  order: orderSchema,
});

export const blogPostSchema = z
  .object({
    title: titleSchema,
    slug: optionalSlugSchema.optional().default(""),
    excerpt: longTextSchema,
    body: longTextSchema,
    coverImageUrl: optionalImageUrlSchema.optional().default(""),
    coverImageAlt: altSchema.optional().default(""),
    author: z.string().min(1, "Required").max(200, "Too long"),
    publishDate: isoDateSchema,
    published: z.boolean(),
    tags: z.array(z.string().max(80)).max(40).optional().default([]),
    seoTitle: shortTextSchema.optional().default(""),
    seoDescription: longTextSchema.optional().default(""),
  })
  .superRefine(requireAltWhenUrl("coverImageUrl", "coverImageAlt"));

export type HeroInput = z.infer<typeof heroSchema>;
export type AboutInput = z.infer<typeof aboutSchema>;
export type CtaInput = z.infer<typeof ctaSchema>;
export type NavLinkInput = z.infer<typeof navLinkSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type IndustryInput = z.infer<typeof industrySchema>;
export type StatInput = z.infer<typeof statSchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type TeamMemberInput = z.infer<typeof teamMemberSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type ProjectImageInput = z.infer<typeof projectImageSchema>;
export type BlogPostInput = z.infer<typeof blogPostSchema>;
