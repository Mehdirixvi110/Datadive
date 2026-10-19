/**
 * NextAuth v5 (Auth.js) configuration (design §9). Google provider + JWT
 * sessions, kept strictly **Edge-compatible** so `middleware.ts` can import it:
 * JWT only, NO database adapter, NO Node-only crypto imports (N6). The
 * `signIn` callback enforces the `ADMIN_EMAILS` allowlist once; the admin
 * guards re-check on every request (defense in depth, §9).
 *
 * Pinned to next-auth@5.0.0-beta.25: `NextAuth(config)` does NOT throw at
 * construction, and the missing-`AUTH_SECRET` failure (`MissingSecret`) is
 * raised lazily at request time — confirmed against the installed version.
 * That is what lets the zero-env `npm run build` succeed; every caller gates
 * on `hasAuthCreds()` before invoking `auth()` so a no-creds request safely
 * redirects instead of 500ing (§2, rev-2 F5, F2).
 */
import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { isAllowedAdminEmail } from "./allowlist";

export const authConfig = {
  providers: [
    Google({
      // v5 convention is AUTH_GOOGLE_ID/SECRET; GOOGLE_CLIENT_ID/SECRET
      // accepted as aliases so either naming works (§9).
      clientId: process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID,
      clientSecret:
        process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  callbacks: {
    // Allowlist, enforced the first time here: reject any email not in
    // ADMIN_EMAILS and bounce to the login page with a clear reason (FR-18.3).
    signIn({ user }) {
      return isAllowedAdminEmail(user?.email)
        ? true
        : "/admin/login?error=AccessDenied";
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
