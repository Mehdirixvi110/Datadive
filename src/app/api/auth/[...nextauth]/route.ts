/**
 * NextAuth v5 route handler (design §9). Short-circuits to a 404 BEFORE
 * invoking the Auth.js handler when `!hasAuthCreds()`, so the zero-env build /
 * a no-creds deploy never hits the lazy `MissingSecret` 500 (F2). With creds
 * present it delegates to the generated `handlers`.
 */
import type { NextRequest } from "next/server";
import { handlers } from "@/auth";
import { hasAuthCreds } from "@/lib/utils";

function notConfigured(): Response {
  return new Response("Not Found", { status: 404 });
}

export async function GET(request: NextRequest): Promise<Response> {
  if (!hasAuthCreds()) return notConfigured();
  return handlers.GET(request);
}

export async function POST(request: NextRequest): Promise<Response> {
  if (!hasAuthCreds()) return notConfigured();
  return handlers.POST(request);
}
