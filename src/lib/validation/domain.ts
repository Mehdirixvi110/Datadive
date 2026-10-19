import { z } from "zod";
import {
  accentSchema,
  imageUrlSchema,
  hrefSchema,
  optionalHrefSchema,
  optionalHttpUrlSchema,
  orderSchema,
  slugSchema,
} from "./common";

/**
 * Domain-model Zod schemas (design §22, FR-25.4). These describe the camelCase
 * shapes the DAL/seed return (NOT the flat admin-input shapes in entities.ts)
 * and are used to assert the seed module is complete and type-valid with no
 * network and no credentials.
 */

/** A resolved image: validated URL + required alt, or null. */
export const imageRefSchema = z
  .object({
    url: imageUrlSchema,
    alt: z.string().min(1, "Alt required").max(200),
  })
  .strict()
  .nullable();

export const metricSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const settingsDomainSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  brandName: z.string().min(1),
  tagline: z.string().min(1),
  contactEmail: z.string().email(),
  phone: z.string(),
  whatsappNumber: z.string().regex(/^\d*$/, "Digits only"),
  whatsappPrefillMessage: z.string(),
  linkedinUrl: optionalHttpUrlSchema,
  websiteUrl: optionalHttpUrlSchema,
  addressText: z.string(),
  logoLightUrl: z.string(),
  logoDarkUrl: z.string(),
  ogImageUrl: z.string(),
  primaryCtaLabel: z.string(),
  primaryCtaHref: optionalHrefSchema,
});

export const heroDomainSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  eyebrow: z.string(),
  headline: z.string().min(1),
  subheadline: z.string(),
  primaryCtaLabel: z.string(),
  primaryCtaHref: optionalHrefSchema,
  secondaryCtaLabel: z.string(),
  secondaryCtaHref: optionalHrefSchema,
  image: imageRefSchema,
});

export const aboutDomainSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  heading: z.string().min(1),
  body: z.string().min(1),
  points: z.array(z.string()),
  image: imageRefSchema,
});

export const ctaDomainSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  heading: z.string().min(1),
  subtext: z.string(),
  primaryCtaLabel: z.string(),
  primaryCtaHref: optionalHrefSchema,
  secondaryCtaLabel: z.string(),
  secondaryCtaHref: optionalHrefSchema,
});

export const navLinkDomainSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  href: hrefSchema,
  order: orderSchema,
  visible: z.boolean(),
  openInNewTab: z.boolean(),
});

export const serviceDomainSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  icon: z.string(),
  accent: accentSchema,
  order: orderSchema,
  visible: z.boolean(),
});

export const projectImageDomainSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: imageUrlSchema,
  alt: z.string().min(1),
  order: orderSchema,
});

export const projectDomainSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  slug: slugSchema,
  summary: z.string(),
  body: z.string(),
  cover: imageRefSchema,
  images: z.array(projectImageDomainSchema),
  tags: z.array(z.string()),
  metrics: z.array(metricSchema),
  featured: z.boolean(),
  order: orderSchema,
  published: z.boolean(),
  hasDetail: z.boolean(),
});

export const industryDomainSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  icon: z.string(),
  accent: accentSchema,
  order: orderSchema,
  visible: z.boolean(),
});

export const statDomainSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  value: z.number(),
  prefix: z.string(),
  suffix: z.string(),
  displayOverride: z.string(),
  order: orderSchema,
  visible: z.boolean(),
});

export const clientDomainSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  logo: imageRefSchema,
  sectorGroup: z.enum([
    "International & Development",
    "Corporate & Technology",
    "Independent Case Studies",
  ]),
  websiteUrl: optionalHttpUrlSchema,
  order: orderSchema,
  visible: z.boolean(),
});

export const reviewDomainSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  quote: z.string().min(1),
  role: z.string(),
  company: z.string(),
  avatar: imageRefSchema,
  rating: z.number().int().min(1).max(5).nullable(),
  order: orderSchema,
  published: z.boolean(),
});

export const teamMemberDomainSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  role: z.string().min(1),
  bio: z.string(),
  photo: imageRefSchema,
  linkedinUrl: optionalHttpUrlSchema,
  order: orderSchema,
  visible: z.boolean(),
});

export const blogPostDomainSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  slug: slugSchema,
  excerpt: z.string(),
  body: z.string().min(1),
  cover: imageRefSchema,
  author: z.string().min(1),
  publishDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
    message: "Invalid date",
  }),
  published: z.boolean(),
  tags: z.array(z.string()),
  seoTitle: z.string(),
  seoDescription: z.string(),
});
