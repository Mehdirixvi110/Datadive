# Airtable provisioning report — Datadive

Provisions and seeds the live Airtable base so the already-built Datadive site
serves editable content from Airtable instead of its seed fallback.

- **Base:** `appS52F8OZKoDLIqH` ("Datadive")
- **Credentials:** `AIRTABLE_API_KEY` read at runtime from `datadive-web/.env.local`
  (fallback `datadive-leadgen/.env`). The token value is never printed, logged,
  or committed.
- **Script:** `scripts/provision-airtable.mjs` (idempotent — a re-run skips
  tables/records that already exist).
- **Source of truth:** table and field names come from
  `src/lib/airtable/schema.ts`; types were inferred from `mappers.ts` +
  `src/lib/validation/*`; content from `src/lib/seed`.
- **Result:** all 15 tables present and seeded, verified by a live production
  render on port 3100. No missing scopes.
- **Progress log:** `run.log` (same directory; git-ignored). Machine-readable
  result: `summary.json`.

## Tables: created vs pre-existing

All 15 required tables were **created by this run**. The base already contained a
default **`Table 1`**, which the Metadata API cannot delete, so it was left in
place (it is unused by the app).

| Table | Status | Fields | Records | Notes |
|---|---|---:|---:|---|
| Settings | created | 15 | 1 | singleton |
| Hero | created | 10 | 1 | singleton |
| About | created | 6 | 1 | singleton |
| Services | created | 6 | 4 | |
| Projects | created | 12 | 9 | 11 base fields + `Images` link |
| ProjectImages | created | 5 | 1 | 4 base fields + `Project` link |
| Industries | created | 6 | 5 | |
| Stats | created | 7 | 5 | |
| Clients | created | 7 | 6 | |
| Reviews | created | 9 | 3 | |
| TeamMembers | created | 8 | 3 | |
| BlogPosts | created | 12 | 2 | |
| CtaBand | created | 7 | 1 | singleton |
| NavLinks | created | 5 | 8 | |
| ContactSubmissions | created | 9 | 0 | runtime inbox — seeded empty by design |
| _Table 1_ | pre-existing | — | — | default table, left untouched |

Singletons (Settings, Hero, About, CtaBand) each hold exactly one record. Every
table verified with **0 missing fields and 0 type mismatches** against the
schema. Total seeded records: **50**.

## Field-type mapping decisions

Field types were chosen so the site's data layer (`mappers.ts`) maps every
record. Notable decisions:

- **Image fields are text, not attachments.** `mappers.ts` reads every image
  field (`LogoLightUrl`, `ImageUrl`, `CoverImageUrl`, `LogoUrl`, `AvatarUrl`,
  `PhotoUrl`, …) with a string accessor, and `validation/common.ts` restricts
  image URLs to same-origin asset paths or `*.public.blob.vercel-storage.com`
  https URLs. So these are `singleLineText` fields holding URL strings — there
  are **no `multipleAttachments` fields** in this schema. The seed's relative
  paths (`/seed/*.png`, `/brand/*.png`) were stored verbatim and resolve as
  same-origin assets at render time.
- **External URL fields** (`Settings.LinkedinUrl`, `Settings.WebsiteUrl`,
  `Settings.OgImageUrl`, `Clients.WebsiteUrl`, `TeamMembers.LinkedinUrl`) use
  the `url` type.
- **Href fields** (`*CtaHref`, `NavLinks.Href`) use `singleLineText` because
  their values include in-page anchors (`#contact`) and root-relative paths
  (`/blog`), which the `url` type would reject.
- **Email:** `Settings.ContactEmail`, `ContactSubmissions.Email` → `email`.
- **Numbers** (`Order`, `Stats.Value`, `Reviews.Rating`) → `number`
  (precision 0).
- **Checkboxes** (`Visible`, `Published`, `Featured`, `OpenInNewTab`) →
  `checkbox`.
- **Single selects** from the validation option sets: `Accent`
  (blue/amber/green/red), `Clients.SectorGroup` (3 options),
  `ContactSubmissions.Status` (New/Read/Archived).
- **Multiple selects** for the array-valued tag fields: `Projects.Tags`
  (13 options from the seed) and `BlogPosts.Tags` (4 options). `mappers.ts`
  reads tags as an array, which requires a multi-select (not comma text).
- **Dates:** `BlogPosts.PublishDate` → `date` (ISO); `ContactSubmissions.SubmittedAt`
  → `dateTime` (ISO, UTC).
- **Markdown bodies** (`About.Body`, `Projects.Body`, `BlogPosts.Body`) →
  `multilineText` to preserve raw markdown for `react-markdown`.
- **`Projects` ⇄ `ProjectImages` link.** Created `ProjectImages.Project`
  (`multipleRecordLinks` → `Projects`). Airtable auto-created the inverse field
  on `Projects`; it was renamed to **`Images`** to match `schema.ts` exactly.
  `ProjectImages` rows were seeded with their parent project's record id in
  `Project`.
- Singleton/list values were written with `typecast: true`; empty strings,
  nulls, and empty arrays were omitted so blank fields stay blank.

## Skipped / unsupported / noted

- **Default `Table 1`** — pre-existing; the Metadata API cannot delete tables,
  so it was left in place. Unused by the app; the operator may delete it in the
  Airtable UI.
- **Empty image fields (expected, not failures):** where the seed image is
  `null`, the URL/alt pair was left blank — `Clients` logos (3 of 6: the
  "sample" entries without a logo), `Reviews` avatar (1 of 3). These are not
  Airtable attachments; nothing required a public upload.
- **Empty optional fields left blank:** `Settings.Phone`, `Settings.AddressText`,
  `Settings.OgImageUrl`; `TeamMembers.LinkedinUrl`; `Clients.WebsiteUrl`;
  `BlogPosts.SeoTitle` / `SeoDescription`.
- **`Projects` 6–9 have empty `Body`** by design (card-only case studies →
  `hasDetail=false`, no detail page), matching the seed.
- **`ContactSubmissions`** seeded with 0 records — it is the contact-form inbox,
  populated at runtime.
- **WhatsApp number (live-vs-seed marker):** `Settings.WhatsappNumber` was
  seeded with a clearly-fake, operator-editable placeholder **`19999999999`**,
  deliberately different from the seed constant (`10000000000`). Because the
  rest of the seed content is identical to what Airtable now holds, this is the
  one value that distinguishes a live render (`wa.me/19999999999`) from the seed
  fallback (`wa.me/10000000000`). Replace it with the real number in
  `/admin/settings`; clearing it hides the WhatsApp button.
- **Scopes:** no `403` / insufficient-scope responses. The PAT exercised
  `schema.bases:read`, `schema.bases:write`, `data.records:read`, and
  `data.records:write` successfully. No follow-up scope changes needed.

## End-to-end verification (live base, port 3100)

Sequence: `npm test` → `npm run build` → `npx next start -p 3100` → HTTP probes
→ server stopped. `AIRTABLE_API_KEY` + `AIRTABLE_BASE_ID` were loaded from
`.env.local` for build and start.

**Unit tests:** `vitest run` — 9 files, **100 passed**.

**Build:** `next build` succeeded. Static params were generated **from the live
base**, proving the data layer reads Airtable:

- `/blog/[slug]` → `five-signs-your-dashboards-are-working-against-you`,
  `from-raw-data-to-decisions-a-practical-etl-checklist` (2 live blog slugs)
- `/work/[slug]` → `hr-analytics-dashboard`,
  `national-health-data-dashboards`, `surge-financial-management-dashboard`,
  `procurement-analytics-dashboard`, `us-merchant-sales-dashboard`
  (5 live project-detail slugs)

**HTTP probes** (all HTTP 200, seeded Airtable content present):

| Path | Status | Live content found |
|---|---|---|
| `/` | 200 | hero "Diving Into Data, Driving Decisions"; services "Dashboard Development & Data Visualization", "Business Intelligence Consulting"; industry "Human Resources"; project "HR Analytics Dashboard"; stat "150"; team "Mehdi Abbas"; a seeded review quote |
| `/blog` | 200 | "Five Signs Your Dashboards Are Working Against You"; "From Raw Data to Decisions…" |
| `/work/hr-analytics-dashboard` | 200 | title "HR Analytics Dashboard"; body text "Random Forest" |

**Live-vs-seed proof:** `wa.me/19999999999` (the placeholder seeded into
Airtable, absent from the app's seed constant) is present on **all three**
pages. Combined with the Metadata/Data API read-back above (same credentials,
no `403`), this confirms the pages render **live Airtable content, not the seed
fallback**.

Server on port 3100 was stopped after probing (port no longer listening).

## Follow-ups for the operator

1. Replace the placeholder `Settings.WhatsappNumber` (`19999999999`) with the
   real number in `/admin/settings` (or clear it to hide the button).
2. Optionally delete the default `Table 1` from the Airtable UI.
3. Replace the `/seed/*` and `/brand/*` placeholder images with real assets
   (upload via the admin image fields / Vercel Blob) when available.
