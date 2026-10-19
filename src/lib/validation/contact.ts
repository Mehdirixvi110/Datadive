import { z } from "zod";
import { emailSchema } from "./common";

/**
 * Contact form schema (design §13, FR-12). Validated server-side in
 * `submitContact` before any Airtable write; the same schema backs the
 * client form. `website` is a honeypot — it must be empty for a human.
 */
export const contactSchema = z.object({
  name: z.string().min(2, "Please enter your name").max(100, "Too long"),
  email: emailSchema,
  company: z.string().max(120, "Too long").optional().default(""),
  subject: z.string().max(150, "Too long").optional().default(""),
  phone: z
    .string()
    .max(30, "Too long")
    .regex(/^[+0-9\s\-()]*$/, "Invalid phone number")
    .optional()
    .default(""),
  message: z
    .string()
    .min(10, "Please add a little more detail")
    .max(5000, "Too long"),
  /** Honeypot: must be empty. A non-empty value marks the submission as spam. */
  website: z.string().max(0, "Spam detected").optional().default(""),
});

export type ContactInput = z.infer<typeof contactSchema>;
