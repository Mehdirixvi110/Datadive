/**
 * Datadive domain models (design §5/§6).
 *
 * These are the camelCase shapes the DAL (`src/lib/airtable/read.ts`) and the
 * seed module (`src/lib/seed`) return. Public pages and the admin UI consume
 * these types only — never raw Airtable records. Image fields are normalized to
 * `{ url, alt } | null`; free-form line fields (About.points, Project.metrics)
 * are pre-parsed arrays.
 */

/** A resolved image: a validated URL plus its required alt text, or null. */
export interface ImageRef {
  url: string;
  alt: string;
}

/** Card/section accent color (design §16). */
export type Accent = "blue" | "amber" | "green" | "red";

/** A parsed `value | label` metric line (design §5.5). */
export interface Metric {
  value: string;
  label: string;
}

/** Client sector bucket (design §5.9). */
export type SectorGroup =
  | "International & Development"
  | "Corporate & Technology"
  | "Independent Case Studies";

/** Contact-submission triage state (design §5.15). */
export type SubmissionStatus = "New" | "Read" | "Archived";

export interface Settings {
  id: string;
  name: string;
  brandName: string;
  tagline: string;
  contactEmail: string;
  phone: string;
  /** Digits only (normalized, §13); empty → WhatsApp button hidden. */
  whatsappNumber: string;
  whatsappPrefillMessage: string;
  linkedinUrl: string;
  websiteUrl: string;
  addressText: string;
  logoLightUrl: string;
  logoDarkUrl: string;
  ogImageUrl: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
}

export interface Hero {
  id: string;
  name: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  image: ImageRef | null;
}

export interface About {
  id: string;
  name: string;
  heading: string;
  /** Markdown; rendered sanitized by consumers. */
  body: string;
  points: string[];
  image: ImageRef | null;
}

export interface Cta {
  id: string;
  name: string;
  heading: string;
  subtext: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
}

export interface NavLink {
  id: string;
  name: string;
  href: string;
  order: number;
  visible: boolean;
  openInNewTab: boolean;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  /** Raw icon key; resolve to a lucide icon via `iconFor` (mappers.ts). */
  icon: string;
  accent: Accent;
  order: number;
  visible: boolean;
}

export interface ProjectImage {
  id: string;
  name: string;
  url: string;
  alt: string;
  order: number;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  summary: string;
  /** Markdown; non-empty Body is what makes `hasDetail` true (§5.5). */
  body: string;
  cover: ImageRef | null;
  images: ProjectImage[];
  tags: string[];
  metrics: Metric[];
  featured: boolean;
  order: number;
  published: boolean;
  /** Published === true && body non-empty (§5.5). Governs /work/[slug]. */
  hasDetail: boolean;
}

export interface Industry {
  id: string;
  name: string;
  description: string;
  icon: string;
  accent: Accent;
  order: number;
  visible: boolean;
}

export interface Stat {
  id: string;
  name: string;
  value: number;
  prefix: string;
  suffix: string;
  /** If set, shown verbatim (no count-up). */
  displayOverride: string;
  order: number;
  visible: boolean;
}

export interface Client {
  id: string;
  name: string;
  logo: ImageRef | null;
  sectorGroup: SectorGroup;
  websiteUrl: string;
  order: number;
  visible: boolean;
}

export interface Review {
  id: string;
  name: string;
  quote: string;
  role: string;
  company: string;
  avatar: ImageRef | null;
  /** 1–5, or null when unrated. */
  rating: number | null;
  order: number;
  published: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: ImageRef | null;
  linkedinUrl: string;
  order: number;
  visible: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  /** Markdown; rendered sanitized. */
  body: string;
  cover: ImageRef | null;
  author: string;
  /** ISO date string. */
  publishDate: string;
  published: boolean;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  company: string;
  subject: string;
  phone: string;
  message: string;
  /** Airtable-managed created time (ISO). */
  submittedAt: string;
  status: SubmissionStatus;
  sourcePage: string;
}
