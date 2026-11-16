import { ImageResponse } from "next/og";

/**
 * Generated brand OG FALLBACK (design §17, N4). This file-convention route only
 * PRODUCES the generated brand-OG bytes used as the fallback share image; the
 * single source of truth for the `og:image` tag is `generateMetadata`'s
 * `openGraph.images` (Settings.OgImageUrl → this fallback). Zero-env: the
 * image is drawn from inline styles only — no network, no secrets.
 */
export const alt = "Datadive — Diving Into Data, Driving Decisions";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#0b0f17",
          backgroundImage:
            "linear-gradient(135deg, #10459c 0%, #0b0f17 55%, #08214d 100%)",
          color: "#e6eaf2",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#22d3ee",
          }}
        >
          Datadive
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          Diving Into Data, Driving Decisions
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 30,
            color: "#9aa7bd",
            maxWidth: 820,
          }}
        >
          Dashboards, BI, AI, and custom analytics.
        </div>
      </div>
    ),
    { ...size },
  );
}
