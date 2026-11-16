# Datadive — Marketing Website

Next.js 15 (App Router, React Server Components) marketing site for **Datadive**,
backed by Airtable through a single typed server-only data-access layer, with a
Google-auth admin dashboard, deployed to Vercel. Images live in Vercel Blob.

With **zero environment variables** the site builds, lints, and renders fully
from seed data — live Airtable content and admin features switch on only when
their respective credentials are provided.

## Tech stack

- **Next.js 15** (App Router, RSC) · **React 19** · **TypeScript 5** (`strict`)
- **Tailwind CSS 3.4** (dark theme tokens in `tailwind.config.ts` + `globals.css`)
- **NextAuth v5** (Auth.js, Google provider — pinned to `5.0.0-beta.25`)
- **Vercel Blob** for image storage · **Zod** + **react-hook-form** for forms
- **react-markdown** + **remark-gfm** + **rehype-sanitize** for rich text
- **Framer Motion** · **lucide-react** · **Vitest** for tests

Node 20 is pinned via `.nvmrc` and `package.json` `engines`. Package manager: npm
(committed `package-lock.json`).

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build (passes with zero env vars)
npm run start      # serve the production build
npm run lint       # ESLint (next/core-web-vitals + prettier + airtable boundary)
npm run test       # Vitest (single run)
```

Regenerate the brand icons and seed placeholder images from the brand mark:

```bash
node scripts/gen-assets.mjs
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in only what you need. **Every**
variable is optional for the build and the public render; a missing value only
disables the one feature it powers.

| Variable | Required for | If absent |
|---|---|---|
| `AIRTABLE_API_KEY` | live content | seed data served |
| `AIRTABLE_BASE_ID` | live content | seed data served |
| `AIRTABLE_TABLE_*` (optional overrides) | renamed tables | default contract names used |
| `AUTH_SECRET` | admin sessions | admin login disabled; public unaffected |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google sign-in | admin login disabled |
| `ADMIN_EMAILS` | admin authorization | no email can be admin (login effectively closed) |
| `BLOB_READ_WRITE_TOKEN` | image upload | upload disabled; paste-URL + seed images work |
| `NEXT_PUBLIC_SITE_URL` | absolute metadata/OG/sitemap | falls back to `VERCEL_URL`, then `http://localhost:3000` |
| `REVALIDATE_SECRET` | optional external revalidate route | route disabled (in-process revalidation still works) |
| `RESEND_API_KEY` + `CONTACT_NOTIFY_TO` | contact email notify | submissions still saved; no email sent |

`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are accepted as aliases for
`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`. Secrets are server-side only and are
never prefixed `NEXT_PUBLIC_`.

## Airtable configuration

Only two secrets are mandatory to serve live content: `AIRTABLE_API_KEY` and
`AIRTABLE_BASE_ID`. Table names are **not** required as environment variables.

> **Accepted reading of FR-24.4:** table names default in code with optional
> `AIRTABLE_TABLE_*` env overrides; only the Airtable base id + API key are
> mandatory.

Table names are centralized constants in `src/lib/airtable/schema.ts` (the schema
contract) and may each be overridden with an optional `AIRTABLE_TABLE_<KEY>` env
var if you rename a table in Airtable. Table names are a schema contract, not a
secret; making all of them mandatory env vars would damage the zero-config
no-credential build with no security gain.

## Airtable schema contract (§5)

This mirrors `src/lib/airtable/schema.ts`. Every image is a **URL text field**
holding a stable Vercel Blob URL (never an Airtable attachment) paired with a
plain-text alt field. The **`Req`** column is a Zod/DAL contract, not an Airtable
constraint: required-ness and defaults are enforced in the validation layer and
the DAL writer (which sets documented defaults explicitly on write), plus the
mapper's safe defaults on read. List tables carry `Order` (Number) and a
visibility flag (`Visible`, or `Published` for blog/projects/reviews). Singleton
tables hold exactly one row. `Name` is each table's primary field.

### Settings (singleton)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | Internal label. |
| BrandName | Single line text | ✓ | "Datadive". |
| Tagline | Single line text | ✓ | "Diving Into Data, Driving Decisions". |
| ContactEmail | Email | ✓ | Footer + contact. |
| Phone | Phone | – | Optional. |
| WhatsappNumber | Single line text | – | Stored normalized to digits. Empty → WhatsApp button hidden. |
| WhatsappPrefillMessage | Long text | – | Optional prefilled `wa.me` text. |
| LinkedinUrl | URL | – | Company LinkedIn. |
| WebsiteUrl | URL | – | datadiveanalytics.com. |
| AddressText | Long text | – | Optional. |
| LogoLightUrl | URL | – | Falls back to `/brand/datadive-logo-color.png`. |
| LogoDarkUrl | URL | – | Falls back to `/brand/datadive-logo-white.png`. |
| OgImageUrl | URL | – | Default share image (read into a meta tag, not `next/image`). |
| PrimaryCtaLabel | Single line text | – | Global nav CTA label. |
| PrimaryCtaHref | Single line text | – | Global nav CTA target (`#contact` default). |

### Hero (singleton)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | Label. |
| Eyebrow | Single line text | – | Small label above the headline. |
| Headline | Single line text | ✓ | |
| Subheadline | Long text | – | |
| PrimaryCtaLabel / PrimaryCtaHref | Single line text | – | |
| SecondaryCtaLabel / SecondaryCtaHref | Single line text | – | |
| ImageUrl | URL | – | Hero visual (Blob); seed placeholder if empty. |
| ImageAlt | Single line text | – | Required if ImageUrl set. |

### About (singleton)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | Label. |
| Heading | Single line text | ✓ | |
| Body | Long text (rich text) | ✓ | Markdown; rendered sanitized. |
| Points | Long text | – | One scannable point per line (tolerant line parser). |
| ImageUrl | URL | – | Optional. |
| ImageAlt | Single line text | – | Required if ImageUrl set. |

### Services (list)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | Service title. |
| Description | Long text | ✓ | |
| Icon | Single select | – | Option set below. |
| Accent | Single select | – | `blue` \| `amber` \| `green` \| `red`. |
| Order | Number | ✓ | |
| Visible | Checkbox | ✓ | Default true. |

### Projects (list)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | Project title. |
| Slug | Single line text | ✓ | Unique, URL-safe; used by `/work/[slug]`. |
| Summary | Long text | ✓ | Short card description. |
| Body | Long text (rich text) | – | Full detail (Markdown). Non-empty `Body` defines `hasDetail`. |
| CoverImageUrl | URL | – | Card/detail cover; seed placeholder if empty. |
| CoverImageAlt | Single line text | – | Required if CoverImageUrl set. |
| Images | Link → ProjectImages | – | Gallery (ordered child rows). |
| Tags | Multiple select | – | Industry/skill chips. |
| Metrics | Long text | – | One `value \| label` per line. |
| Featured | Checkbox | – | Optional highlight. |
| Order | Number | ✓ | |
| Published | Checkbox | ✓ | Default true; false hides publicly. |

`hasDetail` = `Published === true` **and** `Body` non-empty. It governs
`generateStaticParams`, the sitemap, Work-card linking, and the detail page's
`notFound()` branch.

### ProjectImages (child of Projects)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | Label. |
| Project | Link → Projects (single) | ✓ | Parent. |
| ImageUrl | URL | ✓ | Blob URL. |
| Alt | Single line text | ✓ | |
| Order | Number | ✓ | Gallery order. |

### Industries (list)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | Industry label. |
| Description | Long text | ✓ | |
| Icon | Single select | – | Option set below. |
| Accent | Single select | – | `blue` \| `amber` \| `green` \| `red`. |
| Order | Number | ✓ | |
| Visible | Checkbox | ✓ | |

### Stats (list)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | Stat label. |
| Value | Number | ✓ | Numeric count-up target. |
| Prefix | Single line text | – | e.g. "$". |
| Suffix | Single line text | – | e.g. "K+", "%", "+". |
| DisplayOverride | Single line text | – | If set, shown verbatim (no count-up). |
| Order | Number | ✓ | |
| Visible | Checkbox | ✓ | |

### Clients (list)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | Org name (text fallback if no logo). |
| LogoUrl | URL | – | Blob URL. |
| LogoAlt | Single line text | – | Required if LogoUrl set. |
| SectorGroup | Single select | ✓ | `International & Development` \| `Corporate & Technology` \| `Independent Case Studies`. |
| WebsiteUrl | URL | – | Optional. |
| Order | Number | ✓ | |
| Visible | Checkbox | ✓ | |

### Reviews (list)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | Author name. |
| Quote | Long text | ✓ | |
| Role | Single line text | – | |
| Company | Single line text | – | |
| AvatarUrl | URL | – | |
| AvatarAlt | Single line text | – | Required if AvatarUrl set. |
| Rating | Number (1–5) | – | |
| Order | Number | ✓ | |
| Published | Checkbox | ✓ | Default true. |

An empty live Reviews table falls back to seed placeholder testimonials
(FR-9.2) — the only list that reinjects seed when credentials are present.

### TeamMembers (list)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | |
| Role | Single line text | ✓ | |
| Bio | Long text | – | |
| PhotoUrl | URL | – | Placeholder avatar if empty. |
| PhotoAlt | Single line text | – | Required if PhotoUrl set. |
| LinkedinUrl | URL | – | |
| Order | Number | ✓ | |
| Visible | Checkbox | ✓ | |

### BlogPosts (list)

| Field | Type | Req | Notes |
|---|---|---|---|
| Title | Single line text | ✓ | Primary field. |
| Slug | Single line text | ✓ | Unique, URL-safe, stable. |
| Excerpt | Long text | ✓ | Listing summary. |
| Body | Long text (rich text) | ✓ | Markdown; sanitized render. |
| CoverImageUrl | URL | – | Placeholder if empty. |
| CoverImageAlt | Single line text | – | Required if CoverImageUrl set. |
| Author | Single line text | ✓ | |
| PublishDate | Date | ✓ | Listing sorts desc by this. |
| Published | Checkbox | ✓ | Default false; drafts excluded publicly. |
| Tags | Multiple select | – | |
| SeoTitle | Single line text | – | Overrides `<title>`. |
| SeoDescription | Long text | – | Overrides meta description. |

### CtaBand (singleton)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | Label. |
| Heading | Single line text | ✓ | |
| Subtext | Long text | – | |
| PrimaryCtaLabel / PrimaryCtaHref | Single line text | – | |
| SecondaryCtaLabel / SecondaryCtaHref | Single line text | – | |

### NavLinks (list)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | Link label. |
| Href | Single line text | ✓ | `#services`, `/blog`, etc. |
| Order | Number | ✓ | |
| Visible | Checkbox | ✓ | |
| OpenInNewTab | Checkbox | – | |

### ContactSubmissions (write-mostly)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | Submitter name. |
| Email | Email | ✓ | |
| Company | Single line text | – | |
| Subject | Single line text | – | |
| Phone | Phone | – | |
| Message | Long text | ✓ | |
| SubmittedAt | Created time | auto | Airtable-managed. |
| Status | Single select | ✓ | `New` \| `Read` \| `Archived`. Set to `New` explicitly on write. |
| SourcePage | Single line text | – | Where submitted. |

### Icon option set → lucide-react (contract)

| Airtable `Icon` option | lucide-react icon | Used by |
|---|---|---|
| `dashboard` | `LayoutDashboard` | Services |
| `bi` | `BarChart3` | Services |
| `ai` | `BrainCircuit` | Services |
| `custom` | `Wrench` | Services |
| `etl` | `Workflow` | Services |
| `report` | `FileBarChart` | Services |
| `hr` | `Users` | Industries |
| `health` | `HeartPulse` | Industries |
| `retail` | `ShoppingCart` | Industries |
| `ops` | `Building2` | Industries |
| `ml` | `BrainCircuit` | Industries |

A missing, empty, or unrecognized `Icon` key resolves to a default `Sparkles`
icon in the mapper, so an unmapped value never throws.

## Admin dashboard

`/admin` is the `(protected)` route group, gated by `requireAdminPage()` in its
layout; the sign-in page `/admin/login` lives outside the group (no redirect
loop). Sign in with a Google account whose email is in `ADMIN_EMAILS`. The
dashboard offers CRUD for every content type (singletons, lists, the project
gallery, and contact-submission triage) with Zod-validated server actions that
write through the DAL and revalidate the affected cache tags. Image fields upload
to Vercel Blob or accept a pasted, host-validated Blob URL. When Airtable
credentials are absent the admin renders from seed for preview and every save
returns a "content backend not configured" result with no network call.

## Deploy to Vercel

Set the Vercel **project root directory to `datadive-web/`** (the repository is
isolated here). Framework preset: Next.js. Add the environment variables you need
from the table above in the Vercel project settings; none are required for a
successful build. Add `BLOB_READ_WRITE_TOKEN` (Vercel Blob) to enable image
upload. `AUTH_URL` is inferred on Vercel. After the first deploy, point your
Google OAuth client's redirect URI at `https://<your-domain>/api/auth/callback/google`.

## Future extensibility — Python / Auto-ETL seam (documentation only)

Free analysis tools and an Auto-ETL (upload-data-get-report) flow are **noted,
not built** (NFR-14, design §23). When added later, the natural placement is a
`src/app/(tools)/` route group for the UI plus a `src/lib/tools/` typed service
interface that mirrors the DAL boundary pattern, with heavy compute running as
separate functions — Node route handlers for light transforms, or **Vercel
Python Functions** (`api/*.py`) for Python-based analysis — reusing the Vercel
Blob upload flow for datasets. Nothing is scaffolded now, so the seam adds no
user-facing surface and cannot affect the current build or deploy.

## Project layout

Application code lives under `src/` (App Router in `src/app`, the Airtable DAL in
`src/lib/airtable`, auth in `src/lib/auth`, admin form/action helpers in
`src/lib/admin`, seed data in `src/lib/seed`, admin UI in `src/components/admin`).
Brand assets are in `public/brand/`; raster seed placeholders in `public/seed/`;
the App Router icon set (`icon.png`, `apple-icon.png`, `favicon.ico`) under
`src/app/`. See `design.md` §4 for the full folder map.
