import Link from "next/link";
import { Card } from "@/components/ui";
import { hasAirtableCreds } from "@/lib/utils";
import {
  getAllBlogPosts,
  getAllClients,
  getAllIndustries,
  getAllNavLinks,
  getAllProjects,
  getAllReviews,
  getAllServices,
  getAllStats,
  getAllTeam,
  getSubmissions,
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

/**
 * Admin dashboard home (design §12). A card per content type with its record
 * count and a quick link, plus the read-only banner when the content backend
 * is not configured. Counts come from live admin reads, or from seed in the
 * degraded no-creds mode (lists render seed for preview).
 */
export const dynamic = "force-dynamic";

interface SectionCard {
  href: string;
  label: string;
  count: number;
}

export default async function AdminDashboard() {
  const editable = hasAirtableCreds();

  const [
    services,
    projects,
    industries,
    stats,
    clients,
    reviews,
    team,
    blog,
    nav,
    submissions,
  ] = editable
    ? await Promise.all([
        getAllServices(),
        getAllProjects(),
        getAllIndustries(),
        getAllStats(),
        getAllClients(),
        getAllReviews(),
        getAllTeam(),
        getAllBlogPosts(),
        getAllNavLinks(),
        getSubmissions(),
      ])
    : [
        SEED_SERVICES,
        SEED_PROJECTS,
        SEED_INDUSTRIES,
        SEED_STATS,
        SEED_CLIENTS,
        SEED_REVIEWS,
        SEED_TEAM,
        SEED_BLOG_POSTS,
        SEED_NAV_LINKS,
        [],
      ];

  const lists: SectionCard[] = [
    { href: "/admin/services", label: "Services", count: services.length },
    { href: "/admin/projects", label: "Projects", count: projects.length },
    { href: "/admin/industries", label: "Industries", count: industries.length },
    { href: "/admin/stats", label: "Stats", count: stats.length },
    { href: "/admin/clients", label: "Clients", count: clients.length },
    { href: "/admin/reviews", label: "Reviews", count: reviews.length },
    { href: "/admin/team", label: "Team", count: team.length },
    { href: "/admin/blog", label: "Blog posts", count: blog.length },
    { href: "/admin/nav", label: "Nav links", count: nav.length },
    { href: "/admin/submissions", label: "Submissions", count: submissions.length },
  ];

  const singletons = [
    { href: "/admin/settings", label: "Site settings" },
    { href: "/admin/hero", label: "Hero" },
    { href: "/admin/about", label: "About" },
    { href: "/admin/cta", label: "CTA band" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-h2 font-semibold text-text">Dashboard</h1>

      {!editable ? (
        <div className="rounded-lg border border-accent-amber/40 bg-accent-amber/10 px-4 py-3 text-small text-text">
          Content backend not configured — saves are disabled. Set{" "}
          <code>AIRTABLE_API_KEY</code> and <code>AIRTABLE_BASE_ID</code> to edit
          live content. Counts below reflect seed data.
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-h4 font-semibold text-text">Content</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {lists.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card interactive className="h-full">
                <p className="text-display-3 font-semibold text-text">
                  {card.count}
                </p>
                <p className="text-small text-muted">{card.label}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-h4 font-semibold text-text">Singletons</h2>
        <div className="flex flex-wrap gap-3">
          {singletons.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-lg border border-border bg-card px-4 py-2 text-body text-text hover:border-brand-400"
            >
              {s.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
