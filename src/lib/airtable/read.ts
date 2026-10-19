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
  TeamMember,
} from "@/lib/types";
import {
  SEED_ABOUT,
  SEED_BLOG_POSTS,
  SEED_CLIENTS,
  SEED_CTA,
  SEED_HERO,
  SEED_INDUSTRIES,
  SEED_NAV_LINKS,
  SEED_PROJECTS,
  SEED_REVIEWS,
  SEED_SERVICES,
  SEED_SETTINGS,
  SEED_STATS,
  SEED_TEAM,
} from "@/lib/seed";
import { hasAirtableCreds, logger } from "@/lib/utils";
import { listRecords, getRecordById, type AirtableRecord } from "./client";
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
  projectImageParentId,
} from "./mappers";
import { TABLES } from "./schema";
import { TAGS, projectTag } from "./tags";

/**
 * Typed data-access reads (design §6/§8/§14). Public reads apply
 * Published/Visible filtering + ordering INSIDE this module and are cached
 * (`next:{revalidate:3600,tags}`). Admin reads (`getAll*`, `getXById`,
 * `getSubmissions`) are live (`cache:'no-store'`, no tags). Reads NEVER throw
 * into a page: on failure they degrade to seed/empty and log server-side.
 */

const byOrder = <T extends { order: number }>(a: T, b: T): number =>
  a.order - b.order;

// --- Singleton reads (empty table → seed singleton, never blank) ------------

async function readSingleton<T>(
  table: string,
  tag: string,
  map: (r: AirtableRecord) => T,
  seed: T,
): Promise<T> {
  if (!hasAirtableCreds()) return seed;
  try {
    const records = await listRecords(table, {
      audience: "public",
      tags: [tag],
    });
    if (records.length === 0) return seed;
    return map(records[0]);
  } catch (err) {
    logger.error(`read ${table} failed`, { err: String(err) });
    return seed;
  }
}

export function getSettings(): Promise<Settings> {
  return readSingleton(TABLES.settings, TAGS.settings, mapSettings, SEED_SETTINGS);
}

export function getHero(): Promise<Hero> {
  return readSingleton(TABLES.hero, TAGS.hero, mapHero, SEED_HERO);
}

export function getAbout(): Promise<About> {
  return readSingleton(TABLES.about, TAGS.about, mapAbout, SEED_ABOUT);
}

export function getCta(): Promise<Cta> {
  return readSingleton(TABLES.cta, TAGS.cta, mapCta, SEED_CTA);
}

// --- Public list reads (empty table → real empty set; error → seed) ---------

async function readList<T extends { order: number }>(
  table: string,
  tag: string,
  map: (r: AirtableRecord) => T,
  keep: (item: T) => boolean,
  seed: T[],
): Promise<T[]> {
  if (!hasAirtableCreds()) return seed;
  try {
    const records = await listRecords(table, {
      audience: "public",
      tags: [tag],
    });
    return records.map(map).filter(keep).sort(byOrder);
  } catch (err) {
    logger.error(`read ${table} failed`, { err: String(err) });
    return seed;
  }
}

export function getNavLinks(): Promise<NavLink[]> {
  return readList(TABLES.nav, TAGS.nav, mapNavLink, (n) => n.visible, SEED_NAV_LINKS);
}

export function getServices(): Promise<Service[]> {
  return readList(TABLES.services, TAGS.services, mapService, (s) => s.visible, SEED_SERVICES);
}

export function getIndustries(): Promise<Industry[]> {
  return readList(TABLES.industries, TAGS.industries, mapIndustry, (i) => i.visible, SEED_INDUSTRIES);
}

export function getStats(): Promise<Stat[]> {
  return readList(TABLES.stats, TAGS.stats, mapStat, (s) => s.visible, SEED_STATS);
}

export function getClients(): Promise<Client[]> {
  return readList(TABLES.clients, TAGS.clients, mapClient, (c) => c.visible, SEED_CLIENTS);
}

export function getTeam(): Promise<TeamMember[]> {
  return readList(TABLES.team, TAGS.team, mapTeamMember, (t) => t.visible, SEED_TEAM);
}

/**
 * Reviews — the ONE list that reinjects seed on an empty live table (FR-9.2).
 * No creds → seed; empty published set → seed; otherwise the live rows.
 */
export async function getReviews(): Promise<Review[]> {
  if (!hasAirtableCreds()) return SEED_REVIEWS;
  try {
    const records = await listRecords(TABLES.reviews, {
      audience: "public",
      tags: [TAGS.reviews],
    });
    const published = records
      .map(mapReview)
      .filter((r) => r.published)
      .sort(byOrder);
    return published.length === 0 ? SEED_REVIEWS : published;
  } catch (err) {
    logger.error("read Reviews failed", { err: String(err) });
    return SEED_REVIEWS;
  }
}

export async function getProjects(): Promise<Project[]> {
  if (!hasAirtableCreds()) return SEED_PROJECTS.filter((p) => p.published);
  try {
    const records = await listRecords(TABLES.projects, {
      audience: "public",
      tags: [TAGS.projects],
    });
    return records
      .map((r) => mapProject(r))
      .filter((p) => p.published)
      .sort(byOrder);
  } catch (err) {
    logger.error("read Projects failed", { err: String(err) });
    return SEED_PROJECTS.filter((p) => p.published);
  }
}

async function fetchProjectImages(
  projectId: string,
  slug: string,
  audience: "public" | "admin",
): Promise<ProjectImage[]> {
  const records = await listRecords(TABLES.projectImages, {
    audience,
    tags: audience === "public" ? [projectTag(slug)] : [],
  });
  return records
    .filter((r) => projectImageParentId(r) === projectId)
    .map(mapProjectImage)
    .sort((a, b) => a.order - b.order);
}

/** Public project detail: null unless Published === true (no draft leak). */
export async function getProject(slug: string): Promise<Project | null> {
  if (!hasAirtableCreds()) {
    return SEED_PROJECTS.find((p) => p.slug === slug && p.published) ?? null;
  }
  try {
    const records = await listRecords(TABLES.projects, {
      audience: "public",
      tags: [TAGS.projects, projectTag(slug)],
    });
    const rec = records.find((r) => mapProject(r).slug === slug);
    if (!rec) return null;
    const base = mapProject(rec);
    if (!base.published) return null;
    const images = await fetchProjectImages(rec.id, slug, "public");
    return mapProject(rec, images);
  } catch (err) {
    logger.error("read Project failed", { err: String(err) });
    return SEED_PROJECTS.find((p) => p.slug === slug && p.published) ?? null;
  }
}

/** Slugs with a detail page: Published && Body non-empty (§5.5). */
export async function getProjectDetailSlugs(): Promise<string[]> {
  if (!hasAirtableCreds()) {
    return SEED_PROJECTS.filter((p) => p.hasDetail).map((p) => p.slug);
  }
  try {
    const records = await listRecords(TABLES.projects, {
      audience: "public",
      tags: [TAGS.projects],
    });
    return records
      .map((r) => mapProject(r))
      .filter((p) => p.hasDetail)
      .map((p) => p.slug);
  } catch (err) {
    logger.error("read Project slugs failed", { err: String(err) });
    return SEED_PROJECTS.filter((p) => p.hasDetail).map((p) => p.slug);
  }
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  if (!hasAirtableCreds()) return publishedByDate(SEED_BLOG_POSTS);
  try {
    const records = await listRecords(TABLES.blogPosts, {
      audience: "public",
      tags: [TAGS.blogPosts],
    });
    return publishedByDate(records.map(mapBlogPost));
  } catch (err) {
    logger.error("read BlogPosts failed", { err: String(err) });
    return publishedByDate(SEED_BLOG_POSTS);
  }
}

function publishedByDate(posts: BlogPost[]): BlogPost[] {
  return posts
    .filter((p) => p.published)
    .sort((a, b) => Date.parse(b.publishDate) - Date.parse(a.publishDate));
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  if (!hasAirtableCreds()) {
    return SEED_BLOG_POSTS.find((p) => p.slug === slug && p.published) ?? null;
  }
  try {
    const records = await listRecords(TABLES.blogPosts, {
      audience: "public",
      tags: [TAGS.blogPosts],
    });
    const post = records.map(mapBlogPost).find((p) => p.slug === slug);
    if (!post || !post.published) return null;
    return post;
  } catch (err) {
    logger.error("read BlogPost failed", { err: String(err) });
    return SEED_BLOG_POSTS.find((p) => p.slug === slug && p.published) ?? null;
  }
}

export async function getPublishedPostSlugs(): Promise<string[]> {
  const posts = await getBlogPosts();
  return posts.map((p) => p.slug);
}

// --- Admin reads (live, uncached, no tags; include drafts/hidden) -----------

async function readAllAdmin<T extends { order: number }>(
  table: string,
  map: (r: AirtableRecord) => T,
): Promise<T[]> {
  if (!hasAirtableCreds()) return [];
  const records = await listRecords(table, { audience: "admin" });
  return records.map(map).sort(byOrder);
}

export function getAllServices(): Promise<Service[]> {
  return readAllAdmin(TABLES.services, mapService);
}
export function getAllProjects(): Promise<Project[]> {
  return readAllAdmin(TABLES.projects, (r) => mapProject(r));
}
export function getAllIndustries(): Promise<Industry[]> {
  return readAllAdmin(TABLES.industries, mapIndustry);
}
export function getAllStats(): Promise<Stat[]> {
  return readAllAdmin(TABLES.stats, mapStat);
}
export function getAllClients(): Promise<Client[]> {
  return readAllAdmin(TABLES.clients, mapClient);
}
export function getAllReviews(): Promise<Review[]> {
  return readAllAdmin(TABLES.reviews, mapReview);
}
export function getAllTeam(): Promise<TeamMember[]> {
  return readAllAdmin(TABLES.team, mapTeamMember);
}
export function getAllNavLinks(): Promise<NavLink[]> {
  return readAllAdmin(TABLES.nav, mapNavLink);
}
export function getAllBlogPosts(): Promise<BlogPost[]> {
  if (!hasAirtableCreds()) return Promise.resolve([]);
  return listRecords(TABLES.blogPosts, { audience: "admin" }).then((records) =>
    records
      .map(mapBlogPost)
      .sort((a, b) => Date.parse(b.publishDate) - Date.parse(a.publishDate)),
  );
}

async function readByIdAdmin<T>(
  table: string,
  id: string,
  map: (r: AirtableRecord) => T,
): Promise<T | null> {
  if (!hasAirtableCreds()) return null;
  const record = await getRecordById(table, id, { audience: "admin" });
  return record ? map(record) : null;
}

export function getServiceById(id: string): Promise<Service | null> {
  return readByIdAdmin(TABLES.services, id, mapService);
}
export function getIndustryById(id: string): Promise<Industry | null> {
  return readByIdAdmin(TABLES.industries, id, mapIndustry);
}
export function getStatById(id: string): Promise<Stat | null> {
  return readByIdAdmin(TABLES.stats, id, mapStat);
}
export function getClientById(id: string): Promise<Client | null> {
  return readByIdAdmin(TABLES.clients, id, mapClient);
}
export function getReviewById(id: string): Promise<Review | null> {
  return readByIdAdmin(TABLES.reviews, id, mapReview);
}
export function getTeamMemberById(id: string): Promise<TeamMember | null> {
  return readByIdAdmin(TABLES.team, id, mapTeamMember);
}
export function getNavLinkById(id: string): Promise<NavLink | null> {
  return readByIdAdmin(TABLES.nav, id, mapNavLink);
}
export function getBlogPostById(id: string): Promise<BlogPost | null> {
  return readByIdAdmin(TABLES.blogPosts, id, mapBlogPost);
}

/** Admin project by id, with its gallery images joined. */
export async function getProjectById(id: string): Promise<Project | null> {
  if (!hasAirtableCreds()) return null;
  const record = await getRecordById(TABLES.projects, id, { audience: "admin" });
  if (!record) return null;
  const base = mapProject(record);
  const images = await fetchProjectImages(record.id, base.slug, "admin");
  return mapProject(record, images);
}

export async function getSubmissions(): Promise<ContactSubmission[]> {
  if (!hasAirtableCreds()) return [];
  const records = await listRecords(TABLES.contactSubmissions, {
    audience: "admin",
  });
  return records
    .map(mapContactSubmission)
    .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));
}
