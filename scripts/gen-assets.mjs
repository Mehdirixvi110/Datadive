// Datadive asset generator (design §8/§24).
//
// Generates, from the 400² brand mark, the App Router icon set UNDER src/app/
// (icon.png, apple-icon.png, favicon.ico) and the RASTER PNG seed placeholders
// in public/seed/ (project/avatar/logo/cover). Output is always raster PNG —
// never SVG — because next.config.ts keeps dangerouslyAllowSVG OFF (§10/§19).
//
// Re-run after changing the brand mark:  node scripts/gen-assets.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MARK = join(ROOT, "public", "brand", "datadive-mark.png");
const APP_DIR = join(ROOT, "src", "app");
const SEED_DIR = join(ROOT, "public", "seed");

// Theme tokens (mirror of design §16).
const BG = "#0B0F17";
const SURFACE = "#111726";
const BRAND = "#1E6FEB";
const DEPTH = "#22D3EE";
const MUTED = "#9AA7BD";

/** Render the brand mark centered on a solid background at a given square size. */
async function icon(size, padRatio = 0.18) {
  const inner = Math.round(size * (1 - padRatio * 2));
  const mark = await sharp(MARK)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: mark, gravity: "center" }])
    .png();
}

/** Minimal ICO wrapper around a single PNG payload (ICO supports embedded PNG). */
function pngToIco(pngBuffer, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 => 256)
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8); // bytes in resource
  entry.writeUInt32LE(6 + 16, 12); // offset of image data

  return Buffer.concat([header, entry, pngBuffer]);
}

/** Rasterize an SVG string to a PNG buffer at the given dimensions. */
function svgToPng(svg) {
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Build a branded placeholder SVG (rendered to raster PNG, never served as SVG). */
function placeholderSvg(w, h, label) {
  const fs = Math.max(14, Math.round(Math.min(w, h) * 0.08));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${SURFACE}"/>
      <stop offset="100%" stop-color="${BG}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.75" cy="0.2" r="0.8">
      <stop offset="0%" stop-color="${BRAND}" stop-opacity="0.35"/>
      <stop offset="60%" stop-color="${DEPTH}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${BG}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="none" stroke="${BRAND}" stroke-opacity="0.25" stroke-width="2" rx="12"/>
  <text x="50%" y="50%" fill="${MUTED}" font-family="Inter, system-ui, sans-serif" font-size="${fs}" font-weight="600" text-anchor="middle" dominant-baseline="middle">${label}</text>
</svg>`;
}

async function main() {
  await mkdir(APP_DIR, { recursive: true });
  await mkdir(SEED_DIR, { recursive: true });

  // App Router icons (design §24, N8).
  await (await icon(512)).toFile(join(APP_DIR, "icon.png"));
  await (await icon(180)).toFile(join(APP_DIR, "apple-icon.png"));
  const favPng = await (await icon(32, 0.1)).toBuffer();
  await writeFile(join(APP_DIR, "favicon.ico"), pngToIco(favPng, 32));

  // Raster PNG seed placeholders (design §8/§10, F2).
  const placeholders = [
    ["project.png", 1200, 800, "Project placeholder"],
    ["cover.png", 1200, 630, "Cover placeholder"],
    ["avatar.png", 480, 480, "Avatar placeholder"],
    ["logo.png", 480, 240, "Logo placeholder"],
  ];
  for (const [name, w, h, label] of placeholders) {
    const png = await svgToPng(placeholderSvg(w, h, label));
    await writeFile(join(SEED_DIR, name), png);
  }

  console.log("Generated app icons + seed placeholders (raster PNG).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
