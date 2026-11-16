import type { Metadata } from "next";
import type { Settings } from "@/lib/types";

/**
 * SEO/OG helpers (design §17). The site base URL resolves from
 * NEXT_PUBLIC_SITE_URL → VERCEL_URL → localhost so the build never requires an
 * env var. `og:image` has a single source of truth: `generateMetadata`'s
 * `openGraph.images` resolves `Settings.OgImageUrl` first and otherwise falls
 * back to the generated brand OG produced by `app/opengraph-image.tsx`.
 */
export const BRAND_OG_FALLBACK = "/opengraph-image";

export function resolveSiteUrl(): URL {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    try {
      return new URL(process.env.NEXT_PUBLIC_SITE_URL);
    } catch {
      /* fall through */
    }
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }
  return new URL("http://localhost:3000");
}

/** Resolve the single og:image URL: admin-set override, else generated brand OG. */
export function ogImageUrl(settings: Pick<Settings, "ogImageUrl">): string {
  const override = (settings.ogImageUrl ?? "").trim();
  return override.length > 0 ? override : BRAND_OG_FALLBACK;
}

/**
 * Build an openGraph block. Setting `openGraph` here is the ONLY source of the
 * og:image tag for the route, so it overrides the file-convention auto-tag and
 * no duplicate `og:image` is emitted.
 */
export function buildOpenGraph(opts: {
  title: string;
  description: string;
  url: string;
  image: string;
  type?: "website" | "article";
}): NonNullable<Metadata["openGraph"]> {
  return {
    title: opts.title,
    description: opts.description,
    url: opts.url,
    siteName: "Datadive",
    type: opts.type ?? "website",
    images: [{ url: opts.image, width: 1200, height: 630 }],
  };
}
