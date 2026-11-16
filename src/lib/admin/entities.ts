import type { z } from "zod";
import {
  aboutSchema,
  blogPostSchema,
  clientSchema,
  ctaSchema,
  heroSchema,
  industrySchema,
  navLinkSchema,
  projectSchema,
  reviewSchema,
  serviceSchema,
  statSchema,
  teamMemberSchema,
} from "@/lib/validation/entities";
import { settingsSchema } from "@/lib/validation/settings";

/**
 * Admin entity form + list configuration (design §12/§13). One declarative
 * record per content type drives the generic `EntityForm` (field rendering +
 * client coercion) and `EntityTable` (columns). Pure module — imports only Zod
 * schemas, so it is safe in both the client admin UI and server pages. Each
 * field's authoritative validation is the referenced entity Zod schema, which
 * every server action re-runs server-side (§13).
 */

export type FieldKind =
  | "text"
  | "textarea"
  | "number"
  | "checkbox"
  | "select"
  | "image"
  | "tags"
  | "lines"
  | "metrics"
  | "date";

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldDef {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: SelectOption[];
  /** Image field: paired alt-text field name (required when a URL is set). */
  altName?: string;
  /** Image field: domain property holding the `{url,alt}` ImageRef. */
  imageKey?: string;
  /** Number field: blank input stored as `null` (e.g. review rating). */
  nullable?: boolean;
  /** Checkbox default when creating. */
  defaultOn?: boolean;
  help?: string;
  placeholder?: string;
  rows?: number;
}

export interface EntityFormConfig {
  /** Singular label, e.g. "Service". */
  title: string;
  schema: z.ZodTypeAny;
  fields: FieldDef[];
}

export type SingletonKey = "settings" | "hero" | "about" | "cta";
export type ListKey =
  | "nav"
  | "services"
  | "projects"
  | "industries"
  | "stats"
  | "clients"
  | "reviews"
  | "team"
  | "blog";
export type EntityKey = SingletonKey | ListKey;

const ACCENT_OPTIONS: SelectOption[] = [
  { value: "blue", label: "Blue" },
  { value: "amber", label: "Amber" },
  { value: "green", label: "Green" },
  { value: "red", label: "Red" },
];

const SERVICE_ICON_OPTIONS: SelectOption[] = [
  { value: "dashboard", label: "Dashboard" },
  { value: "bi", label: "Business intelligence" },
  { value: "ai", label: "AI / ML" },
  { value: "custom", label: "Custom solutions" },
  { value: "etl", label: "ETL / pipelines" },
  { value: "report", label: "Reporting" },
];

const INDUSTRY_ICON_OPTIONS: SelectOption[] = [
  { value: "hr", label: "Human resources" },
  { value: "health", label: "Healthcare & NGOs" },
  { value: "retail", label: "Retail & sales" },
  { value: "ops", label: "Corporate operations" },
  { value: "ml", label: "AI & machine learning" },
];

const SECTOR_OPTIONS: SelectOption[] = [
  { value: "International & Development", label: "International & Development" },
  { value: "Corporate & Technology", label: "Corporate & Technology" },
  { value: "Independent Case Studies", label: "Independent Case Studies" },
];

export const ENTITY_FORMS: Record<EntityKey, EntityFormConfig> = {
  settings: {
    title: "Site settings",
    schema: settingsSchema,
    fields: [
      { name: "name", label: "Internal label", kind: "text", required: true },
      { name: "brandName", label: "Brand name", kind: "text", required: true },
      { name: "tagline", label: "Tagline", kind: "text", required: true },
      { name: "contactEmail", label: "Contact email", kind: "text", required: true },
      { name: "phone", label: "Phone", kind: "text" },
      {
        name: "whatsappNumber",
        label: "WhatsApp number",
        kind: "text",
        help: "Digits only. Leave blank to hide the WhatsApp button.",
      },
      { name: "whatsappPrefillMessage", label: "WhatsApp prefill message", kind: "textarea" },
      { name: "linkedinUrl", label: "LinkedIn URL", kind: "text" },
      { name: "websiteUrl", label: "Website URL", kind: "text" },
      { name: "addressText", label: "Address", kind: "textarea" },
      { name: "logoLightUrl", label: "Logo (light surfaces)", kind: "image" },
      { name: "logoDarkUrl", label: "Logo (dark surfaces)", kind: "image" },
      {
        name: "ogImageUrl",
        label: "Default share (OG) image URL",
        kind: "text",
        help: "Any https URL — read into a meta tag, not next/image.",
      },
      { name: "primaryCtaLabel", label: "Nav CTA label", kind: "text" },
      { name: "primaryCtaHref", label: "Nav CTA href", kind: "text" },
    ],
  },
  hero: {
    title: "Hero",
    schema: heroSchema,
    fields: [
      { name: "name", label: "Internal label", kind: "text", required: true },
      { name: "eyebrow", label: "Eyebrow", kind: "text" },
      { name: "headline", label: "Headline", kind: "text", required: true },
      { name: "subheadline", label: "Subheadline", kind: "textarea" },
      { name: "primaryCtaLabel", label: "Primary CTA label", kind: "text" },
      { name: "primaryCtaHref", label: "Primary CTA href", kind: "text" },
      { name: "secondaryCtaLabel", label: "Secondary CTA label", kind: "text" },
      { name: "secondaryCtaHref", label: "Secondary CTA href", kind: "text" },
      {
        name: "imageUrl",
        label: "Hero image",
        kind: "image",
        imageKey: "image",
        altName: "imageAlt",
      },
    ],
  },
  about: {
    title: "About",
    schema: aboutSchema,
    fields: [
      { name: "name", label: "Internal label", kind: "text", required: true },
      { name: "heading", label: "Heading", kind: "text", required: true },
      { name: "body", label: "Body (Markdown)", kind: "textarea", required: true, rows: 8 },
      {
        name: "points",
        label: "Points",
        kind: "lines",
        help: "One scannable point per line.",
        rows: 5,
      },
      {
        name: "imageUrl",
        label: "About image",
        kind: "image",
        imageKey: "image",
        altName: "imageAlt",
      },
    ],
  },
  cta: {
    title: "CTA band",
    schema: ctaSchema,
    fields: [
      { name: "name", label: "Internal label", kind: "text", required: true },
      { name: "heading", label: "Heading", kind: "text", required: true },
      { name: "subtext", label: "Subtext", kind: "textarea" },
      { name: "primaryCtaLabel", label: "Primary CTA label", kind: "text" },
      { name: "primaryCtaHref", label: "Primary CTA href", kind: "text" },
      { name: "secondaryCtaLabel", label: "Secondary CTA label", kind: "text" },
      { name: "secondaryCtaHref", label: "Secondary CTA href", kind: "text" },
    ],
  },
  nav: {
    title: "Nav link",
    schema: navLinkSchema,
    fields: [
      { name: "name", label: "Label", kind: "text", required: true },
      { name: "href", label: "Href", kind: "text", required: true, placeholder: "#about or /blog" },
      { name: "order", label: "Order", kind: "number" },
      { name: "visible", label: "Visible", kind: "checkbox", defaultOn: true },
      { name: "openInNewTab", label: "Open in new tab", kind: "checkbox" },
    ],
  },
  services: {
    title: "Service",
    schema: serviceSchema,
    fields: [
      { name: "name", label: "Name", kind: "text", required: true },
      { name: "description", label: "Description", kind: "textarea", required: true },
      { name: "icon", label: "Icon", kind: "select", options: SERVICE_ICON_OPTIONS },
      { name: "accent", label: "Accent", kind: "select", options: ACCENT_OPTIONS },
      { name: "order", label: "Order", kind: "number" },
      { name: "visible", label: "Visible", kind: "checkbox", defaultOn: true },
    ],
  },
  industries: {
    title: "Industry",
    schema: industrySchema,
    fields: [
      { name: "name", label: "Name", kind: "text", required: true },
      { name: "description", label: "Description", kind: "textarea", required: true },
      { name: "icon", label: "Icon", kind: "select", options: INDUSTRY_ICON_OPTIONS },
      { name: "accent", label: "Accent", kind: "select", options: ACCENT_OPTIONS },
      { name: "order", label: "Order", kind: "number" },
      { name: "visible", label: "Visible", kind: "checkbox", defaultOn: true },
    ],
  },
  stats: {
    title: "Stat",
    schema: statSchema,
    fields: [
      { name: "name", label: "Label", kind: "text", required: true },
      { name: "value", label: "Value", kind: "number" },
      { name: "prefix", label: "Prefix", kind: "text", placeholder: "$" },
      { name: "suffix", label: "Suffix", kind: "text", placeholder: "K+" },
      {
        name: "displayOverride",
        label: "Display override",
        kind: "text",
        help: "If set, shown verbatim (no count-up).",
      },
      { name: "order", label: "Order", kind: "number" },
      { name: "visible", label: "Visible", kind: "checkbox", defaultOn: true },
    ],
  },
  clients: {
    title: "Client",
    schema: clientSchema,
    fields: [
      { name: "name", label: "Name", kind: "text", required: true },
      {
        name: "logoUrl",
        label: "Logo",
        kind: "image",
        imageKey: "logo",
        altName: "logoAlt",
      },
      { name: "sectorGroup", label: "Sector group", kind: "select", options: SECTOR_OPTIONS },
      { name: "websiteUrl", label: "Website URL", kind: "text" },
      { name: "order", label: "Order", kind: "number" },
      { name: "visible", label: "Visible", kind: "checkbox", defaultOn: true },
    ],
  },
  reviews: {
    title: "Review",
    schema: reviewSchema,
    fields: [
      { name: "name", label: "Author name", kind: "text", required: true },
      { name: "quote", label: "Quote", kind: "textarea", required: true },
      { name: "role", label: "Role", kind: "text" },
      { name: "company", label: "Company", kind: "text" },
      {
        name: "avatarUrl",
        label: "Avatar",
        kind: "image",
        imageKey: "avatar",
        altName: "avatarAlt",
      },
      { name: "rating", label: "Rating (1–5)", kind: "number", nullable: true },
      { name: "order", label: "Order", kind: "number" },
      { name: "published", label: "Published", kind: "checkbox", defaultOn: true },
    ],
  },
  team: {
    title: "Team member",
    schema: teamMemberSchema,
    fields: [
      { name: "name", label: "Name", kind: "text", required: true },
      { name: "role", label: "Role", kind: "text", required: true },
      { name: "bio", label: "Bio", kind: "textarea" },
      {
        name: "photoUrl",
        label: "Photo",
        kind: "image",
        imageKey: "photo",
        altName: "photoAlt",
      },
      { name: "linkedinUrl", label: "LinkedIn URL", kind: "text" },
      { name: "order", label: "Order", kind: "number" },
      { name: "visible", label: "Visible", kind: "checkbox", defaultOn: true },
    ],
  },
  projects: {
    title: "Project",
    schema: projectSchema,
    fields: [
      { name: "name", label: "Name", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "text", required: true },
      { name: "summary", label: "Summary", kind: "textarea", required: true },
      { name: "body", label: "Body (Markdown)", kind: "textarea", rows: 8 },
      {
        name: "coverImageUrl",
        label: "Cover image",
        kind: "image",
        imageKey: "cover",
        altName: "coverImageAlt",
      },
      { name: "tags", label: "Tags", kind: "tags", help: "Comma-separated." },
      {
        name: "metrics",
        label: "Metrics",
        kind: "metrics",
        help: "One `value | label` per line, e.g. 150K+ | records cleaned.",
        rows: 5,
      },
      { name: "featured", label: "Featured", kind: "checkbox" },
      { name: "order", label: "Order", kind: "number" },
      { name: "published", label: "Published", kind: "checkbox", defaultOn: true },
    ],
  },
  blog: {
    title: "Blog post",
    schema: blogPostSchema,
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "text", required: true },
      { name: "excerpt", label: "Excerpt", kind: "textarea", required: true },
      { name: "body", label: "Body (Markdown)", kind: "textarea", required: true, rows: 10 },
      {
        name: "coverImageUrl",
        label: "Cover image",
        kind: "image",
        imageKey: "cover",
        altName: "coverImageAlt",
      },
      { name: "author", label: "Author", kind: "text", required: true },
      { name: "publishDate", label: "Publish date", kind: "date", required: true },
      { name: "published", label: "Published", kind: "checkbox" },
      { name: "tags", label: "Tags", kind: "tags", help: "Comma-separated." },
      { name: "seoTitle", label: "SEO title", kind: "text" },
      { name: "seoDescription", label: "SEO description", kind: "textarea" },
    ],
  },
};

type DomainLike = Record<string, unknown> | undefined;

function imageRefOf(value: unknown): { url: string; alt: string } | null {
  if (value && typeof value === "object" && "url" in value) {
    return value as { url: string; alt: string };
  }
  return null;
}

/** Build the form's default values from a domain object (edit) or empty (create). */
export function buildDefaults(
  entity: EntityKey,
  domain?: DomainLike,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of ENTITY_FORMS[entity].fields) {
    switch (f.kind) {
      case "image": {
        if (f.imageKey) {
          const ref = imageRefOf(domain?.[f.imageKey]);
          out[f.name] = ref?.url ?? "";
          if (f.altName) out[f.altName] = ref?.alt ?? "";
        } else {
          out[f.name] = (domain?.[f.name] as string) ?? "";
          if (f.altName) out[f.altName] = (domain?.[f.altName] as string) ?? "";
        }
        break;
      }
      case "tags": {
        const v = domain?.[f.name];
        out[f.name] = Array.isArray(v) ? v.join(", ") : "";
        break;
      }
      case "lines": {
        const v = domain?.[f.name];
        out[f.name] = Array.isArray(v) ? v.join("\n") : ((v as string) ?? "");
        break;
      }
      case "metrics": {
        const v = domain?.metrics;
        out[f.name] = Array.isArray(v)
          ? v
              .map((m: { value: string; label: string }) =>
                m.value ? `${m.value} | ${m.label}` : m.label,
              )
              .join("\n")
          : "";
        break;
      }
      case "checkbox":
        out[f.name] =
          typeof domain?.[f.name] === "boolean"
            ? (domain[f.name] as boolean)
            : Boolean(f.defaultOn);
        break;
      case "number":
        out[f.name] =
          typeof domain?.[f.name] === "number"
            ? (domain[f.name] as number)
            : f.nullable
              ? ""
              : 0;
        break;
      case "select":
        out[f.name] =
          (domain?.[f.name] as string) ?? f.options?.[0]?.value ?? "";
        break;
      default:
        out[f.name] = (domain?.[f.name] as string) ?? "";
    }
  }
  return out;
}

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

/** Coerce raw form values (strings/booleans) into the entity input shape. */
export function coerceValues(
  entity: EntityKey,
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of ENTITY_FORMS[entity].fields) {
    const v = raw[f.name];
    switch (f.kind) {
      case "number":
        if (f.nullable && (v === "" || v === null || v === undefined)) {
          out[f.name] = null;
        } else {
          out[f.name] = typeof v === "number" ? v : Number(v);
        }
        break;
      case "checkbox":
        out[f.name] = Boolean(v);
        break;
      case "tags":
        out[f.name] = splitTags(typeof v === "string" ? v : "");
        break;
      case "image":
        out[f.name] = typeof v === "string" ? v : "";
        if (f.altName) {
          out[f.altName] =
            typeof raw[f.altName] === "string" ? raw[f.altName] : "";
        }
        break;
      default:
        out[f.name] = v ?? "";
    }
  }
  return out;
}
