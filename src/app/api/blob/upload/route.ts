import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse, type NextRequest } from "next/server";
import { AuthError } from "@auth/core/errors";
import { requireAdmin } from "@/lib/auth/require-admin";
import { logger } from "@/lib/utils";

/**
 * Vercel Blob client-upload handler (design §10). `onBeforeGenerateToken` calls
 * `requireAdmin()` and a thrown `AuthError` is mapped to a 401 Response, so
 * non-admins can never obtain an upload token. Tokens are restricted to raster
 * image types (SVG disallowed — stored-SVG XSS, NFR-11.4), capped at 8MB, with
 * a random filename suffix. `onUploadCompleted` is a server-side log only.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async () => {
        await requireAdmin();
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/avif",
          ],
          maximumSizeInBytes: 8 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        logger.info("blob upload completed", { url: blob.url });
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Upload failed";
    logger.error("blob upload failed", { err: message });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
