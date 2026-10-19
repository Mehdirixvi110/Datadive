import { z } from "zod";
import {
  emailSchema,
  normalizeWhatsapp,
  optionalHttpUrlSchema,
  optionalImageUrlSchema,
  optionalHrefSchema,
  shortTextSchema,
  longTextSchema,
} from "./common";

/**
 * Settings (singleton) admin schema (design §5.1/§13). WhatsApp is normalized
 * to digits then validated to 7–15 digits (E.164-ish); empty-after-strip is
 * allowed and hides the WA button. Logo/OG/url fields are optional.
 */
export const settingsSchema = z.object({
  name: shortTextSchema,
  brandName: z.string().min(1, "Required").max(200, "Too long"),
  tagline: z.string().min(1, "Required").max(200, "Too long"),
  contactEmail: emailSchema,
  phone: z
    .string()
    .max(30, "Too long")
    .regex(/^[+0-9\s\-()]*$/, "Invalid phone number")
    .optional()
    .default(""),
  whatsappNumber: z
    .string()
    .optional()
    .default("")
    .transform((v) => normalizeWhatsapp(v))
    .refine((v) => v.length === 0 || (v.length >= 7 && v.length <= 15), {
      message: "Enter 7–15 digits, or leave blank",
    }),
  whatsappPrefillMessage: longTextSchema.optional().default(""),
  linkedinUrl: optionalHttpUrlSchema.optional().default(""),
  websiteUrl: optionalHttpUrlSchema.optional().default(""),
  addressText: longTextSchema.optional().default(""),
  logoLightUrl: optionalImageUrlSchema.optional().default(""),
  logoDarkUrl: optionalImageUrlSchema.optional().default(""),
  // OG image is read into a meta tag (not next/image), so it is http(s) only,
  // NOT host-restricted (design §13).
  ogImageUrl: optionalHttpUrlSchema.optional().default(""),
  primaryCtaLabel: shortTextSchema.optional().default(""),
  primaryCtaHref: optionalHrefSchema.optional().default(""),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
