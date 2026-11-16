import Link from "next/link";
import { Container } from "@/components/ui";
import { SignOut } from "@/components/admin/SignOut";
import { ADMIN_SECTIONS } from "@/components/admin/screens";
import { requireAdminPage } from "@/lib/auth/require-admin";

/**
 * Admin shell (design §9/§12). Gated by `requireAdminPage()` so no admin markup
 * or data is produced for a non-admin even if middleware is bypassed; an
 * unauthenticated/unauthorized request (or no creds) redirects to
 * `/admin/login`. `/admin/login` lives OUTSIDE this `(protected)` group, so the
 * gate never wraps it (no redirect loop). `force-dynamic` keeps every admin
 * route live and request-time auth-checked (§7).
 */
export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminPage();
  const email = session.user?.email ?? "admin";

  return (
    <Container className="py-10">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-4">
          <div className="space-y-1">
            <p className="text-small font-semibold uppercase tracking-wide text-muted">
              Datadive admin
            </p>
            <p className="truncate text-small text-muted" title={email}>
              {email}
            </p>
          </div>
          <nav className="flex flex-col gap-1">
            {ADMIN_SECTIONS.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="rounded-md px-3 py-2 text-body text-text hover:bg-surface"
              >
                {section.label}
              </Link>
            ))}
          </nav>
          <SignOut />
        </aside>
        <main>{children}</main>
      </div>
    </Container>
  );
}
