import type { NextConfig } from "next";

/**
 * Datadive Next.js configuration (design §10, §19).
 *
 * Image optimization is restricted to the Vercel Blob host ONLY, and SVG
 * optimization stays OFF (`dangerouslyAllowSVG` defaults to false and is kept
 * explicit here). Every stored image URL is therefore host-validated to the
 * Blob allowlist, and all local placeholders are raster PNG — never SVG — so
 * `next/image` never hits the SVG-optimizer 400.
 */
const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: false,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
