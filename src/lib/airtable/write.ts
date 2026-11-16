import "server-only";

import type {
  About,
  BlogPost,
  Client,
  ContactSubmission,
  Cta,
  Hero,
  Industry,
  NavLink,
  Project,
  ProjectImage,
  Review,
  Service,
  Settings,
  Stat,
  SubmissionStatus,
  TeamMember,
} from "@/lib/types";
import type {
  AboutInput,
  BlogPostInput,
  ClientInput,
  CtaInput,
  HeroInput,
  IndustryInput,
  NavLinkInput,
  ProjectImageInput,
  ProjectInput,
  ReviewInput,
  ServiceInput,
  StatInput,
  TeamMemberInput,
} from "@/lib/validation/entities";
import type { SettingsInput } from "@/lib/validation/settings";
import type { ContactInput } from "@/lib/validation/contact";
import { hasAirtableCreds, logger } from "@/lib/utils";
import {
  createRecord,
  deleteRecord,
  listRecords,
  updateRecord,
  type AirtableRecord,
} from "./client";
import {
  mapAbout,
  mapBlogPost,
  mapClient,
  mapContactSubmission,
  mapCta,
  mapHero,
  mapIndustry,
  mapNavLink,
  mapProject,
  mapProjectImage,
  mapReview,
  mapService,
  mapSettings,
  mapStat,
  mapTeamMember,
} from "./mappers";
import { FIELDS, TABLES } from "./schema";

/**
 * Typed DAL writes (design §6/§14). Admin-only except `createContactSubmission`
 * (the one public write). Each writer gates on `hasAirtableCreds()` first and
 * returns a typed result — callers (server actions) own Zod validation and
 * `revalidateTag`. Writers never throw into a caller; Airtable failures map to
 * a typed `airtable` result.
 */

export type WriteErrorCode = "no-backend" | "airtable";

export type WriteResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: WriteErrorCode; message: string };

type Fields = Record<string, unknown>;

function noBackend<T>(): WriteResult<T> {
  logger.warn("write skipped — Airtable backend not configured");
  return {
    ok: false,
    error: "no-backend",
    message: "Content backend not configured — saves are disabled.",
  };
}

function airtableFail<T>(table: string, err: unknown): WriteResult<T> {
  logger.error(`write ${table} failed`, { err: String(err) });
  return {
    ok: false,
    error: "airtable",
    message: "Couldn't save — please try again.",
  };
}

async function doCreate<T>(
  table: string,
  fields: Fields,
  map: (r: AirtableRecord) => T,
): Promise<WriteResult<T>> {
  if (!hasAirtableCreds()) return noBackend();
  try {
    const rec = await createRecord(table, fields);
    return { ok: true, data: map(rec) };
  } catch (err) {
    return airtableFail(table, err);
  }
}

async function doUpdate<T>(
  table: string,
  id: string,
  fields: Fields,
  map: (r: AirtableRecord) => T,
): Promise<WriteResult<T>> {
  if (!hasAirtableCreds()) return noBackend();
  try {
    const rec = await updateRecord(table, id, fields);
    return { ok: true, data: map(rec) };
  } catch (err) {
    return airtableFail(table, err);
  }
}

async function doDelete(table: string, id: string): Promise<WriteResult<{ id: string }>> {
  if (!hasAirtableCreds()) return noBackend();
  try {
    await deleteRecord(table, id);
    return { ok: true, data: { id } };
  } catch (err) {
    return airtableFail(table, err);
  }
}

/** Upsert a singleton: patch the first/only row, or create it if none exists. */
async function upsertSingleton<T>(
  table: string,
  fields: Fields,
  map: (r: AirtableRecord) => T,
): Promise<WriteResult<T>> {
  if (!hasAirtableCreds()) return noBackend();
  try {
    const existing = await listRecords(table, { audience: "admin" });
    const rec =
      existing.length > 0
        ? await updateRecord(table, existing[0].id, fields)
        : await createRecord(table, fields);
    return { ok: true, data: map(rec) };
  } catch (err) {
    return airtableFail(table, err);
  }
}

// --- Field serializers (input → Airtable fields) ----------------------------

function serviceFields(input: ServiceInput): Fields {
  const F = FIELDS.services;
  return {
    [F.name]: input.name,
    [F.description]: input.description,
    [F.icon]: input.icon,
    [F.accent]: input.accent,
    [F.order]: input.order,
    [F.visible]: input.visible,
  };
}

function industryFields(input: IndustryInput): Fields {
  const F = FIELDS.industries;
  return {
    [F.name]: input.name,
    [F.description]: input.description,
    [F.icon]: input.icon,
    [F.accent]: input.accent,
    [F.order]: input.order,
    [F.visible]: input.visible,
  };
}

function statFields(input: StatInput): Fields {
  const F = FIELDS.stats;
  return {
    [F.name]: input.name,
    [F.value]: input.value,
    [F.prefix]: input.prefix,
    [F.suffix]: input.suffix,
    [F.displayOverride]: input.displayOverride,
    [F.order]: input.order,
    [F.visible]: input.visible,
  };
}

function clientFields(input: ClientInput): Fields {
  const F = FIELDS.clients;
  return {
    [F.name]: input.name,
    [F.logoUrl]: input.logoUrl,
    [F.logoAlt]: input.logoAlt,
    [F.sectorGroup]: input.sectorGroup,
    [F.websiteUrl]: input.websiteUrl,
    [F.order]: input.order,
    [F.visible]: input.visible,
  };
}

function reviewFields(input: ReviewInput): Fields {
  const F = FIELDS.reviews;
  return {
    [F.name]: input.name,
    [F.quote]: input.quote,
    [F.role]: input.role,
    [F.company]: input.company,
    [F.avatarUrl]: input.avatarUrl,
    [F.avatarAlt]: input.avatarAlt,
    [F.rating]: input.rating ?? null,
    [F.order]: input.order,
    [F.published]: input.published,
  };
}

function teamMemberFields(input: TeamMemberInput): Fields {
  const F = FIELDS.team;
  return {
    [F.name]: input.name,
    [F.role]: input.role,
    [F.bio]: input.bio,
    [F.photoUrl]: input.photoUrl,
    [F.photoAlt]: input.photoAlt,
    [F.linkedinUrl]: input.linkedinUrl,
    [F.order]: input.order,
    [F.visible]: input.visible,
  };
}

function navLinkFields(input: NavLinkInput): Fields {
  const F = FIELDS.nav;
  return {
    [F.name]: input.name,
    [F.href]: input.href,
    [F.order]: input.order,
    [F.visible]: input.visible,
    [F.openInNewTab]: input.openInNewTab,
  };
}

function projectFields(input: ProjectInput): Fields {
  const F = FIELDS.projects;
  return {
    [F.name]: input.name,
    [F.slug]: input.slug,
    [F.summary]: input.summary,
    [F.body]: input.body,
    [F.coverImageUrl]: input.coverImageUrl,
    [F.coverImageAlt]: input.coverImageAlt,
    [F.tags]: input.tags,
    [F.metrics]: input.metrics,
    [F.featured]: input.featured,
    [F.order]: input.order,
    [F.published]: input.published,
  };
}

function blogPostFields(input: BlogPostInput): Fields {
  const F = FIELDS.blogPosts;
  return {
    [F.title]: input.title,
    [F.slug]: input.slug,
    [F.excerpt]: input.excerpt,
    [F.body]: input.body,
    [F.coverImageUrl]: input.coverImageUrl,
    [F.coverImageAlt]: input.coverImageAlt,
    [F.author]: input.author,
    [F.publishDate]: input.publishDate,
    [F.published]: input.published,
    [F.tags]: input.tags,
    [F.seoTitle]: input.seoTitle,
    [F.seoDescription]: input.seoDescription,
  };
}

function heroFields(input: HeroInput): Fields {
  const F = FIELDS.hero;
  return {
    [F.name]: input.name,
    [F.eyebrow]: input.eyebrow,
    [F.headline]: input.headline,
    [F.subheadline]: input.subheadline,
    [F.primaryCtaLabel]: input.primaryCtaLabel,
    [F.primaryCtaHref]: input.primaryCtaHref,
    [F.secondaryCtaLabel]: input.secondaryCtaLabel,
    [F.secondaryCtaHref]: input.secondaryCtaHref,
    [F.imageUrl]: input.imageUrl,
    [F.imageAlt]: input.imageAlt,
  };
}

function aboutFields(input: AboutInput): Fields {
  const F = FIELDS.about;
  return {
    [F.name]: input.name,
    [F.heading]: input.heading,
    [F.body]: input.body,
    [F.points]: input.points,
    [F.imageUrl]: input.imageUrl,
    [F.imageAlt]: input.imageAlt,
  };
}

function ctaFields(input: CtaInput): Fields {
  const F = FIELDS.cta;
  return {
    [F.name]: input.name,
    [F.heading]: input.heading,
    [F.subtext]: input.subtext,
    [F.primaryCtaLabel]: input.primaryCtaLabel,
    [F.primaryCtaHref]: input.primaryCtaHref,
    [F.secondaryCtaLabel]: input.secondaryCtaLabel,
    [F.secondaryCtaHref]: input.secondaryCtaHref,
  };
}

function settingsFields(input: SettingsInput): Fields {
  const F = FIELDS.settings;
  return {
    [F.name]: input.name,
    [F.brandName]: input.brandName,
    [F.tagline]: input.tagline,
    [F.contactEmail]: input.contactEmail,
    [F.phone]: input.phone,
    [F.whatsappNumber]: input.whatsappNumber,
    [F.whatsappPrefillMessage]: input.whatsappPrefillMessage,
    [F.linkedinUrl]: input.linkedinUrl,
    [F.websiteUrl]: input.websiteUrl,
    [F.addressText]: input.addressText,
    [F.logoLightUrl]: input.logoLightUrl,
    [F.logoDarkUrl]: input.logoDarkUrl,
    [F.ogImageUrl]: input.ogImageUrl,
    [F.primaryCtaLabel]: input.primaryCtaLabel,
    [F.primaryCtaHref]: input.primaryCtaHref,
  };
}

// --- List entity writers -----------------------------------------------------

export const createService = (input: ServiceInput) =>
  doCreate(TABLES.services, serviceFields(input), mapService);
export const updateService = (id: string, input: ServiceInput) =>
  doUpdate(TABLES.services, id, serviceFields(input), mapService);
export const deleteService = (id: string) => doDelete(TABLES.services, id);

export const createIndustry = (input: IndustryInput) =>
  doCreate(TABLES.industries, industryFields(input), mapIndustry);
export const updateIndustry = (id: string, input: IndustryInput) =>
  doUpdate(TABLES.industries, id, industryFields(input), mapIndustry);
export const deleteIndustry = (id: string) => doDelete(TABLES.industries, id);

export const createStat = (input: StatInput) =>
  doCreate(TABLES.stats, statFields(input), mapStat);
export const updateStat = (id: string, input: StatInput) =>
  doUpdate(TABLES.stats, id, statFields(input), mapStat);
export const deleteStat = (id: string) => doDelete(TABLES.stats, id);

export const createClient = (input: ClientInput) =>
  doCreate(TABLES.clients, clientFields(input), mapClient);
export const updateClient = (id: string, input: ClientInput) =>
  doUpdate(TABLES.clients, id, clientFields(input), mapClient);
export const deleteClient = (id: string) => doDelete(TABLES.clients, id);

export const createReview = (input: ReviewInput) =>
  doCreate(TABLES.reviews, reviewFields(input), mapReview);
export const updateReview = (id: string, input: ReviewInput) =>
  doUpdate(TABLES.reviews, id, reviewFields(input), mapReview);
export const deleteReview = (id: string) => doDelete(TABLES.reviews, id);

export const createTeamMember = (input: TeamMemberInput) =>
  doCreate(TABLES.team, teamMemberFields(input), mapTeamMember);
export const updateTeamMember = (id: string, input: TeamMemberInput) =>
  doUpdate(TABLES.team, id, teamMemberFields(input), mapTeamMember);
export const deleteTeamMember = (id: string) => doDelete(TABLES.team, id);

export const createNavLink = (input: NavLinkInput) =>
  doCreate(TABLES.nav, navLinkFields(input), mapNavLink);
export const updateNavLink = (id: string, input: NavLinkInput) =>
  doUpdate(TABLES.nav, id, navLinkFields(input), mapNavLink);
export const deleteNavLink = (id: string) => doDelete(TABLES.nav, id);

export const createProject = (input: ProjectInput) =>
  doCreate(TABLES.projects, projectFields(input), (r) => mapProject(r));
export const updateProject = (id: string, input: ProjectInput) =>
  doUpdate(TABLES.projects, id, projectFields(input), (r) => mapProject(r));
export const deleteProject = (id: string) => doDelete(TABLES.projects, id);

export const createBlogPost = (input: BlogPostInput) =>
  doCreate(TABLES.blogPosts, blogPostFields(input), mapBlogPost);
export const updateBlogPost = (id: string, input: BlogPostInput) =>
  doUpdate(TABLES.blogPosts, id, blogPostFields(input), mapBlogPost);
export const deleteBlogPost = (id: string) => doDelete(TABLES.blogPosts, id);

// --- Singleton upserts -------------------------------------------------------

export const updateHero = (input: HeroInput): Promise<WriteResult<Hero>> =>
  upsertSingleton(TABLES.hero, heroFields(input), mapHero);
export const updateAbout = (input: AboutInput): Promise<WriteResult<About>> =>
  upsertSingleton(TABLES.about, aboutFields(input), mapAbout);
export const updateCta = (input: CtaInput): Promise<WriteResult<Cta>> =>
  upsertSingleton(TABLES.cta, ctaFields(input), mapCta);
export const updateSettings = (
  input: SettingsInput,
): Promise<WriteResult<Settings>> =>
  upsertSingleton(TABLES.settings, settingsFields(input), mapSettings);

// --- ProjectImages writers (gallery editor — §6/§12) ------------------------

/** Create a gallery image. The `Project` link MUST be an id ARRAY. */
export const createProjectImage = (
  input: ProjectImageInput & { projectId: string },
): Promise<WriteResult<ProjectImage>> => {
  const F = FIELDS.projectImages;
  return doCreate(
    TABLES.projectImages,
    {
      [F.name]: input.name,
      [F.project]: [input.projectId],
      [F.imageUrl]: input.imageUrl,
      [F.alt]: input.alt,
      [F.order]: input.order,
    },
    mapProjectImage,
  );
};

export const updateProjectImage = (
  id: string,
  input: ProjectImageInput,
): Promise<WriteResult<ProjectImage>> => {
  const F = FIELDS.projectImages;
  return doUpdate(
    TABLES.projectImages,
    id,
    {
      [F.name]: input.name,
      [F.imageUrl]: input.imageUrl,
      [F.alt]: input.alt,
      [F.order]: input.order,
    },
    mapProjectImage,
  );
};

export const deleteProjectImage = (id: string) =>
  doDelete(TABLES.projectImages, id);

// --- Contact + submissions ---------------------------------------------------

/** The only public write. Sets Status:'New' explicitly (Airtable has no default). */
export const createContactSubmission = (
  input: Omit<ContactInput, "website">,
  sourcePage = "",
): Promise<WriteResult<ContactSubmission>> => {
  const F = FIELDS.contactSubmissions;
  return doCreate(
    TABLES.contactSubmissions,
    {
      [F.name]: input.name,
      [F.email]: input.email,
      [F.company]: input.company ?? "",
      [F.subject]: input.subject ?? "",
      [F.phone]: input.phone ?? "",
      [F.message]: input.message,
      [F.status]: "New",
      [F.sourcePage]: sourcePage,
    },
    mapContactSubmission,
  );
};

export const updateSubmissionStatus = (
  id: string,
  status: SubmissionStatus,
): Promise<WriteResult<ContactSubmission>> =>
  doUpdate(
    TABLES.contactSubmissions,
    id,
    { [FIELDS.contactSubmissions.status]: status },
    mapContactSubmission,
  );

// --- Reorder writers (OrderControls — §12) ----------------------------------

/**
 * Persist a new display order by patching ONLY the `Order` field on each
 * changed record. Used by the admin list reorder controls; gates on creds and
 * never throws into the caller (typed result like every other writer).
 */
async function reorderRecords(
  table: string,
  orderField: string,
  items: { id: string; order: number }[],
): Promise<WriteResult<{ count: number }>> {
  if (!hasAirtableCreds()) return noBackend();
  try {
    for (const item of items) {
      await updateRecord(table, item.id, { [orderField]: item.order });
    }
    return { ok: true, data: { count: items.length } };
  } catch (err) {
    return airtableFail(table, err);
  }
}

type OrderItems = { id: string; order: number }[];

export const reorderServices = (items: OrderItems) =>
  reorderRecords(TABLES.services, FIELDS.services.order, items);
export const reorderIndustries = (items: OrderItems) =>
  reorderRecords(TABLES.industries, FIELDS.industries.order, items);
export const reorderStats = (items: OrderItems) =>
  reorderRecords(TABLES.stats, FIELDS.stats.order, items);
export const reorderClients = (items: OrderItems) =>
  reorderRecords(TABLES.clients, FIELDS.clients.order, items);
export const reorderReviews = (items: OrderItems) =>
  reorderRecords(TABLES.reviews, FIELDS.reviews.order, items);
export const reorderTeam = (items: OrderItems) =>
  reorderRecords(TABLES.team, FIELDS.team.order, items);
export const reorderNavLinks = (items: OrderItems) =>
  reorderRecords(TABLES.nav, FIELDS.nav.order, items);
export const reorderProjects = (items: OrderItems) =>
  reorderRecords(TABLES.projects, FIELDS.projects.order, items);
