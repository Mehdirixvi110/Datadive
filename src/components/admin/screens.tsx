import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui";
import { EntityTable, type AdminRow } from "./EntityTable";
import { EntityForm } from "./EntityForm";
import {
  buildDefaults,
  type ListKey,
  type SingletonKey,
} from "@/lib/admin/entities";
import type { AdminFormState } from "@/lib/admin/result";
import { hasAirtableCreds, hasBlobToken } from "@/lib/utils";
import type {
  BlogPost,
  Client,
  Industry,
  NavLink,
  Project,
  Review,
  Service,
  Stat,
  TeamMember,
} from "@/lib/types";
import {
  getAbout,
  getAllBlogPosts,
  getAllClients,
  getAllIndustries,
  getAllNavLinks,
  getAllProjects,
  getAllReviews,
  getAllServices,
  getAllStats,
  getAllTeam,
  getBlogPostById,
  getClientById,
  getCta,
  getHero,
  getIndustryById,
  getNavLinkById,
  getProjectById,
  getReviewById,
  getServiceById,
  getSettings,
  getStatById,
  getTeamMemberById,
} from "@/lib/airtable/read";
import {
  SEED_BLOG_POSTS,
  SEED_CLIENTS,
  SEED_INDUSTRIES,
  SEED_NAV_LINKS,
  SEED_PROJECTS,
  SEED_REVIEWS,
  SEED_SERVICES,
  SEED_STATS,
  SEED_TEAM,
} from "@/lib/seed";
import {
  createNavLinkAction,
  deleteNavLinkAction,
  reorderNavLinksAction,
  updateNavLinkAction,
} from "@/app/admin/actions/nav";
import {
  createServiceAction,
  deleteServiceAction,
  reorderServicesAction,
  updateServiceAction,
} from "@/app/admin/actions/services";
import {
  createIndustryAction,
  deleteIndustryAction,
  reorderIndustriesAction,
  updateIndustryAction,
} from "@/app/admin/actions/industries";
import {
  createStatAction,
  deleteStatAction,
  reorderStatsAction,
  updateStatAction,
} from "@/app/admin/actions/stats";
import {
  createClientAction,
  deleteClientAction,
  reorderClientsAction,
  updateClientAction,
} from "@/app/admin/actions/clients";
import {
  createReviewAction,
  deleteReviewAction,
  reorderReviewsAction,
  updateReviewAction,
} from "@/app/admin/actions/reviews";
import {
  createTeamMemberAction,
  deleteTeamMemberAction,
  reorderTeamAction,
  updateTeamMemberAction,
} from "@/app/admin/actions/team";
import {
  createProjectAction,
  deleteProjectAction,
  reorderProjectsAction,
  updateProjectAction,
} from "@/app/admin/actions/projects";
import {
  createBlogPostAction,
  deleteBlogPostAction,
  updateBlogPostAction,
} from "@/app/admin/actions/blog";
import {
  saveAbout,
  saveCta,
  saveHero,
  saveSettings,
} from "@/app/admin/actions/singletons";

/**
 * Shared admin screens (design §12). One declarative registry drives every
 * list index, create, and edit page plus the four singleton editors, so each
 * route file is a two-line delegation. In the degraded no-Airtable mode the
 * screens render SEED data for preview and show the read-only banner; saves
 * still route through the server actions, which return the typed "content
 * backend not configured" result and make no network call.
 */

const cut = (value: string, max = 90): string =>
  value.length > max ? `${value.slice(0, max)}…` : value;

type OrderItems = { id: string; order: number }[];

interface ListScreens {
  entity: ListKey;
  title: string;
  titlePlural: string;
  getRows: () => Promise<AdminRow[]>;
  getDefaults: (id: string) => Promise<Record<string, unknown> | null>;
  create: (values: unknown) => Promise<AdminFormState>;
  update: (id: string, values: unknown) => Promise<AdminFormState>;
  del: (id: string) => Promise<AdminFormState>;
  reorder?: (items: OrderItems) => Promise<AdminFormState>;
}

function defineList<T extends { id: string }>(opts: {
  entity: ListKey;
  title: string;
  titlePlural: string;
  getAll: () => Promise<T[]>;
  getById: (id: string) => Promise<T | null>;
  seed: T[];
  toRow: (item: T, base: string) => AdminRow;
  create: (values: unknown) => Promise<AdminFormState>;
  update: (id: string, values: unknown) => Promise<AdminFormState>;
  del: (id: string) => Promise<AdminFormState>;
  reorder?: (items: OrderItems) => Promise<AdminFormState>;
}): ListScreens {
  const base = `/admin/${opts.entity}`;
  return {
    entity: opts.entity,
    title: opts.title,
    titlePlural: opts.titlePlural,
    create: opts.create,
    update: opts.update,
    del: opts.del,
    reorder: opts.reorder,
    getRows: async () => {
      const items = hasAirtableCreds() ? await opts.getAll() : opts.seed;
      return items.map((item) => opts.toRow(item, base));
    },
    getDefaults: async (id) => {
      const domain = hasAirtableCreds()
        ? await opts.getById(id)
        : (opts.seed.find((s) => s.id === id) ?? null);
      if (!domain) return null;
      return buildDefaults(
        opts.entity,
        domain as unknown as Record<string, unknown>,
      );
    },
  };
}

const LISTS: Record<ListKey, ListScreens> = {
  nav: defineList<NavLink>({
    entity: "nav",
    title: "nav link",
    titlePlural: "Nav links",
    getAll: getAllNavLinks,
    getById: getNavLinkById,
    seed: SEED_NAV_LINKS,
    toRow: (n, base) => ({
      id: n.id,
      primary: n.name,
      secondary: n.href,
      order: n.order,
      flag: { label: "Visible", on: n.visible },
      editHref: `${base}/${n.id}`,
    }),
    create: createNavLinkAction,
    update: updateNavLinkAction,
    del: deleteNavLinkAction,
    reorder: reorderNavLinksAction,
  }),
  services: defineList<Service>({
    entity: "services",
    title: "service",
    titlePlural: "Services",
    getAll: getAllServices,
    getById: getServiceById,
    seed: SEED_SERVICES,
    toRow: (s, base) => ({
      id: s.id,
      primary: s.name,
      secondary: cut(s.description),
      order: s.order,
      flag: { label: "Visible", on: s.visible },
      editHref: `${base}/${s.id}`,
    }),
    create: createServiceAction,
    update: updateServiceAction,
    del: deleteServiceAction,
    reorder: reorderServicesAction,
  }),
  industries: defineList<Industry>({
    entity: "industries",
    title: "industry",
    titlePlural: "Industries",
    getAll: getAllIndustries,
    getById: getIndustryById,
    seed: SEED_INDUSTRIES,
    toRow: (i, base) => ({
      id: i.id,
      primary: i.name,
      secondary: cut(i.description),
      order: i.order,
      flag: { label: "Visible", on: i.visible },
      editHref: `${base}/${i.id}`,
    }),
    create: createIndustryAction,
    update: updateIndustryAction,
    del: deleteIndustryAction,
    reorder: reorderIndustriesAction,
  }),
  stats: defineList<Stat>({
    entity: "stats",
    title: "stat",
    titlePlural: "Stats",
    getAll: getAllStats,
    getById: getStatById,
    seed: SEED_STATS,
    toRow: (s, base) => ({
      id: s.id,
      primary: s.name,
      secondary: s.displayOverride || `${s.prefix}${s.value}${s.suffix}`,
      order: s.order,
      flag: { label: "Visible", on: s.visible },
      editHref: `${base}/${s.id}`,
    }),
    create: createStatAction,
    update: updateStatAction,
    del: deleteStatAction,
    reorder: reorderStatsAction,
  }),
  clients: defineList<Client>({
    entity: "clients",
    title: "client",
    titlePlural: "Clients",
    getAll: getAllClients,
    getById: getClientById,
    seed: SEED_CLIENTS,
    toRow: (c, base) => ({
      id: c.id,
      primary: c.name,
      secondary: c.sectorGroup,
      order: c.order,
      flag: { label: "Visible", on: c.visible },
      editHref: `${base}/${c.id}`,
    }),
    create: createClientAction,
    update: updateClientAction,
    del: deleteClientAction,
    reorder: reorderClientsAction,
  }),
  reviews: defineList<Review>({
    entity: "reviews",
    title: "review",
    titlePlural: "Reviews",
    getAll: getAllReviews,
    getById: getReviewById,
    seed: SEED_REVIEWS,
    toRow: (r, base) => ({
      id: r.id,
      primary: r.name,
      secondary: cut(r.quote),
      order: r.order,
      flag: { label: "Published", on: r.published },
      editHref: `${base}/${r.id}`,
    }),
    create: createReviewAction,
    update: updateReviewAction,
    del: deleteReviewAction,
    reorder: reorderReviewsAction,
  }),
  team: defineList<TeamMember>({
    entity: "team",
    title: "team member",
    titlePlural: "Team",
    getAll: getAllTeam,
    getById: getTeamMemberById,
    seed: SEED_TEAM,
    toRow: (t, base) => ({
      id: t.id,
      primary: t.name,
      secondary: t.role,
      order: t.order,
      flag: { label: "Visible", on: t.visible },
      editHref: `${base}/${t.id}`,
    }),
    create: createTeamMemberAction,
    update: updateTeamMemberAction,
    del: deleteTeamMemberAction,
    reorder: reorderTeamAction,
  }),
  projects: defineList<Project>({
    entity: "projects",
    title: "project",
    titlePlural: "Projects",
    getAll: getAllProjects,
    getById: getProjectById,
    seed: SEED_PROJECTS,
    toRow: (p, base) => ({
      id: p.id,
      primary: p.name,
      secondary: `/work/${p.slug}`,
      order: p.order,
      flag: { label: "Published", on: p.published },
      editHref: `${base}/${p.id}`,
    }),
    create: createProjectAction,
    update: updateProjectAction,
    del: deleteProjectAction,
    reorder: reorderProjectsAction,
  }),
  blog: defineList<BlogPost>({
    entity: "blog",
    title: "post",
    titlePlural: "Blog posts",
    getAll: getAllBlogPosts,
    getById: getBlogPostById,
    seed: SEED_BLOG_POSTS,
    toRow: (b, base) => ({
      id: b.id,
      primary: b.title,
      secondary: `${b.author} · ${b.publishDate}`,
      order: 0,
      flag: { label: "Published", on: b.published },
      editHref: `${base}/${b.id}`,
    }),
    create: createBlogPostAction,
    update: updateBlogPostAction,
    del: deleteBlogPostAction,
  }),
};

interface SingletonScreen {
  title: string;
  read: () => Promise<Record<string, unknown>>;
  save: (values: unknown) => Promise<AdminFormState>;
}

const SINGLETONS: Record<SingletonKey, SingletonScreen> = {
  settings: {
    title: "Site settings",
    read: async () => (await getSettings()) as unknown as Record<string, unknown>,
    save: saveSettings,
  },
  hero: {
    title: "Hero",
    read: async () => (await getHero()) as unknown as Record<string, unknown>,
    save: saveHero,
  },
  about: {
    title: "About",
    read: async () => (await getAbout()) as unknown as Record<string, unknown>,
    save: saveAbout,
  },
  cta: {
    title: "CTA band",
    read: async () => (await getCta()) as unknown as Record<string, unknown>,
    save: saveCta,
  },
};

/** Admin nav + dashboard section list. */
export const ADMIN_SECTIONS: { href: string; label: string }[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/hero", label: "Hero" },
  { href: "/admin/about", label: "About" },
  { href: "/admin/cta", label: "CTA band" },
  { href: "/admin/nav", label: "Nav links" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/industries", label: "Industries" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/stats", label: "Stats" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/team", label: "Team" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/submissions", label: "Submissions" },
];

function NoBackendBanner() {
  return (
    <div className="rounded-lg border border-accent-amber/40 bg-accent-amber/10 px-4 py-3 text-small text-text">
      Content backend not configured — saves are disabled. Set{" "}
      <code>AIRTABLE_API_KEY</code> and <code>AIRTABLE_BASE_ID</code> to edit
      live content. Seed data is shown for preview.
    </div>
  );
}

function AdminHeader({
  title,
  actionHref,
  actionLabel,
}: {
  title: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h1 className="text-h2 font-semibold text-text">{title}</h1>
      {actionHref ? (
        <Link href={actionHref} className={buttonVariants({ size: "sm" })}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export async function ListScreen({ entity }: { entity: ListKey }) {
  const cfg = LISTS[entity];
  const editable = hasAirtableCreds();
  const rows = await cfg.getRows();
  return (
    <div className="space-y-6">
      <AdminHeader
        title={cfg.titlePlural}
        actionHref={editable ? `/admin/${entity}/new` : undefined}
        actionLabel={`New ${cfg.title}`}
      />
      {!editable ? <NoBackendBanner /> : null}
      <EntityTable
        rows={rows}
        editable={editable}
        reorderAction={cfg.reorder}
        deleteAction={cfg.del}
      />
    </div>
  );
}

export async function CreateScreen({ entity }: { entity: ListKey }) {
  const cfg = LISTS[entity];
  return (
    <div className="space-y-6">
      <AdminHeader title={`New ${cfg.title}`} />
      {!hasAirtableCreds() ? <NoBackendBanner /> : null}
      <EntityForm
        entity={entity}
        action={cfg.create}
        blobEnabled={hasBlobToken()}
        submitLabel={`Create ${cfg.title}`}
      />
    </div>
  );
}

export async function EditScreen({
  entity,
  id,
}: {
  entity: ListKey;
  id: string;
}) {
  const cfg = LISTS[entity];
  const defaults = await cfg.getDefaults(id);
  if (!defaults) notFound();
  const action = cfg.update.bind(null, id);
  return (
    <div className="space-y-6">
      <AdminHeader title={`Edit ${cfg.title}`} />
      {!hasAirtableCreds() ? <NoBackendBanner /> : null}
      <EntityForm
        entity={entity}
        action={action}
        defaultValues={defaults}
        blobEnabled={hasBlobToken()}
      />
    </div>
  );
}

export async function SingletonScreen({ entity }: { entity: SingletonKey }) {
  const cfg = SINGLETONS[entity];
  const domain = await cfg.read();
  const defaults = buildDefaults(entity, domain);
  return (
    <div className="space-y-6">
      <AdminHeader title={cfg.title} />
      {!hasAirtableCreds() ? <NoBackendBanner /> : null}
      <EntityForm
        entity={entity}
        action={cfg.save}
        defaultValues={defaults}
        blobEnabled={hasBlobToken()}
      />
    </div>
  );
}
