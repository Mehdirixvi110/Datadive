/**
 * Admin route guard — coarse first gate (design §9). Scoped to `/admin/:path*`
 * and excludes `/admin/login` (ungated sign-in page) so public routes never
 * invoke `auth()`. Runs on the Edge runtime, so the imported auth config stays
 * Edge-compatible (JWT only, no adapter / Node-only imports, N6).
 *
 * Order matters (F2): check `hasAuthCreds()` FIRST and, if false, redirect to
 * `/admin/login` WITHOUT calling `auth()` (Auth.js v5 throws `MissingSecret`
 * lazily at request time). Only when creds are present do we read the JWT
 * session and bounce unauthenticated requests to sign-in.
 */
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { auth } from "@/auth";
import { hasAuthCreds } from "@/lib/utils";

type EdgeHandler = (
  req: NextRequest,
  event: NextFetchEvent,
) => Promise<Response> | Response;

export default function middleware(
  req: NextRequest,
  event: NextFetchEvent,
): Promise<Response> | Response {
  const { pathname, origin } = req.nextUrl;
  const loginUrl = new URL("/admin/login", origin);

  // `/admin/login` is outside the gate — never guard it (avoids redirect loop).
  if (pathname === "/admin/login") return NextResponse.next();

  // Fail safe: no creds -> bounce without ever touching auth().
  if (!hasAuthCreds()) return NextResponse.redirect(loginUrl);

  // Creds present: delegate to the Auth.js wrapper to read the Edge JWT
  // session, redirecting unauthenticated requests to sign-in.
  const guarded = auth((authedReq) => {
    if (!authedReq.auth) return NextResponse.redirect(loginUrl);
    return NextResponse.next();
  }) as unknown as EdgeHandler;

  return guarded(req, event);
}

export const config = {
  // Narrow matcher so only admin routes invoke auth(); `/admin/login` is
  // short-circuited inside the handler above.
  matcher: ["/admin/:path*"],
};
