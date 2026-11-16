import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Optional external revalidation endpoint (design §7). Disabled (404) when
 * `REVALIDATE_SECRET` is unset — in-process `revalidateTag` after admin edits
 * is the primary path and needs no endpoint. When the secret is set, a
 * `POST { tag }` with a matching `Authorization: Bearer <secret>` header
 * revalidates that tag; mismatched/missing auth → 401.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let tag: unknown;
  try {
    ({ tag } = (await request.json()) as { tag?: unknown });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof tag !== "string" || tag.length === 0) {
    return NextResponse.json({ error: "Missing 'tag'" }, { status: 400 });
  }

  revalidateTag(tag);
  return NextResponse.json({ revalidated: true, tag });
}
