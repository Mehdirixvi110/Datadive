import type { Metadata } from "next";
import { Container, Card, Button } from "@/components/ui";
import { hasAuthCreds } from "@/lib/utils";
import { signInWithGoogle } from "@/app/admin/actions/session";

/**
 * Admin sign-in (design §9/§12). Lives OUTSIDE the `(protected)` route group so
 * the gate layout never wraps it — no redirect loop (rev-2 F1). `force-dynamic`
 * makes the `hasAuthCreds()` / `?error` branching request-time, not frozen at
 * build (N1). Three states: Google sign-in, AccessDenied, and the
 * "sign-in not configured" notice shown with zero env (no 500).
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const configured = hasAuthCreds();

  return (
    <Container className="flex min-h-[60vh] items-center justify-center py-16">
      <Card className="w-full max-w-md space-y-5">
        <div className="space-y-1">
          <h1 className="text-h3 font-semibold text-text">Datadive admin</h1>
          <p className="text-small text-muted">
            Sign in to manage site content.
          </p>
        </div>

        {!configured ? (
          <div className="rounded-lg border border-accent-amber/40 bg-accent-amber/10 px-4 py-3 text-small text-text">
            Sign-in is not configured. Set <code>AUTH_SECRET</code>,{" "}
            <code>AUTH_GOOGLE_ID</code>, <code>AUTH_GOOGLE_SECRET</code>, and{" "}
            <code>ADMIN_EMAILS</code> to enable admin login. The public site is
            unaffected.
          </div>
        ) : (
          <>
            {error === "AccessDenied" ? (
              <div className="rounded-lg border border-accent-red/40 bg-accent-red/10 px-4 py-3 text-small text-text">
                That Google account is not authorized for admin access.
              </div>
            ) : null}
            {error && error !== "AccessDenied" ? (
              <div className="rounded-lg border border-accent-red/40 bg-accent-red/10 px-4 py-3 text-small text-text">
                Sign-in failed. Please try again.
              </div>
            ) : null}
            <form action={signInWithGoogle}>
              <Button type="submit" className="w-full">
                Sign in with Google
              </Button>
            </form>
          </>
        )}
      </Card>
    </Container>
  );
}
