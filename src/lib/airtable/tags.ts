/**
 * Cache-tag constants (design §7). One tag per table, plus per-item
 * `blogpost:{slug}` and `project:{slug}`. Public DAL reads attach these so an
 * admin edit can `revalidateTag(...)` and make the change instant.
 *
 * NOTE: ProjectImages has NO tag of its own — a gallery change revalidates the
 * parent project's `project:{slug}` + `projects` tags (§7/F10).
 */
export const TAGS = {
  settings: "settings",
  hero: "hero",
  about: "about",
  cta: "cta",
  nav: "nav",
  services: "services",
  projects: "projects",
  industries: "industries",
  stats: "stats",
  clients: "clients",
  reviews: "reviews",
  team: "team",
  blogPosts: "blogposts",
} as const;

export function blogPostTag(slug: string): string {
  return `blogpost:${slug}`;
}

export function projectTag(slug: string): string {
  return `project:${slug}`;
}
