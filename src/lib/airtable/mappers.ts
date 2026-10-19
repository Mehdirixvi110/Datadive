import {
  BarChart3,
  BrainCircuit,
  Building2,
  FileBarChart,
  HeartPulse,
  LayoutDashboard,
  ShoppingCart,
  Sparkles,
  Users,
  Workflow,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type {
  About,
  Accent,
  BlogPost,
  Client,
  ContactSubmission,
  Cta,
  Hero,
  ImageRef,
  Industry,
  Metric,
  NavLink,
  Project,
  ProjectImage,
  Review,
  SectorGroup,
  Service,
  Settings,
  Stat,
  SubmissionStatus,
  TeamMember,
} from "@/lib/types";
import type { AirtableRecord } from "./client";
import { FIELDS } from "./schema";

/**
 * Airtable record → domain model (design §6, FR-24.3). Every mapper applies
 * safe defaults for missing/optional fields and NEVER throws on malformed
 * input. Image fields become `{ url, alt } | null`; free-form line fields share
 * ONE tolerant parser.
 */

type Fields = Record<string, unknown>;

const MAX_LINES = 24;
const ACCENTS: Accent[] = ["blue", "amber", "green", "red"];
const SECTOR_GROUPS: SectorGroup[] = [
  "International & Development",
  "Corporate & Technology",
  "Independent Case Studies",
];
const SUBMISSION_STATUSES: SubmissionStatus[] = ["New", "Read", "Archived"];

// --- Safe field accessors ----------------------------------------------------

function str(fields: Fields, key: string): string {
  const v = fields[key];
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

function num(fields: Fields, key: string, fallback = 0): number {
  const v = fields[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function bool(fields: Fields, key: string, fallback = false): boolean {
  const v = fields[key];
  return typeof v === "boolean" ? v : fallback;
}

function strArray(fields: Fields, key: string): string[] {
  const v = fields[key];
  if (Array.isArray(v)) {
    return v
      .filter((x): x is string => typeof x === "string")
      .map((x) => x.trim())
      .filter((x) => x.length > 0);
  }
  return [];
}

/** First linked record id from a "Link to another record" field, or "". */
function firstLinkedId(fields: Fields, key: string): string {
  const v = fields[key];
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return "";
}

function accentOf(fields: Fields, key: string): Accent {
  const v = str(fields, key).toLowerCase();
  return (ACCENTS as string[]).includes(v) ? (v as Accent) : "blue";
}

function imageRef(
  fields: Fields,
  urlKey: string,
  altKey: string,
): ImageRef | null {
  const url = str(fields, urlKey).trim();
  if (url.length === 0) return null;
  return { url, alt: str(fields, altKey) };
}

// --- Tolerant line parsers (ONE shared implementation — §6/F9) --------------

/** Split newlines, trim, drop blanks, cap at MAX_LINES. */
export function parseLines(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, MAX_LINES);
}

/**
 * Parse `value | label` metric lines. Splits on the FIRST `|` only; a line with
 * no `|` degrades to `{ value: '', label: line }` — never dropped, never thrown.
 */
export function parseMetrics(raw: unknown): Metric[] {
  return parseLines(raw).map((line) => {
    const idx = line.indexOf("|");
    if (idx === -1) return { value: "", label: line };
    return {
      value: line.slice(0, idx).trim(),
      label: line.slice(idx + 1).trim(),
    };
  });
}

// --- Icon resolution (contract §5.4/§5.7; Sparkles default) ------------------

const ICON_MAP: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  bi: BarChart3,
  ai: BrainCircuit,
  custom: Wrench,
  etl: Workflow,
  report: FileBarChart,
  hr: Users,
  health: HeartPulse,
  retail: ShoppingCart,
  ops: Building2,
  ml: BrainCircuit,
};

/** Resolve an Airtable icon key to a lucide icon; unknown/empty → Sparkles. */
export function iconFor(key: string | null | undefined): LucideIcon {
  if (!key) return Sparkles;
  return ICON_MAP[key.trim().toLowerCase()] ?? Sparkles;
}

// --- Mappers -----------------------------------------------------------------

export function mapSettings(record: AirtableRecord): Settings {
  const f = record.fields;
  const F = FIELDS.settings;
  return {
    id: record.id,
    name: str(f, F.name),
    brandName: str(f, F.brandName),
    tagline: str(f, F.tagline),
    contactEmail: str(f, F.contactEmail),
    phone: str(f, F.phone),
    whatsappNumber: str(f, F.whatsappNumber).replace(/\D/g, ""),
    whatsappPrefillMessage: str(f, F.whatsappPrefillMessage),
    linkedinUrl: str(f, F.linkedinUrl),
    websiteUrl: str(f, F.websiteUrl),
    addressText: str(f, F.addressText),
    logoLightUrl: str(f, F.logoLightUrl),
    logoDarkUrl: str(f, F.logoDarkUrl),
    ogImageUrl: str(f, F.ogImageUrl),
    primaryCtaLabel: str(f, F.primaryCtaLabel),
    primaryCtaHref: str(f, F.primaryCtaHref),
  };
}

export function mapHero(record: AirtableRecord): Hero {
  const f = record.fields;
  const F = FIELDS.hero;
  return {
    id: record.id,
    name: str(f, F.name),
    eyebrow: str(f, F.eyebrow),
    headline: str(f, F.headline),
    subheadline: str(f, F.subheadline),
    primaryCtaLabel: str(f, F.primaryCtaLabel),
    primaryCtaHref: str(f, F.primaryCtaHref),
    secondaryCtaLabel: str(f, F.secondaryCtaLabel),
    secondaryCtaHref: str(f, F.secondaryCtaHref),
    image: imageRef(f, F.imageUrl, F.imageAlt),
  };
}

export function mapAbout(record: AirtableRecord): About {
  const f = record.fields;
  const F = FIELDS.about;
  return {
    id: record.id,
    name: str(f, F.name),
    heading: str(f, F.heading),
    body: str(f, F.body),
    points: parseLines(f[F.points]),
    image: imageRef(f, F.imageUrl, F.imageAlt),
  };
}

export function mapCta(record: AirtableRecord): Cta {
  const f = record.fields;
  const F = FIELDS.cta;
  return {
    id: record.id,
    name: str(f, F.name),
    heading: str(f, F.heading),
    subtext: str(f, F.subtext),
    primaryCtaLabel: str(f, F.primaryCtaLabel),
    primaryCtaHref: str(f, F.primaryCtaHref),
    secondaryCtaLabel: str(f, F.secondaryCtaLabel),
    secondaryCtaHref: str(f, F.secondaryCtaHref),
  };
}

export function mapNavLink(record: AirtableRecord): NavLink {
  const f = record.fields;
  const F = FIELDS.nav;
  return {
    id: record.id,
    name: str(f, F.name),
    href: str(f, F.href),
    order: num(f, F.order),
    visible: bool(f, F.visible),
    openInNewTab: bool(f, F.openInNewTab),
  };
}

export function mapService(record: AirtableRecord): Service {
  const f = record.fields;
  const F = FIELDS.services;
  return {
    id: record.id,
    name: str(f, F.name),
    description: str(f, F.description),
    icon: str(f, F.icon),
    accent: accentOf(f, F.accent),
    order: num(f, F.order),
    visible: bool(f, F.visible),
  };
}

export function mapIndustry(record: AirtableRecord): Industry {
  const f = record.fields;
  const F = FIELDS.industries;
  return {
    id: record.id,
    name: str(f, F.name),
    description: str(f, F.description),
    icon: str(f, F.icon),
    accent: accentOf(f, F.accent),
    order: num(f, F.order),
    visible: bool(f, F.visible),
  };
}

export function mapStat(record: AirtableRecord): Stat {
  const f = record.fields;
  const F = FIELDS.stats;
  return {
    id: record.id,
    name: str(f, F.name),
    value: num(f, F.value),
    prefix: str(f, F.prefix),
    suffix: str(f, F.suffix),
    displayOverride: str(f, F.displayOverride),
    order: num(f, F.order),
    visible: bool(f, F.visible),
  };
}

export function mapClient(record: AirtableRecord): Client {
  const f = record.fields;
  const F = FIELDS.clients;
  const sector = str(f, F.sectorGroup);
  return {
    id: record.id,
    name: str(f, F.name),
    logo: imageRef(f, F.logoUrl, F.logoAlt),
    sectorGroup: (SECTOR_GROUPS as string[]).includes(sector)
      ? (sector as SectorGroup)
      : "Independent Case Studies",
    websiteUrl: str(f, F.websiteUrl),
    order: num(f, F.order),
    visible: bool(f, F.visible),
  };
}

export function mapReview(record: AirtableRecord): Review {
  const f = record.fields;
  const F = FIELDS.reviews;
  const ratingRaw = f[F.rating];
  const rating =
    typeof ratingRaw === "number" && Number.isFinite(ratingRaw)
      ? Math.min(5, Math.max(1, Math.round(ratingRaw)))
      : null;
  return {
    id: record.id,
    name: str(f, F.name),
    quote: str(f, F.quote),
    role: str(f, F.role),
    company: str(f, F.company),
    avatar: imageRef(f, F.avatarUrl, F.avatarAlt),
    rating,
    order: num(f, F.order),
    published: bool(f, F.published),
  };
}

export function mapTeamMember(record: AirtableRecord): TeamMember {
  const f = record.fields;
  const F = FIELDS.team;
  return {
    id: record.id,
    name: str(f, F.name),
    role: str(f, F.role),
    bio: str(f, F.bio),
    photo: imageRef(f, F.photoUrl, F.photoAlt),
    linkedinUrl: str(f, F.linkedinUrl),
    order: num(f, F.order),
    visible: bool(f, F.visible),
  };
}

export function mapProjectImage(record: AirtableRecord): ProjectImage {
  const f = record.fields;
  const F = FIELDS.projectImages;
  return {
    id: record.id,
    name: str(f, F.name),
    url: str(f, F.imageUrl).trim(),
    alt: str(f, F.alt),
    order: num(f, F.order),
  };
}

/** Parent project id referenced by a ProjectImages row (link field). */
export function projectImageParentId(record: AirtableRecord): string {
  return firstLinkedId(record.fields, FIELDS.projectImages.project);
}

export function mapProject(
  record: AirtableRecord,
  images: ProjectImage[] = [],
): Project {
  const f = record.fields;
  const F = FIELDS.projects;
  const body = str(f, F.body);
  const published = bool(f, F.published);
  return {
    id: record.id,
    name: str(f, F.name),
    slug: str(f, F.slug),
    summary: str(f, F.summary),
    body,
    cover: imageRef(f, F.coverImageUrl, F.coverImageAlt),
    images: [...images].sort((a, b) => a.order - b.order),
    tags: strArray(f, F.tags),
    metrics: parseMetrics(f[F.metrics]),
    featured: bool(f, F.featured),
    order: num(f, F.order),
    published,
    hasDetail: published && body.trim().length > 0,
  };
}

export function mapBlogPost(record: AirtableRecord): BlogPost {
  const f = record.fields;
  const F = FIELDS.blogPosts;
  return {
    id: record.id,
    title: str(f, F.title),
    slug: str(f, F.slug),
    excerpt: str(f, F.excerpt),
    body: str(f, F.body),
    cover: imageRef(f, F.coverImageUrl, F.coverImageAlt),
    author: str(f, F.author),
    publishDate: str(f, F.publishDate),
    published: bool(f, F.published),
    tags: strArray(f, F.tags),
    seoTitle: str(f, F.seoTitle),
    seoDescription: str(f, F.seoDescription),
  };
}

export function mapContactSubmission(record: AirtableRecord): ContactSubmission {
  const f = record.fields;
  const F = FIELDS.contactSubmissions;
  const status = str(f, F.status);
  return {
    id: record.id,
    name: str(f, F.name),
    email: str(f, F.email),
    company: str(f, F.company),
    subject: str(f, F.subject),
    phone: str(f, F.phone),
    message: str(f, F.message),
    submittedAt: str(f, F.submittedAt) || record.createdTime || "",
    status: (SUBMISSION_STATUSES as string[]).includes(status)
      ? (status as SubmissionStatus)
      : "New",
    sourcePage: str(f, F.sourcePage),
  };
}
