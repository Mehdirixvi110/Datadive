import type { MetadataRoute } from "next";
import {
  getPublishedPostSlugs,
  getProjectDetailSlugs,
} from "@/lib/airtable/read";
import { resolveSiteUrl } from "@/lib/seo";

/**
 * Sitemap (design §17, NFR-13.3). Enumerates `/`, `/blog`, every published
 * post, and every `hasDetail` project (from `getProjectDetailSlugs()`) — a
 * bodyless project has no detail URL and is omitted (F6).
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = resolveSiteUrl();
  const abs = (path: string) => new URL(path, base).toString();
  const now = new Date();

  const [postSlugs, projectSlugs] = await Promise.all([
    getPublishedPostSlugs(),
    getProjectDetailSlugs(),
  ]);

  return [
    { url: abs("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: abs("/blog"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...postSlugs.map((slug) => ({
      url: abs(`/blog/${slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...projectSlugs.map((slug) => ({
      url: abs(`/work/${slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
