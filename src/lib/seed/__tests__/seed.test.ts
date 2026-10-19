import { describe, expect, it } from "vitest";
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
} from "../index";
import {
  aboutDomainSchema,
  blogPostDomainSchema,
  clientDomainSchema,
  ctaDomainSchema,
  heroDomainSchema,
  industryDomainSchema,
  navLinkDomainSchema,
  projectDomainSchema,
  reviewDomainSchema,
  serviceDomainSchema,
  settingsDomainSchema,
  statDomainSchema,
  teamMemberDomainSchema,
} from "@/lib/validation/domain";
import type { SectorGroup } from "@/lib/types";

describe("seed validates against domain Zod schemas (no network, no creds)", () => {
  it("singletons are valid", () => {
    expect(settingsDomainSchema.safeParse(SEED_SETTINGS).success).toBe(true);
    expect(heroDomainSchema.safeParse(SEED_HERO).success).toBe(true);
    expect(aboutDomainSchema.safeParse(SEED_ABOUT).success).toBe(true);
    expect(ctaDomainSchema.safeParse(SEED_CTA).success).toBe(true);
  });

  it("every list item is valid", () => {
    SEED_NAV_LINKS.forEach((x) => expect(navLinkDomainSchema.safeParse(x).success).toBe(true));
    SEED_SERVICES.forEach((x) => expect(serviceDomainSchema.safeParse(x).success).toBe(true));
    SEED_INDUSTRIES.forEach((x) => expect(industryDomainSchema.safeParse(x).success).toBe(true));
    SEED_STATS.forEach((x) => expect(statDomainSchema.safeParse(x).success).toBe(true));
    SEED_CLIENTS.forEach((x) => expect(clientDomainSchema.safeParse(x).success).toBe(true));
    SEED_REVIEWS.forEach((x) => expect(reviewDomainSchema.safeParse(x).success).toBe(true));
    SEED_TEAM.forEach((x) => expect(teamMemberDomainSchema.safeParse(x).success).toBe(true));
    SEED_PROJECTS.forEach((x) => expect(projectDomainSchema.safeParse(x).success).toBe(true));
    SEED_BLOG_POSTS.forEach((x) => expect(blogPostDomainSchema.safeParse(x).success).toBe(true));
  });
});

describe("seed completeness (design §8 / source-notes)", () => {
  it("has the expected core counts", () => {
    expect(SEED_SERVICES).toHaveLength(4);
    expect(SEED_INDUSTRIES).toHaveLength(5);
    expect(SEED_STATS).toHaveLength(5);
    expect(SEED_PROJECTS).toHaveLength(9);
    expect(SEED_TEAM).toHaveLength(3);
    expect(SEED_NAV_LINKS).toHaveLength(8);
    expect(SEED_BLOG_POSTS.length).toBeGreaterThanOrEqual(2);
    expect(SEED_REVIEWS.length).toBeGreaterThanOrEqual(2);
  });

  it("uses the contract icon keys for services and industries", () => {
    expect(SEED_SERVICES.map((s) => s.icon)).toEqual([
      "dashboard",
      "bi",
      "ai",
      "custom",
    ]);
    expect(SEED_INDUSTRIES.map((i) => i.icon)).toEqual([
      "hr",
      "health",
      "retail",
      "ops",
      "ml",
    ]);
  });

  it("spreads ≥6 clients with ≥2 per sector bucket", () => {
    expect(SEED_CLIENTS.length).toBeGreaterThanOrEqual(6);
    const buckets: SectorGroup[] = [
      "International & Development",
      "Corporate & Technology",
      "Independent Case Studies",
    ];
    for (const bucket of buckets) {
      expect(
        SEED_CLIENTS.filter((c) => c.sectorGroup === bucket).length,
      ).toBeGreaterThanOrEqual(2);
    }
    // At least one name-only (no logo) client exercises the text fallback.
    expect(SEED_CLIENTS.some((c) => c.logo === null)).toBe(true);
  });

  it("includes both detail and card-only projects (hasDetail split)", () => {
    expect(SEED_PROJECTS.some((p) => p.hasDetail)).toBe(true);
    expect(SEED_PROJECTS.some((p) => !p.hasDetail)).toBe(true);
    // card-only entries have an empty body
    SEED_PROJECTS.filter((p) => !p.hasDetail).forEach((p) =>
      expect(p.body).toBe(""),
    );
  });

  it("seeds the known third team role with a placeholder name", () => {
    const third = SEED_TEAM[2];
    expect(third.role).toBe("Full-Stack & DevOps Engineer");
    expect(third.name.length).toBeGreaterThan(0);
  });

  it("seed images are same-origin raster PNG paths (never SVG)", () => {
    const urls: string[] = [];
    const collect = (ref: { url: string } | null) => {
      if (ref) urls.push(ref.url);
    };
    collect(SEED_HERO.image);
    collect(SEED_ABOUT.image);
    SEED_PROJECTS.forEach((p) => {
      collect(p.cover);
      p.images.forEach((img) => urls.push(img.url));
    });
    SEED_CLIENTS.forEach((c) => collect(c.logo));
    SEED_REVIEWS.forEach((r) => collect(r.avatar));
    SEED_TEAM.forEach((t) => collect(t.photo));
    SEED_BLOG_POSTS.forEach((b) => collect(b.cover));
    for (const url of urls) {
      expect(url.startsWith("/")).toBe(true);
      expect(url.endsWith(".png")).toBe(true);
      expect(url.endsWith(".svg")).toBe(false);
    }
  });
});
