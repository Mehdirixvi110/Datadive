import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/seo";

/**
 * robots.txt (design §17, NFR-13.3). Allows all and points to the sitemap.
 * `/admin` is disallowed from crawling (it is auth-gated regardless).
 */
export default function robots(): MetadataRoute.Robots {
  const base = resolveSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin",
    },
    sitemap: new URL("/sitemap.xml", base).toString(),
  };
}
