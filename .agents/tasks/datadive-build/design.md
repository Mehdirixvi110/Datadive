# Datadive Marketing Website — Technical Design

> Scope: the production-ready **Datadive** marketing site. Implements the contract in
> `requirements.md`; informed by `source-notes.md` (seed copy, logo inventory) and
> `inspiration-notes.md` (typography, color, section skeleton, motion ideas). This is an
> **original** design, not a clone of the three reference sites.
>
> This is the design phase. **No application code is written in this step.** Every decision
> below is intended to be implementable without further architectural choices. Where more than
> one approach is viable it is named and **one is chosen with reasoning**; the chosen stack is
> **locked** once this document is approved.

---

## 1. Overview

Datadive is a mostly-single-page marketing site (`/` with anchored sections) plus a blog
(`/blog`, `/blog/[slug]`), optional project detail pages (`/work/[slug]`), and a
Google-protected admin dashboard (`/admin/*`). It is a Next.js App Router application rendered
on the server as React Server Components (RSC), statically cached with ISR, and served from
Vercel's CDN.

All public content comes from Airtable through a single typed data-access layer (DAL). When
Airtable credentials are absent, the exact same DAL returns **seed data** so the public site
builds and renders fully with zero environment variables. Admins edit content through in-app
forms that call **server actions**; each successful write triggers **on-demand tag
revalidation**, so edits appear on the live site within one request without a full rebuild.
Images are uploaded to **Vercel Blob** and referenced by URL. Auth is **NextAuth v5 (Auth.js)**
with the Google provider, gated by an `ADMIN_EMAILS` allowlist enforced server-side on every
admin page and every mutating action.

Request/data flow:

```
Public read:
  Browser → Vercel CDN (ISR/Full Route Cache)
          → RSC render → DAL read (fetch Data Cache, tagged)
          → Airtable REST (rate-limited)  — OR —  seed data (no creds)

Admin write:
  Browser (client form) → Server Action [requireAdmin → Zod validate]
          → DAL write → Airtable REST → revalidateTag(...) → CDN refreshes

Image upload:
  Browser → @vercel/blob client upload() → /api/blob/upload [requireAdmin signs token]
          → Vercel Blob → public URL → stored in record via admin action

Auth:
  Browser → /api/auth/[...nextauth] (Google OAuth) → JWT session
          → middleware guards /admin/* ; requireAdmin() re-checks allowlist every request
```

---

## 2. Technology stack (locked)

| Concern | Choice | Version target | Notes |
|---|---|---|---|
| Framework | Next.js, App Router, RSC | **15.x** | Node 20 runtime on Vercel. |
| UI runtime | React / React DOM | **19.x** | Matches Next 15 default. |
| Language | TypeScript | **5.x** | `strict: true`. |
| Styling | Tailwind CSS | **3.4.x** | `tailwind.config.ts` + PostCSS. Chosen over v4 for a stable, well-documented config-file workflow and mature plugin ecosystem. |
| Data source | Airtable REST API | Web API v0 | Accessed via native `fetch` (see §6), never a component. |
| Auth | NextAuth v5 / Auth.js | **5.0.0-beta.25** (pinned) | Google provider, JWT sessions. Exact beta pinned in package.json + committed package-lock.json for reproducible zero-env builds (rev-2 F5); the §9 construction/lazy-MissingSecret behavior is tied to and must be confirmed against this pin. |
| Image storage | Vercel Blob (`@vercel/blob`) | current | Client-upload flow (see §10). |
| Mutations | Next.js Server Actions | built-in | Plus route handlers for NextAuth + Blob upload. |
| Forms + validation | react-hook-form + **Zod** | current | Shared Zod schemas, client + server. |
| Rich text | react-markdown + remark-gfm + **rehype-sanitize** | current | Airtable rich-text returns Markdown; sanitized on render. |
| Animation | Framer Motion (`framer-motion`) | current | `MotionConfig reducedMotion="user"` + CSS fallbacks. |
| Icons | lucide-react | current | Mapped from Airtable icon keys. |
| Fonts | `next/font/google`: Inter, Plus Jakarta Sans, JetBrains Mono | — | Body / display / data-mono. |
| Testing | **Vitest** (unit + integration) | current | Optional Playwright for e2e. |
| Lint/format | ESLint (`next/core-web-vitals`) + Prettier | current | Custom `no-restricted-imports` rule for the Airtable boundary. |

Node version pinned via `.nvmrc` / `engines` to Node 20. Package manager: **npm** (Vercel
default; `package-lock.json` committed).

> **Next 15 version notes the implementation must respect:** `fetch` is **not** cached by
> default — caching is opt-in via `next: { revalidate, tags }` (which this design relies on,
> §7). Dynamic APIs `cookies()`, `headers()`, `params`, and `searchParams` are **async** and
> must be `await`ed. GET route handlers are not cached by default.

---

## 3. Architecture principles

1. **One Airtable boundary.** Only `src/lib/airtable/*` imports the Airtable client. Enforced
   by an ESLint `no-restricted-imports` rule and `import 'server-only'` in that module. No page,
   component, or action calls Airtable directly (FR-24.1).
2. **Server-first.** Pages and sections are RSC and read through the DAL. Interactivity
   (menus, forms, counters, animations, the playful hero) lives in small client components that
   receive already-fetched, already-typed data as props. Data never fetches on the client for
   public content.
3. **Typed domain models, not raw records.** The DAL maps Airtable records to camelCase domain
   types and tolerates missing/optional fields with safe defaults (FR-24.2, FR-24.3).
4. **Source-agnostic consumers.** Components cannot tell live Airtable from seed data; both come
   through identical DAL signatures (FR-25.3).
5. **Defense in depth for admin.** Middleware gate + `requireAdminPage()` on the protected admin
   layout + `withAdmin()` wrapper (via `requireAdmin()`) on every mutating action and the upload
   route (FR-18.4). The two gate helpers and their deny behaviors are defined in §9.
6. **Fail safe, never blank.** A read failure degrades to cached-or-seed data and logs
   server-side; it never throws into a public page (NFR-9.3).

---

## 4. Folder layout (inside `datadive-web/`)

```
datadive-web/
├─ .agents/                         # existing task docs (left in place; optional to commit)
├─ public/
│  ├─ brand/                        # the 3 brand PNGs copied from the parent dir (§24)
│  │  ├─ datadive-logo-color.png    # from "Datadive logo file-01.png" (1667²)
│  │  ├─ datadive-logo-white.png    # from "Datadive white logo-01.png" (1667²)
│  │  └─ datadive-mark.png          # from "Datadive.png" (400²) → favicon/OG base
│  └─ seed/                         # committed raster PNG placeholders (project/avatar/logo/cover) — raster, not SVG (§8/§10, rev-2 F2)
│                                   # NOTE: favicon.ico/icon.png/apple-icon.png now live under app/ (not public/) so the App Router auto-emits their <link> tags (N8, §24)
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                 # root: fonts, <html> theme, metadataBase, Nav+Footer+WA
│  │  ├─ page.tsx                   # home: composes sections from DAL reads
│  │  ├─ globals.css                # Tailwind layers + CSS variables (theme tokens)
│  │  ├─ not-found.tsx              # branded 404 (FR-1.6)
│  │  ├─ sitemap.ts                 # NFR-13.3
│  │  ├─ robots.ts                  # NFR-13.3
│  │  ├─ opengraph-image.tsx        # generated brand OG IMAGE ROUTE (fallback bytes) only — NOT the og:image source of truth; generateMetadata owns og:image (§17, N4)
│  │  ├─ icon.png, apple-icon.png, favicon.ico  # App Router icon convention: auto-emits <link rel=icon>/apple-touch-icon; generated from datadive-mark.png (N8)
│  │  ├─ blog/
│  │  │  ├─ page.tsx                # listing (published, desc)
│  │  │  └─ [slug]/page.tsx         # post + generateMetadata + generateStaticParams
│  │  ├─ work/
│  │  │  └─ [slug]/page.tsx         # optional project detail (FR-5.5)
│  │  ├─ admin/
│  │  │  ├─ login/page.tsx          # UNGATED sign-in / AccessDenied / "not configured" notice — outside the gate (rev-2 F1); `export const dynamic = 'force-dynamic'` so cred-detection is request-time (N1)
│  │  │  └─ (protected)/            # route group: adds NO URL segment, so admin URLs are unchanged
│  │  │     ├─ layout.tsx           # requireAdminPage() gate + dashboard shell (wraps only this group)
│  │  │     ├─ page.tsx             # dashboard home (entity cards + counts)       → /admin
│  │  │     ├─ settings/page.tsx    # singleton editor                             → /admin/settings
│  │  │     ├─ hero/page.tsx        # singleton editor
│  │  │     ├─ about/page.tsx       # singleton editor
│  │  │     ├─ cta/page.tsx         # singleton editor
│  │  │     ├─ nav/                 # list CRUD
│  │  │     ├─ services/   (page.tsx, new/page.tsx, [id]/page.tsx)
│  │  │     ├─ projects/   (page.tsx, new/page.tsx, [id]/page.tsx)   # gallery editor inline
│  │  │     ├─ industries/ stats/ clients/ reviews/ team/           # same list CRUD shape
│  │  │     ├─ blog/       (page.tsx, new/page.tsx, [id]/page.tsx)
│  │  │     └─ submissions/page.tsx # read + status triage (no create)
│  │  └─ api/
│  │     ├─ auth/[...nextauth]/route.ts   # NextAuth v5 handlers
│  │     ├─ blob/upload/route.ts          # @vercel/blob handleUpload (requireAdmin)
│  │     └─ revalidate/route.ts           # OPTIONAL secret-protected external trigger
│  ├─ components/
│  │  ├─ ui/            # Button, Card, Badge, Input, Textarea, Select, Container, Section, SectionHeading, Toast
│  │  ├─ sections/      # Hero, About, Services, Industries, Work, Stats, Clients, Reviews, Team, Cta, Contact
│  │  ├─ nav/           # Navbar (client menu), Footer, WhatsAppButton
│  │  ├─ motion/        # Reveal, CountUp, GlowBlob, DiveField (the playful feature)
│  │  ├─ blog/          # PostCard, Markdown (sanitized renderer)
│  │  └─ admin/         # EntityTable, EntityForm, ImageField, OrderControls, DeleteButton, SignOut
│  ├─ lib/
│  │  ├─ airtable/
│  │  │  ├─ client.ts   # server-only raw REST fetch + rate limiter + retry (ONLY Airtable touchpoint)
│  │  │  ├─ schema.ts    # table-name constants + field-name maps (the contract mirror)
│  │  │  ├─ tags.ts      # cache-tag constants
│  │  │  ├─ mappers.ts   # Airtable record → domain model (+ safe defaults)
│  │  │  ├─ read.ts      # typed read fns per table (public + admin variants)
│  │  │  └─ write.ts     # typed create/update/delete per table
│  │  ├─ auth/
│  │  │  ├─ config.ts    # NextAuth v5 options (Google, callbacks, pages)
│  │  │  └─ require-admin.ts  # server session + allowlist check; withAdmin() action wrapper
│  │  ├─ seed/
│  │  │  └─ index.ts     # seed data for every content type (same domain types)
│  │  ├─ validation/     # Zod schemas (contact + per-entity + settings), shared client/server
│  │  ├─ types/          # domain model TS types
│  │  └─ utils/          # whatsapp link, slugify, stat format, env helpers, logger
│  ├─ auth.ts            # re-exports { handlers, auth, signIn, signOut } from lib/auth/config
│  └─ middleware.ts      # guards /admin/* (matcher scoped to /admin/:path*, excludes /admin/login); runs on Edge → imported auth config must stay Edge-compatible (JWT only, no adapter) (N6, §9)
├─ .env.example
├─ .gitignore
├─ next.config.ts        # images.remotePatterns (Blob), experimental flags if needed
├─ tailwind.config.ts
├─ postcss.config.mjs
├─ tsconfig.json
├─ vitest.config.ts
├─ package.json
├─ package-lock.json
├─ .nvmrc
└─ README.md             # setup + the Airtable schema contract (must match §5 exactly)
```

---

## 5. Airtable base schema (the contract)

This schema is a **contract**: `src/lib/airtable/schema.ts` and `README.md` must mirror it
exactly. Table names are centralized constants in `schema.ts` (the default contract); each may
be overridden by an optional `AIRTABLE_TABLE_<KEY>` env var for operators who rename tables, but
operators are not required to set them. Only `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` are
mandatory secrets.

**Image convention (schema-wide decision):** images are **not** stored in Airtable *Attachment*
fields. Airtable attachment URLs now expire after a short period and cannot be hotlinked from a
public site. Every image is stored as a **URL text field** holding a stable Vercel Blob URL,
paired with a **plain-text alt field**. Projects, which need multiple images, use a linked child
table `ProjectImages`.

Common conventions: list tables carry `Order` (Number) for admin-defined display order and a
visibility flag (`Visible` for sections, `Published` for blog/projects/reviews where draft state
matters). Singleton tables hold exactly one row; the DAL reads the first record and the admin UI
edits it in place. `Name` is each table's Airtable primary field.

The **`Req`** column below is a **Zod/DAL contract, not an Airtable constraint**: the Airtable REST
API neither enforces "required" on writes nor applies single-select/field **defaults** to
API-created records. Required-ness and defaults are therefore owned by the validation layer (Zod,
§13) and the DAL writer — which sets any documented default **explicitly** on write (e.g.
`ContactSubmissions.Status = 'New'`, §5.15/§6) — plus the mapper's safe defaults on read (§6).
This closes the gap where an API-created record could otherwise land with an empty required field
(rev-2 F6).

### 5.1 Settings (singleton)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | Label only, e.g. "Site Settings". |
| BrandName | Single line text | ✓ | "Datadive". |
| Tagline | Single line text | ✓ | "Diving Into Data, Driving Decisions". |
| ContactEmail | Email | ✓ | Footer + contact. |
| Phone | Phone | – | Optional. |
| WhatsappNumber | Single line text | – | Stored normalized to digits (see §13). Empty → WA button hidden (FR-13.4). |
| WhatsappPrefillMessage | Long text | – | Optional prefilled `wa.me` text. |
| LinkedinUrl | URL | – | Seed: company LinkedIn. |
| WebsiteUrl | URL | – | Seed: datadiveanalytics.com. |
| AddressText | Long text | – | Optional. |
| LogoLightUrl | URL | – | Full-color mark for light surfaces; falls back to `/brand/datadive-logo-color.png`. |
| LogoDarkUrl | URL | – | White mark for dark surfaces; falls back to `/brand/datadive-logo-white.png`. |
| OgImageUrl | URL | – | Default share image; falls back to generated brand OG. |
| PrimaryCtaLabel | Single line text | – | Global nav CTA label. |
| PrimaryCtaHref | Single line text | – | Global nav CTA target (`#contact` default). |

### 5.2 Hero (singleton)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | Label. |
| Eyebrow | Single line text | – | Small label above headline. |
| Headline | Single line text | ✓ | Seed: "Diving Into Data, Driving Decisions". |
| Subheadline | Long text | – | Seed: mission lockup. |
| PrimaryCtaLabel | Single line text | – | |
| PrimaryCtaHref | Single line text | – | |
| SecondaryCtaLabel | Single line text | – | |
| SecondaryCtaHref | Single line text | – | |
| ImageUrl | URL | – | Hero visual (Blob); seed placeholder if empty. |
| ImageAlt | Single line text | – | Required if ImageUrl set (validation §13). |

### 5.3 About (singleton)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | Label. |
| Heading | Single line text | ✓ | |
| Body | Long text (rich text ON) | ✓ | Markdown; rendered sanitized. Seed: mission copy. |
| Points | Long text | – | One scannable point per line (FR-3.3); parsed with the §6 tolerant line parser (trim, drop blank lines, cap item count). |
| ImageUrl | URL | – | Optional. |
| ImageAlt | Single line text | – | Required if ImageUrl set. |

### 5.4 Services (list)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | Service title. |
| Description | Long text | ✓ | |
| Icon | Single select | – | Option set below; mapped to lucide icons in `mappers.ts`. |
| Accent | Single select | – | `blue` \| `amber` \| `green` \| `red` (card accent, §16). |
| Order | Number | ✓ | |
| Visible | Checkbox | ✓ | Default true. |

**`Icon` option set → lucide mapping (contract; `schema.ts`/`mappers.ts`/README must mirror exactly):**

| Airtable `Icon` option | lucide-react icon |
|---|---|
| `dashboard` | `LayoutDashboard` |
| `bi` | `BarChart3` |
| `ai` | `BrainCircuit` |
| `custom` | `Wrench` |
| `etl` | `Workflow` |
| `report` | `FileBarChart` |

A missing, empty, or unrecognized `Icon` key resolves to a default `Sparkles` icon in the mapper,
so an unmapped value never throws (FR-24.3).

Seed: the 4 core offerings from `source-notes.md` (icons `dashboard`, `bi`, `ai`, `custom`).

### 5.5 Projects (list)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | Project title. |
| Slug | Single line text | ✓ | Unique, URL-safe; used by `/work/[slug]`. |
| Summary | Long text | ✓ | Short card description. |
| Body | Long text (rich text ON) | – | Full detail (Markdown). Non-empty `Body` is what defines `hasDetail` (see below). |
| CoverImageUrl | URL | – | Card/detail cover; seed placeholder if empty (FR-5.3). |
| CoverImageAlt | Single line text | – | Required if CoverImageUrl set. |
| Images | Link → ProjectImages | – | Gallery (ordered child rows). |
| Tags | Multiple select | – | Industry/skill chips (free-form display). |
| Metrics | Long text | – | One `value \| label` per line, e.g. `150K+ \| records cleaned`. Parsed with the §6 tolerant line parser (trim, drop blank lines, cap count; a line with no `\|` → label only, never thrown). |
| Featured | Checkbox | – | Optional highlight. |
| Order | Number | ✓ | |
| Published | Checkbox | ✓ | Default true; false hides publicly. |

Seed: 5 primary case studies + 4 "other" case studies from `source-notes.md`.

**`hasDetail` predicate (the single rule used across §6, §7, §11, §17).** A project exposes a
`/work/[slug]` detail page **iff** `Published === true` **and** `Body` is non-empty. A published
project with an empty `Body` is a **card-only** entry: it renders in the Work grid but has no
detail link and no `/work/[slug]` route. This one predicate governs `generateStaticParams`, the
sitemap, Work-card linking, and the detail page's `notFound()` branch, so a bodyless project can
never produce a pre-rendered empty page or a 404'd link (resolves F6).

### 5.6 ProjectImages (child of Projects)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | Label. |
| Project | Link → Projects (single) | ✓ | Parent. |
| ImageUrl | URL | ✓ | Blob URL. |
| Alt | Single line text | ✓ | |
| Order | Number | ✓ | Gallery order. |

### 5.7 Industries (list)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | Industry label. |
| Description | Long text | ✓ | |
| Icon | Single select | – | Option set below; mapped to lucide icons in `mappers.ts`. |
| Accent | Single select | – | `blue`\|`amber`\|`green`\|`red`. |
| Order | Number | ✓ | |
| Visible | Checkbox | ✓ | |

**`Icon` option set → lucide mapping (contract; `schema.ts`/`mappers.ts`/README must mirror exactly):**

| Airtable `Icon` option | lucide-react icon | Seeded sector |
|---|---|---|
| `hr` | `Users` | Human Resources |
| `health` | `HeartPulse` | Healthcare & NGOs |
| `retail` | `ShoppingCart` | Retail & Sales |
| `ops` | `Building2` | Corporate Operations |
| `ml` | `BrainCircuit` | AI & Machine Learning |

A missing, empty, or unrecognized `Icon` key resolves to the same default `Sparkles` icon as §5.4
(FR-24.3).

Seed: the 5 sectors from `source-notes.md`, each with its matching `Icon` option above.

### 5.8 Stats (list)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | Stat label (e.g. "Records cleaned"). |
| Value | Number | ✓ | Numeric count-up target (e.g. 150, 85, 42, 100, 30). |
| Prefix | Single line text | – | e.g. "$". |
| Suffix | Single line text | – | e.g. "K+", "%", "+". |
| DisplayOverride | Single line text | – | If set, shown verbatim (no count-up) for non-numeric cases. |
| Order | Number | ✓ | |
| Visible | Checkbox | ✓ | |

Seed: 150K+ records, 100K+ records, 85% accuracy, 42+ countries, 30+ staff.

### 5.9 Clients (list)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | Org name (text fallback if no logo, FR-8.2). |
| LogoUrl | URL | – | Blob URL. |
| LogoAlt | Single line text | – | Required if LogoUrl set. |
| SectorGroup | Single select | ✓ | `International & Development` \| `Corporate & Technology` \| `Independent Case Studies`. |
| WebsiteUrl | URL | – | Optional. |
| Order | Number | ✓ | |
| Visible | Checkbox | ✓ | |

Seed: ≥6 **clearly-labeled placeholder** clients spread across the three `SectorGroup` buckets (≥2
per bucket). `source-notes.md` has only sector groupings and **no named clients/logos**, so these
are explicit sample data, fully replaceable in admin. Seed as a deliberate mix: some entries carry
a `public/seed/` placeholder logo SVG, others are **name-only** (empty `LogoUrl`) to exercise the
FR-8.2 text fallback. This guarantees the Clientele section renders populated in the no-credential
build (FR-25.1, FR-25.2) rather than empty.

### 5.10 Reviews (list)

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

Seed: clearly-labeled placeholder testimonials (none exist in source — Assumption 3). Per FR-9.2,
reviews fall back to these seed placeholders **even when credentials are present but the live
Reviews table is empty** — `getReviews()` special-cases this (see §6/§8), unlike every other list
(which returns a real empty set on an empty table).

### 5.11 TeamMembers (list)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | |
| Role | Single line text | ✓ | |
| Bio | Long text | – | |
| PhotoUrl | URL | – | Placeholder avatar if empty (FR-14.3). |
| PhotoAlt | Single line text | – | Required if PhotoUrl set. |
| LinkedinUrl | URL | – | |
| Order | Number | ✓ | |
| Visible | Checkbox | ✓ | |

Seed: Mehdi Abbas (Founder & Lead Data Analyst); Syed Ali Wazir Tufail (Creative Design &
Visualization Expert); third member seeded with the **known** role "Full-Stack & DevOps Engineer"
(captured in `source-notes.md`) and a clearly-labeled placeholder **name** — Assumption 4 concerns
the missing name only; the name stays admin-editable.

### 5.12 BlogPosts (list)

| Field | Type | Req | Notes |
|---|---|---|---|
| Title | Single line text | ✓ | Primary field. |
| Slug | Single line text | ✓ | Unique, URL-safe, stable (FR-11.5). |
| Excerpt | Long text | ✓ | Listing summary. |
| Body | Long text (rich text ON) | ✓ | Markdown; sanitized render (NFR-11.4). |
| CoverImageUrl | URL | – | Placeholder if empty. |
| CoverImageAlt | Single line text | – | Required if CoverImageUrl set. |
| Author | Single line text | ✓ | |
| PublishDate | Date | ✓ | Listing sorts desc by this. |
| Published | Checkbox | ✓ | **Default false**; drafts excluded publicly (FR-10.3). |
| Tags | Multiple select | – | |
| SeoTitle | Single line text | – | Overrides `<title>`. |
| SeoDescription | Long text | – | Overrides meta description. |

Seed: ≥2 sample posts so `/blog` is populated by default (FR-10.5), clearly labeled placeholders.

### 5.13 CtaBand (singleton)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | Label. |
| Heading | Single line text | ✓ | Seed: "Let's Dive Into Data Together". |
| Subtext | Long text | – | |
| PrimaryCtaLabel / PrimaryCtaHref | Single line text | – | |
| SecondaryCtaLabel / SecondaryCtaHref | Single line text | – | e.g. WhatsApp. |

### 5.14 NavLinks (list)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | Link label. |
| Href | Single line text | ✓ | `#services`, `/blog`, etc. |
| Order | Number | ✓ | |
| Visible | Checkbox | ✓ | |
| OpenInNewTab | Checkbox | – | |

Seed: Home, About, Services, Work, Clients, Team, Blog, Contact.

### 5.15 ContactSubmissions (write-mostly)

| Field | Type | Req | Notes |
|---|---|---|---|
| Name | Single line text | ✓ | Submitter name. |
| Email | Email | ✓ | |
| Company | Single line text | – | |
| Subject | Single line text | – | |
| Phone | Phone | – | |
| Message | Long text | ✓ | |
| SubmittedAt | Created time | auto | Airtable-managed. |
| Status | Single select | ✓ | `New` \| `Read` \| `Archived` — admin triage. `createContactSubmission` sets `Status: 'New'` **explicitly** on write (Airtable applies no API-side default — rev-2 F6), so every inbound lead is triageable and none lands status-less. |
| SourcePage | Single line text | – | Where submitted. |

### 5.16 Relationships

Only one hard relationship: **Projects 1—* ProjectImages** (Airtable "Link to another record").
Everything else is intentionally flat (select/multi-select, not links) to keep reads to one
request per table and stay comfortably under the rate limit. `getProject(slug)` fetches the
project plus its `ProjectImages` (two cached requests) and joins them in the mapper.

---

## 6. Typed data-access layer (DAL)

The DAL (`src/lib/airtable/*`) is the single module where Airtable is touched. It starts with
`import 'server-only'` so it can never be bundled client-side, and the ESLint rule forbids
importing it (or the raw client) outside `src/lib/airtable`.

**Airtable access method — decision.** Two options: the official `airtable` npm SDK, or direct
`fetch` to the Airtable REST API. **Chosen: direct `fetch`.** Rationale: in Next 15, caching and
on-demand invalidation hang off the native `fetch` Data Cache via `next: { revalidate, tags }`.
The SDK uses its own HTTP layer, which would force everything through `unstable_cache` (an
unstable API) and give coarser invalidation. Direct `fetch` yields precise per-table tags, no
extra dependency, and full control of pagination, retries, and rate limiting. The cost — writing
pagination and error handling by hand — is contained in `client.ts`.

`client.ts` responsibilities:
- Build requests to `https://api.airtable.com/v0/{baseId}/{table}` with the PAT bearer token.
- **Rate limiter**: a token-bucket (capacity 5, refill ~4/sec) plus concurrency cap of 4 wraps
  *every* Airtable call so bursts (build, revalidation, bulk reads) stay under Airtable's ~5
  req/sec/base ceiling (NFR-9.2). Reads are usually served from cache, so the limiter mainly
  guards build/revalidation storms and writes. **Per-instance limitation (resolves N5):** the
  token bucket lives in-process, so on Vercel each concurrent lambda holds its own bucket and the
  **aggregate** rate across instances can exceed ~5 req/s/base during a revalidation burst or
  parallel builds — the same per-instance caveat already acknowledged for the §13/§19 contact rate
  limiter. This is acceptable for v1 because public reads are cache-served (Airtable is hit only on
  cold build, after a tag invalidation, or when the hourly backstop lapses), writes are low-volume
  admin actions, and the build runs single-process; the 429 backoff/retry below is the backstop if
  the aggregate ceiling is momentarily crossed. The limiter therefore caps **per-instance** traffic
  at ~4 req/sec, not global traffic.
- **Pagination**: follow `offset` until exhausted for list reads.
- **Retry/backoff**: on 429 or 5xx, retry up to 3× with exponential backoff (base 500ms, honoring
  Airtable's ~30s penalty window on repeated 429).
- **Read caching split by audience (resolves M2).** Not every read is cached — the fetch options
  depend on who the read serves:
  - **Public reads** (`getServices`, `getProjects`, `getIndustries`, `getStats`, `getClients`,
    `getReviews`, `getTeam`, `getNavLinks`, `getSettings`, `getHero`, `getAbout`, `getCta`,
    `getProject`, `getProjectDetailSlugs`, `getBlogPosts`, `getBlogPost`, `getPublishedPostSlugs`)
    pass `next: { revalidate: 3600, tags: [...] }` — an **explicit** fetch-level revalidate of
    **3600s (1 hour)**, matching the page-segment backstop in §7, with on-demand `revalidateTag`
    making edits instant.
  - **Admin reads** (`getAll*`, every `getXById`, `getSubmissions`) pass `cache: 'no-store'` and
    attach **no tags**, so the admin UI always reads **live** Airtable state. This is required
    because in Next 15 an explicit per-fetch `next: { revalidate, tags }` still writes to the Data
    Cache **even inside a `force-dynamic` route** (`force-dynamic` only changes the *default* to
    `no-store`; explicit options win), which would otherwise make §7's "`/admin/*` … always live"
    false and hide out-of-band Airtable edits for up to the 1-hour backstop.
- Writes are uncached (`cache: 'no-store'`).

`read.ts` exposes typed functions returning domain models:

```
getSettings(): Promise<Settings>
getHero(): Promise<Hero>
getAbout(): Promise<About>
getCta(): Promise<Cta>
getNavLinks(): Promise<NavLink[]>            // visible, ordered
getServices(): Promise<Service[]>            // visible, ordered
getIndustries(): Promise<Industry[]>
getStats(): Promise<Stat[]>
getClients(): Promise<Client[]>              // grouped by SectorGroup in the mapper/consumer
getReviews(): Promise<Review[]>              // published, ordered; empty live table → seed placeholders (FR-9.2, §8/M1)
getTeam(): Promise<TeamMember[]>
getProjects(): Promise<Project[]>            // published, ordered
getProject(slug): Promise<Project | null>    // + joined ProjectImages; returns null unless Published===true (no draft leak — rev-2 F8)
getProjectDetailSlugs(): Promise<string[]>   // hasDetail only (Published && Body non-empty) — feeds /work params + sitemap (§5.5, F6)
getBlogPosts(): Promise<BlogPost[]>          // published, desc by PublishDate
getBlogPost(slug): Promise<BlogPost | null>  // published only
getPublishedPostSlugs(): Promise<string[]>
// admin variants bypass publish/visibility filters (uncached — cache:'no-store', see below):
getAllServices(), getAllProjects(), getAllIndustries(), getAllStats(), getAllClients(),
getAllReviews(), getAllTeam(), getAllNavLinks(), getAllBlogPosts()
// admin by-id reads (one per list entity; back the /admin/[entity]/[id] edit pages):
getServiceById(id), getProjectById(id), getIndustryById(id), getStatById(id),
getClientById(id), getReviewById(id), getTeamMemberById(id), getNavLinkById(id),
getBlogPostById(id)
getSubmissions()
```

**Admin by-id reads and `ProjectImages` writers — enumerated (resolves N7).** The by-id reads
above (`getServiceById`, `getIndustryById`, `getStatById`, `getClientById`, `getReviewById`,
`getTeamMemberById`, `getNavLinkById`, plus the already-named `getProjectById` / `getBlogPostById`)
are the functions the `/admin/[entity]/[id]` edit pages depend on; like every admin read they are
**uncached** (see the audience split below). The inline gallery editor (§12) depends on three
`ProjectImages` writers in `write.ts` — `createProjectImage`, `updateProjectImage`,
`deleteProjectImage`. **`createProjectImage` must populate the `Project` link as an array of record
ids** (Airtable "Link to another record" expects an id array even for a single parent), and all
three resolve the **parent project slug** for revalidation from the editing project's context (the
gallery editor always runs inside a known project edit), then call `revalidateTag('project:{slug}')`
+ `revalidateTag('projects')` (§7).

Public read functions apply `Published`/`Visible` filtering and ordering **inside the DAL** so a
page can never accidentally render a draft (invariant §15). Admin `getAll*` variants include
hidden/draft rows for editing. When credentials are present but a read returns zero rows, singleton
reads fall back to the seed singleton (never blank) and list reads return the real empty set and
never reinject seed — **except `getReviews()`, which falls back to seed placeholders on an empty
Reviews table per FR-9.2** (the one deliberate exception); §8 states the full rule.

`write.ts` exposes typed `create*`, `update*`, `delete*` per list entity, `update*` upserts for
singletons (write to the first/only record), `updateSettings`, `createContactSubmission` (the
only public write — it sets `Status: 'New'` explicitly, since Airtable applies no API-side
single-select default, rev-2 F6), and `updateSubmissionStatus`. Each returns a typed result;
callers (server actions) own revalidation.

`mappers.ts` converts Airtable records to domain models, applying safe defaults for every
missing/optional field (empty string, empty array, `null` image, `Order ?? 0`) so a malformed or
partially-filled record never throws (FR-24.3). Image fields map to `{ url, alt } | null`.
**Free-form line-parsed fields** (`About.Points`, `Projects.Metrics`, and any future per-line
field) share **one tolerant parser** so the never-throws guarantee cannot quietly fail on messy
input (rev-2 F9): split on newlines, `trim()` each line, **drop blank/whitespace-only lines**, and
**cap** the result at a defensive maximum (e.g. 24 items) so an over-long paste cannot bloat a
page. A `Metrics` line is split on its **first** `|` only; a line **without** a `|` maps to
`{ value: '', label: trimmedLine }` (degraded to a plain label, never dropped silently and never
thrown). `getProject(slug)` returns `null` unless `Published === true`, so a draft can never be
read into a public route (the `/work/[slug]` page then layers the empty-`Body` `notFound()` branch
on top — §11).

Domain types live in `src/lib/types`; `schema.ts` holds table-name constants and the
Airtable-field-name maps; `tags.ts` holds cache-tag constants (§7).

---

## 7. Caching & revalidation

**Read caching.** Caching is split by audience (§6): **public** DAL reads pass
`next: { revalidate: 3600, tags: [...] }` (explicit 1-hour fetch-level revalidate matching the
segment backstop below, plus tags for instant on-demand freshness), while **admin** reads
(`getAll*`, `getXById`, `getSubmissions`) pass `cache: 'no-store'` with **no tags** so `/admin/*`
is always live. Public pages set a conservative segment backstop and rely on tags for freshness:

| Route | `export const revalidate` | Primary data tags | Notes |
|---|---|---|---|
| `/` (home) | `3600` | all section tags + `settings`, `nav` | ISR hourly backstop; tags make edits instant. |
| `/blog` | `3600` | `blogposts`, `settings`, `nav` | |
| `/blog/[slug]` | `3600` | `blogpost:{slug}`, `blogposts`, `settings`, `nav` | `generateStaticParams` from published slugs; `dynamicParams = true`. |
| `/work/[slug]` | `3600` | `project:{slug}`, `projects`, `settings`, `nav` | `generateStaticParams` from `getProjectDetailSlugs()` (hasDetail only); `dynamicParams = true`; page calls `notFound()` when `Body` is empty. |
| `/admin/*` | `dynamic` (no cache) | — | `export const dynamic = 'force-dynamic'`; always live, always auth-checked. Admin DAL reads use `cache:'no-store'` (no tags), so even under `force-dynamic` no admin read is Data-Cache-served — out-of-band Airtable edits are visible immediately (reconciled with §6, resolves M2). |
| `/admin/login` | `dynamic` (no cache) | — | `export const dynamic = 'force-dynamic'` so `hasAuthCreds()` cred-detection is request-time, not frozen at build (resolves N1). Ungated (§9). |

**Tag taxonomy** (`tags.ts`): one per table — `settings`, `hero`, `about`, `cta`, `nav`,
`services`, `projects`, `industries`, `stats`, `clients`, `reviews`, `team`, `blogposts` — plus
per-item `blogpost:{slug}` and `project:{slug}`. The shared layout reads `settings` and `nav`, so
revalidating those refreshes header/footer/WhatsApp across the whole site in one call (FR-13.3,
FR-21.2, FR-21.4). **`ProjectImages` has no tag of its own**: a gallery create/update/delete
revalidates the parent project's `project:{slug}` **and** `projects` tags, with the parent slug
resolved from the project edit context the gallery editor runs in (§12), so a gallery change
refreshes exactly the routes a project edit would (resolves F10).

**On-demand revalidation (primary path).** Admin edits use server actions. On a successful DAL
write the action calls `revalidateTag(...)` for the affected entity (and `blogpost:{slug}` /
`project:{slug}` when relevant), then returns success. Because this runs **in-process inside an
authenticated action**, there is no public revalidation endpoint to protect — the action is
already behind `requireAdmin()` (FR-23.2). `revalidateTag` invalidates both the Data Cache and
the Full Route Cache for routes that used the tag, so the next public request serves fresh
content (FR-23.1, FR-23.3). Example: saving a service → `revalidateTag('services')`; saving
settings → `revalidateTag('settings')` + `revalidateTag('nav')`; publishing a post →
`revalidateTag('blogposts')` + `revalidateTag('blogpost:'+slug)`.

**Optional external trigger.** `app/api/revalidate/route.ts` accepts `POST { tag }` guarded by a
`REVALIDATE_SECRET` bearer header, for manual/CLI use. It is **not** required for normal admin
flows and is disabled (returns 404/501) if the secret is unset.

**Rate-limit respect.** Because public reads are served from the Full Route / Data Cache, Airtable
is hit only on cold build, after a tag invalidation, or when the hourly backstop lapses. The
`client.ts` token bucket caps **per-instance** Airtable traffic at ~4 req/sec and, combined with
cache-served reads and the 429 backoff/retry, keeps normal operation under Airtable's limit
(NFR-9.1, NFR-9.2). The bucket is in-process, so it does **not** guarantee the ceiling across
concurrent Vercel instances — see the per-instance limitation documented in §6 (N5).

**Degradation.** If a read fails after retries, the DAL returns the last good value where the
cache still holds it, otherwise seed data, and logs server-side; the scheduled ISR backstop
later brings the page current even if an on-demand revalidation failed (FR-23.4, NFR-9.3).

---

## 8. Seed / sample fallback data

`src/lib/seed/index.ts` exports one constant per content type, typed with the same domain models
the DAL returns. The DAL read functions check for credentials once (`hasAirtableCreds()` =
both `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` present); if absent they return the seed constant
instead of calling the network (FR-24.5, FR-25.2). Consumers are identical in both modes
(FR-25.3).

Seed content is derived from `source-notes.md` where real copy exists (brand, tagline, mission,
4 services, 5 industries, 9 case studies, 5 stats, team, contact email/LinkedIn/website) and uses
**clearly-labeled placeholders** where the source is silent (reviews, blog posts, the WhatsApp
number, and **clients/logos** — the profiles give only sector groupings, so seeded clients are
sample data per §5.9 — Assumption 3). Seed image fields point to **committed raster PNG
placeholders** in `public/seed/` and brand PNGs in `public/brand/` (same-origin root-relative
paths, valid under the §13 image rule).

**Placeholders are raster PNG, not SVG — a deliberate decision (resolves rev-2 F2; FR-25.2,
NFR-4.1).** Public pages render every image, placeholders included, through `next/image` for
optimization (§10, NFR-9.4), and the Next.js Image Optimizer returns **HTTP 400** for an
`image/svg+xml` source unless `images.dangerouslyAllowSVG` is enabled. An SVG placeholder would
therefore 400 at request time and show **broken art across the primary no-credential experience** —
and, critically, this would **not** surface in `npm run build` (the build never fetches images), so
the build gate (§20/§22) would pass while the running site is broken. Raster PNG placeholders keep
the optimizer on with **no** config change and **without** enabling `dangerouslyAllowSVG` (so the
stored-SVG-XSS stance in §10/§19 is preserved). They are small flat-color / logo-mark PNGs
committed to the repo, generated once during setup (e.g. a `sharp` script or hand-exported). On
this basis **no image is ever broken** in the zero-credential build. The WhatsApp seed value is a
placeholder; if an operator leaves it blank the button hides rather than linking somewhere wrong.
Seed is a pure data module with no network and no secrets, so it is importable anywhere and unit
tests validate it against the Zod schemas without credentials (FR-25.4).

**Empty-result rule (credentials present).** `hasAirtableCreds()` decides only *whether to call
Airtable*; it does not govern a live call that returns zero rows. With creds present:
- **Singleton reads** (`getSettings`, `getHero`, `getAbout`, `getCta`): if the table has no row,
  the DAL returns the **seed singleton** for that type, so the shared layout never renders a blank
  BrandName/Tagline/ContactEmail — "fail safe, never blank" (§3.6). Logo/OG keep their file
  fallbacks (§5.1) on top of this.
- **List reads** (services, projects, industries, stats, clients, team, nav, blog): if
  the table returns zero rows, the DAL returns the **real empty list** and **never** reinjects
  seed. An admin who deletes every row gets the section's empty-state, which is the intended admin
  outcome. Seed lists appear **only** when creds are absent.
- **Reviews are the one deliberate exception (FR-9.2).** `getReviews()` special-cases the
  empty-table case: when credentials are present but the live Reviews table returns **zero**
  published rows, the DAL returns the **seed reviews** — the same clearly-labeled, admin-replaceable
  placeholders used in no-creds mode — rather than the real empty list. FR-9.2 requires seeded
  placeholder reviews whenever no reviews exist in the data source, and treats reviews differently
  from blog (FR-10.5 wants `/blog` to show an empty-state when there are no published posts). So
  **blog stays on the empty-set rule above and reviews fall back to seed**; this is the only list
  that reinjects seed when creds are present. All other lists behave as the empty-set rule states.

This split (resolves F5; reviews-fallback resolves M1) is why §5.9's client seed matters: with no
creds the Clientele section reads the seed list; with creds and an empty **non-reviews** table it
correctly shows empty, while an empty Reviews table falls back to seed placeholders per FR-9.2.

---

## 9. Auth & access control

**NextAuth v5 (Auth.js), Google provider, JWT sessions.** Config in `src/lib/auth/config.ts`,
re-exported from `src/auth.ts` as `{ handlers, auth, signIn, signOut }`; the route handler lives
at `app/api/auth/[...nextauth]/route.ts` and re-exports `handlers`.

Provider reads `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` (v5 convention; `GOOGLE_CLIENT_ID/SECRET`
accepted as aliases). Session secret is `AUTH_SECRET` (v5; supersedes `NEXTAUTH_SECRET`). On
Vercel, `AUTH_URL` is inferred; locally it defaults to `http://localhost:3000`.

**Allowlist, enforced twice (defense in depth):**
1. `callbacks.signIn({ user })` rejects sign-in when `user.email` (lowercased) is not in
   `ADMIN_EMAILS` (comma-separated, trimmed, lowercased). Rejection redirects to
   `/admin/login?error=AccessDenied` with a clear "not authorized" message (FR-18.3).
2. The admin guard (`src/lib/auth/require-admin.ts`) re-checks on **every** request: it calls
   `auth()`, and if there is no session or the session email is not in the current allowlist, it
   denies access. This re-check means revoking an email takes effect immediately, without waiting
   for the JWT to expire (FR-18.4, FR-18.5).

**Two guard helpers — one allowlist check, two context-appropriate deny behaviors (rev-2 F3).**
A single function cannot cleanly serve both the page and the API/action deny-paths: `redirect()`
throws `NEXT_REDIRECT` (correct for a page, wrong inside the Blob upload route, which must return a
clean 401), and a bare `throw` inside a layout renders a 500 error boundary instead of bouncing to
login. So `require-admin.ts` exports **two** helpers over the **same** `auth()` + allowlist logic:
- **`requireAdminPage()`** → returns the session, or calls `redirect('/admin/login')` on an
  unauthenticated/unauthorized request. Used by the `(protected)` layout and every admin page.
- **`requireAdmin()`** → returns the session, or **throws `AuthError`**; it never calls
  `redirect()`. Used by server actions via `withAdmin()` (which maps the throw to a typed
  401-style result) and by `/api/blob/upload` (which maps it to a `401 Response`).

**`withAdmin()` must not swallow framework control-flow throws (resolves N2).** Admin create/edit
actions both return a typed result **and** call `redirect()` on success (§12), and `redirect()` /
`notFound()` work by **throwing** errors whose `digest` begins with `NEXT_REDIRECT` /
`NEXT_NOT_FOUND`. So `withAdmin()`'s `catch` must be **narrow**: it maps **only** a thrown
`AuthError` to the typed 401-style result, and **re-throws** any error whose `digest` starts with
`NEXT_REDIRECT` or `NEXT_NOT_FOUND` (and any other non-`AuthError`) so the framework's success
redirect/navigation propagates normally. A broad `catch` that converted every throw into a 401
would break every admin create/edit navigation.

**Where enforcement is wired:**
- `middleware.ts` matches `/admin/:path*` (**excluding `/admin/login`**); it **first** checks
  `hasAuthCreds()` and, if false, redirects to `/admin/login` **without** calling the `auth`
  wrapper, then (creds present) redirects unauthenticated requests to the sign-in page — a coarse
  first gate. **Edge-runtime constraint (resolves N6):** middleware runs on the Edge runtime, so
  the NextAuth config it imports **must stay Edge-compatible — JWT sessions only, no database
  adapter and no Node-only crypto imports**. The current config (Google provider + JWT + a
  string-only `signIn` allowlist callback) is Edge-safe; a later Node-only import or a DB adapter
  in `config.ts` would silently break middleware, so this constraint is a hard rule on
  `config.ts`. The matcher stays **scoped to `/admin/:path*`** so public routes never invoke
  `auth()` — that scoping is what keeps the public, no-creds render completely auth-free.
- `app/admin/(protected)/layout.tsx` is a server component that calls **`requireAdminPage()`**
  before rendering any admin UI, so no admin markup or data is produced for a non-admin even if
  middleware is bypassed. **`/admin/login` lives *outside* this route group** (as
  `app/admin/login/page.tsx`), so the gate layout never wraps the sign-in page and there is **no
  redirect loop** (resolves rev-2 F1). The `(protected)` group adds no URL segment, so every admin
  URL (`/admin`, `/admin/settings`, …) is unchanged.
- Every mutating server action is wrapped with `withAdmin()`, which calls **`requireAdmin()`**
  before touching the DAL and maps a thrown `AuthError` to a typed 401-style result, while
  re-throwing `NEXT_REDIRECT` / `NEXT_NOT_FOUND` control-flow throws (N2 above)
  (FR-18.1, FR-18.4, NFR-11.2).
- `/api/blob/upload` calls **`requireAdmin()`** inside `onBeforeGenerateToken` and maps the throw
  to a `401 Response` (§10).

**No-/partial-credential behavior (NFR-4, fail safe).** A single helper
`hasAuthCreds()` returns true only when **all** of `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and
`AUTH_GOOGLE_SECRET` are present. It is checked **before any `auth()` call** in the three places
that would otherwise invoke the Auth.js handler, because Auth.js v5 throws `MissingSecret`
**lazily at request time** when `AUTH_SECRET` is unset — omitting the Google provider does **not**
prevent this, so an unguarded `auth()` call would turn `/admin/*` into a 500 instead of a safe
redirect (resolves F2):
1. **`middleware.ts`** — `!hasAuthCreds()` → redirect `/admin/*` to `/admin/login`, never calling
   `auth`.
2. **The admin guards** — `!hasAuthCreds()` → treat as "not authorized" **without** calling
   `auth()` (fail safe): `requireAdminPage()` redirects to `/admin/login`; `requireAdmin()` throws
   `AuthError` (→ 401 in actions and the upload route).
3. **`/api/auth/[...nextauth]` handler** — `!hasAuthCreds()` → short-circuit to a 404/501 rather
   than constructing a live handler.
`/admin/login` detects the same condition and renders a "sign-in not configured" notice. Because
that notice branches on `hasAuthCreds()` (env) and `?error=AccessDenied` (query), the page sets
**`export const dynamic = 'force-dynamic'`** so cred-detection runs at request time rather than
being frozen at build (resolves N1); it reads `searchParams` (an async dynamic API in Next 15)
regardless, but the explicit flag makes the request-time guarantee non-accidental for this
security-adjacent page. The public site is unaffected, and the zero-env `npm run build` still succeeds because middleware and
the auth route are not executed at build and `NextAuth(config)` does not throw at construction
(the lazy-`MissingSecret` behavior this relies on is pinned to `next-auth@5.0.0-beta.25` and must
be re-confirmed against that version during implementation — §2, rev-2 F5) (FR-18.6, NFR-4.2).

---

## 10. Image storage — Vercel Blob

**Decision: Vercel Blob**, over Cloudinary and Airtable attachments.
- *Airtable attachments* are rejected because their file URLs now expire and cannot be reliably
  hotlinked from public pages — unusable as a serving layer.
- *Cloudinary* is capable but adds a second vendor account, signed-upload config, and transform
  URLs to manage.
- *Vercel Blob* is first-party to our deploy target, needs only `BLOB_READ_WRITE_TOKEN`, returns
  **stable public URLs** that drop straight into `next/image`, and keeps everything in one
  dashboard. It is the most cohesive choice for a Vercel deployment (NFR-1.2).

**Upload flow — client-upload (`@vercel/blob/client`).** Chosen over a server-side upload action
because Vercel serverless requests cap request bodies at ~4.5MB, and project screenshots/photos
can exceed that. The admin `ImageField` calls `upload(file, { handleUploadUrl: '/api/blob/upload' })`.
The route handler's `handleUpload`:
- `onBeforeGenerateToken`: calls `requireAdmin()` and maps a thrown `AuthError` to a `401
  Response` (rejects non-admins — §9, rev-2 F3); restricts
  `allowedContentTypes` to `image/jpeg`, `image/png`, `image/webp`, `image/avif`; sets
  `maximumSizeInBytes` to **8MB**; `addRandomSuffix: true`. **SVG is disallowed** (stored-SVG XSS
  risk — NFR-11.4).
- `onUploadCompleted`: server-side log only.
The browser uploads directly to Blob and receives the public URL, which the admin form stores in
the record's `*ImageUrl` field on save, alongside the admin-entered alt text (FR-22.1–22.3).

**Serving.** Public pages render Blob URLs through `next/image` for responsive, optimized
delivery (NFR-9.4). `next.config.ts` `images.remotePatterns` allows
`*.public.blob.vercel-storage.com`; `/public` seed/brand assets need no pattern. Because those
same-origin `public/` placeholders are **also** optimized by `next/image`, they are **raster PNG,
never SVG** — the Image Optimizer 400s on SVG unless `dangerouslyAllowSVG` is set (§8, rev-2 F2);
the config therefore does **not** enable `dangerouslyAllowSVG`, which keeps the SVG-XSS stance of
§19 intact. Client logos may render via `next/image` with a text fallback to the client name when
`LogoUrl` is empty (FR-8.2).

**No-credential behavior.** If `BLOB_READ_WRITE_TOKEN` is absent, `ImageField` disables the
upload button and shows "image upload unavailable — set BLOB_READ_WRITE_TOKEN", but still accepts
a **pasted Blob URL** (host-validated per §13 — a non-Blob host is rejected, so a stored URL always
renders through `next/image` and is never broken). Public pages fall back to seed/placeholder
images and the build still succeeds (FR-22.6, NFR-4).

---

## 11. Public routes & pages

Home (`/`) is one page composed of RSC sections in this order (synthesized from
`inspiration-notes.md`, original to Datadive):

`Navbar → Hero → About → Services → Industries → Work (projects) → Stats → Clients → Reviews →
Team → CtaBand → Contact → Footer`, with a global floating **WhatsApp** button.

Each section is a server component that receives DAL data as props from `page.tsx`; interactive
bits (counters, reveals, carousels, the hero feature, the contact form) are client components
nested inside. In-page nav uses anchor ids (`#about`, `#services`, `#work`, `#industries`,
`#stats`, `#clients`, `#reviews`, `#team`, `#contact`) (FR-1.2).

| Route | Rendering | Purpose |
|---|---|---|
| `/` | ISR | Home with all sections (FR-2…FR-16). |
| `/blog` | ISR | Published posts, reverse-chronological; empty-state safe (FR-10). |
| `/blog/[slug]` | ISR + `generateStaticParams` | Full post, sanitized Markdown, per-post SEO/OG; 404 on unknown/draft (FR-11). |
| `/work/[slug]` | ISR + `generateStaticParams` | Detail for `hasDetail` projects only (Published && Body non-empty, §5.5); `notFound()` otherwise (FR-5.5). |
| `not-found` | static | Branded 404 (FR-1.6). |
| `sitemap.ts` / `robots.ts` | generated | `/`, `/blog`, published posts/projects; robots → sitemap (NFR-13.3). |

**Work** (`#work`): a card grid of every published project. A card links to `/work/[slug]` **only
when `hasDetail`** (Published && Body non-empty, §5.5); a published project with no body renders as
a non-linked card (cover/summary/metrics only). This guarantees no Work card ever links to a 404
(resolves F6). The `/work/[slug]` page calls `getProject(slug)`, which returns `null` unless
`Published === true`, then applies the empty-`Body` `notFound()` branch — so under
`dynamicParams = true` a **draft** slug 404s (no draft leak) and a **bodyless published** slug
404s, matching `generateStaticParams`, which emits only the `hasDetail` set (rev-2 F8).

**Contact** (`#contact`): a client form (react-hook-form + Zod) posting to a `submitContact`
server action that validates server-side, applies honeypot + per-IP rate limit, writes to
`ContactSubmissions`, and returns a success/error result preserving entered values (FR-12, §13,
§14). The section also renders email/LinkedIn/website from `settings`.

**WhatsApp button**: a client component given the normalized number + prefill from `settings`;
builds `https://wa.me/<digits>?text=<encoded>`; hidden entirely when no number is configured
(FR-13). Keyboard-focusable with an aria-label; entrance animation respects reduced motion.

---

## 12. Admin dashboard & CRUD

`/admin` (the `(protected)` route group, gated by `requireAdminPage()` in its layout — §4/§9)
presents a shell with navigation to every content type plus settings, the signed-in identity, and
sign-out (FR-19). The sign-in page `/admin/login` lives **outside** that group, so the gate layout
never wraps it (no redirect loop — rev-2 F1). Route map:

| Route | Entity | Shape |
|---|---|---|
| `/admin` | — | Dashboard home (in `(protected)`): card per entity with counts + quick links. |
| `/admin/login` | — | **Ungated** (outside `(protected)`): Google sign-in / AccessDenied / "sign-in not configured" notice. |
| `/admin/settings`, `/hero`, `/about`, `/cta` | singletons | Single edit form; save upserts the one row. |
| `/admin/nav` | NavLinks | List CRUD + order. |
| `/admin/services` | Services | List + `/new` + `/[id]` edit. |
| `/admin/projects` | Projects | List + new/edit; **gallery editor** manages ProjectImages inline. |
| `/admin/industries`, `/stats`, `/clients`, `/reviews`, `/team` | lists | Same list-CRUD shape. |
| `/admin/blog` | BlogPosts | List + new/edit; published/draft toggle. |
| `/admin/submissions` | ContactSubmissions | Read + status triage (New/Read/Archived); no create. |

**CRUD approach (uniform).** A list page (RSC) reads via a DAL `getAll*` function (drafts
included), rendering an `EntityTable` with order, visibility/published flags, and edit/delete
actions. Create/edit pages render `EntityForm` (client, react-hook-form + the entity's Zod
schema). Submit calls a typed server action (`createX` / `updateX` / `deleteX`) wrapped in
`withAdmin()`; the action re-validates with Zod, writes through the DAL, calls `revalidateTag`,
and redirects back to the list with a success toast. Reordering uses up/down controls writing
`Order`. Delete uses a confirm dialog. Image fields use `ImageField` (upload, or paste a **Datadive Blob URL** — host-validated per §13)
with a required alt-text input whenever a URL is present. This single pattern covers all entities
(FR-20).

All ten+ content types named in FR-20.1 (projects, services, reviews, clients, blog, about,
hero, team, industries, stats — plus nav, cta, settings, submissions) are editable here, so no
public section relies on hardcoded literals (FR-20.7).

**Degraded admin mode (no Airtable creds).** When `!hasAirtableCreds()`, the admin shell shows a
read-only banner ("content backend not configured — saves are disabled"). Reads still return seed
data so the editor renders for layout preview, but any save returns the typed "content backend not
configured" result (§14) and makes **no network call**. This mirrors the Blob "upload unavailable"
pattern (§10), so the admin degrades predictably instead of surfacing a misleading Airtable error
(resolves F7).

---

## 13. Input validation (external inputs)

All external input is validated with Zod **server-side** (and the same schema client-side for UX).
Validation runs before any Airtable write; failures return typed field errors and make no network
call.

**Contact form (`submitContact`)**

| Field | Rules |
|---|---|
| name | required, 2–100 chars |
| email | required, valid email, ≤254 |
| company | optional, ≤120 |
| subject | optional, ≤150 |
| phone | optional, ≤30, chars `+ 0-9 space - ( )` |
| message | required, 10–5000 |
| honeypot (`website`) | must be empty; non-empty → silently accepted (200) but dropped + logged as spam |
| rate limit | ≤5 submissions / minute / IP (in-memory token bucket keyed by `x-forwarded-for`); exceed → friendly 429. Documented limitation: in-memory is per-instance; honeypot is the primary defense (FR-12.5). |

**Admin — common field rules**

| Field kind | Rules |
|---|---|
| title/name | required, 1–200 |
| slug | `^[a-z0-9]+(?:-[a-z0-9]+)*$`; auto-generated from title if blank; **uniqueness** checked on save (query table; on conflict append `-2`, `-3`, …) |
| short text | ≤200 |
| long/body text | ≤20000 |
| URL fields (non-image) | valid `http(s)` URL, ≤2048 — e.g. `LinkedinUrl`, `WebsiteUrl`, and `OgImageUrl` (OG is read into a meta tag, **not** `next/image`, so it is intentionally not host-restricted) |
| **image URL fields** (`LogoLightUrl`, `LogoDarkUrl`, every `*ImageUrl`, `CoverImageUrl`, `LogoUrl`, `AvatarUrl`, `PhotoUrl`, `ProjectImages.ImageUrl`) | ≤2048 and must be **either** a same-origin root-relative asset path matching `^/[\w\-./]+$` (seed/local placeholders) **or** an absolute `https://` URL whose host ends with `.public.blob.vercel-storage.com` (the Blob host). Any other external host is **rejected**, so every stored image is guaranteed to render through `next/image` (resolves F1; FR-25.2, NFR-9.4) |
| **href fields** (`NavLinks.Href`, every `*CtaHref`) | ≤2048 and must match `^(#[\w-]+\|/[\w\-/]*\|https?://[^\s]+)$` — an in-page anchor, a root-relative path, or an absolute `http(s)` URL (resolves F9; the generic URL rule above would wrongly reject anchors and relative hrefs) |
| image alt | ≤200; **required when the paired image URL is set** |
| Order | integer ≥ 0 |
| Rating | integer 1–5 |
| PublishDate | valid ISO date |
| Published/Visible | boolean |

**Settings-specific**

| Field | Rules |
|---|---|
| WhatsappNumber | strip all non-digits; 7–15 digits (E.164-ish) → store digits; empty after strip → stored empty → WA button hidden |
| ContactEmail | valid email |
| LinkedinUrl / WebsiteUrl | valid `http(s)` URL |

**Image upload** (enforced at token issuance): content-type ∈ {jpeg, png, webp, avif}; ≤8MB;
random filename suffix; SVG rejected.

---

## 14. Error handling (per operation)

**DAL reads** (`read.ts`)

| Condition | Class | Caller receives | Logging |
|---|---|---|---|
| No credentials | normal | seed data | none (expected) |
| 200 empty result — **list** | normal | real empty list; seed **not** reinjected (§8) | none |
| 200 empty result — **reviews list** | normal | seed review placeholders (FR-9.2 exception, §8/M1) | none |
| 200 empty result — **singleton** | normal | seed singleton (never blank, §3.6) | none |
| Network / 5xx (after 3 retries) | recoverable | last-cached if held, else seed | `error`: table + status, no secrets |
| 429 rate limit | recoverable | limiter prevents; if hit, backoff+retry, then fallback as above | `warn`: table |
| 401/403 bad token | recoverable (public) | seed data (fail safe) | `error` once: "Airtable auth failed" |
| 404 table/field missing | recoverable | empty list / seed singleton | `error`: table |
| Malformed/missing fields | recoverable | mapper safe defaults | none |

Reads **never throw into a public page** (NFR-9.3).

**DAL writes** (`write.ts`, admin only)

| Condition | Class | Caller receives | Logging |
|---|---|---|---|
| Zod validation fails | recoverable | field errors; **no Airtable call** | none (user error) |
| No Airtable creds (`!hasAirtableCreds()`) | recoverable | typed "content backend not configured" result; **no network call**; edit retained; admin shell shows read-only banner (§12) | `warn` once |
| 422 Airtable (bad field/type) | recoverable | generic "couldn't save"; form keeps values | `error`: table + Airtable msg |
| 429 | recoverable | retry once; else "busy, try again" | `warn` |
| 5xx / network | recoverable | "save failed, retry"; **no revalidation**; edit not lost | `error` |
| success | — | typed record; action then `revalidateTag` | `info` optional |
| `revalidateTag` throws post-write | tolerated | success (write already persisted); ISR backstop catches up | `error` (FR-23.4) |

**Contact submit**: validation → field errors; honeypot → silent drop; rate limit → friendly 429;
Airtable failure → friendly error, values retained, server log (no PII/secrets in client message)
(FR-12.3, FR-12.4, NFR-11.6). Optional email notification (if `RESEND_API_KEY` +
`CONTACT_NOTIFY_TO` set) is best-effort: a send failure logs but never fails the submission
(FR-12.6).

**Image upload**: disallowed type / oversize / provider error → client shows the message; the
associated record is untouched (FR-22.4). Missing Blob token → upload disabled, paste-URL still
works.

All user-facing errors are non-technical; stack traces and identifiers stay in server logs
(NFR-11.6). A small `logger` util standardizes `info|warn|error` and guarantees no env secret is
interpolated into messages.

---

## 15. Invariants & ownership

| Invariant | Owner / enforcement | Why there |
|---|---|---|
| Airtable touched only in the DAL | `src/lib/airtable` + `import 'server-only'` + ESLint `no-restricted-imports` | Single caching/rate-limit/typing choke point (FR-24.1). |
| Secrets never reach the client | `server-only` in DAL/auth; no `NEXT_PUBLIC_` on secrets; logger scrubbing | NFR-11.1. |
| Every admin mutation is authorized | `requireAdminPage()` (protected layout/pages) + `requireAdmin()` via `withAdmin()` (actions) + `requireAdmin()` (upload route) + middleware | Defense in depth in every context (FR-18.4; rev-2 F3). |
| Public pages never show drafts/hidden | DAL read functions do the filtering (not components) | A component can't opt out of the rule (FR-10.3, FR-20.4). |
| Cross-cutting values have one source | `Settings` table + layout-level read; no literal numbers/links in code (grep-checked in review) | FR-13.3, FR-21.4. |
| Alt text accompanies every rendered image | Validation requires alt when URL set; components pass it to `next/image` | NFR-10.1. |
| Rich text is safe | `rehype-sanitize` in the Markdown renderer | NFR-11.4. |

---

## 16. Visual & interaction design

**Theme — dark, premium, modern.** Near-black layered surfaces with a deep-blue brand anchor
(ties to the logo blues and the "dive into data" metaphor) and a cyan "depth" accent. CSS custom
properties in `globals.css`, surfaced as Tailwind tokens in `tailwind.config.ts`:

| Token | Value (approx) | Use |
|---|---|---|
| `bg` | `#0B0F17` | Page base (deepest). |
| `surface` | `#111726` | Section/elevated bands. |
| `card` | `#141B2D` | Cards, inputs. |
| `border` | `rgba(148,163,184,0.14)` | Hairline borders. |
| `text` | `#E6EAF2` | Primary text (AA on `bg`). |
| `muted` | `#9AA7BD` | Secondary text (AA on `bg`). |
| `brand` (blue) | `#1E6FEB` scale 50–900 | Primary brand, links, primary CTA. |
| `depth` (cyan) | `#22D3EE` | Hero/CTA gradient partner (brand→depth). |

**Accent palette — amber / red / green / blue, each with a job** (so accents stay tasteful, not a
rainbow — NFR-7.1, NFR-8.1):
- **Blue/cyan** — primary brand: links, primary CTAs, hero + CTA gradient glow.
- **Amber** — emphasis: featured tags, metric highlights, hover accent on select cards.
- **Green** — positive: success toasts, form-success state, "accuracy/positive" stats.
- **Red** — alert: validation errors, destructive admin actions (delete). Reserved for signal, never decoration.
Services and Industries cards carry a per-card `Accent` (from Airtable), rotated deliberately so a
grid shows a balanced, intentional spread rather than random color.

**Typography** (`next/font/google`, CSS variables): **Inter** for body/UI (the safe shared base),
**Plus Jakarta Sans** for display/headings (clean, premium SaaS character), **JetBrains Mono** for
data accents — stat counters, metric chips, small "data" labels — which reinforces the data brand.
A fixed type scale lives in the Tailwind theme (display-1/2/3, h1–h4, body, small) so sizes are
consistent everywhere (NFR-8.2).

**Spacing & layout.** A shared `<Container>` (`max-w-7xl`, `px-6`) and `<Section>` (consistent
`py-24 md:py-32`, optional surface band, standard `SectionHeading`) enforce vertical rhythm and
alignment, directly countering "uneven gaps / bulky / messy" (NFR-8.1). Grids use consistent
`gap-6/8`; Services render 2×2/4-up, Industries 5-up→responsive, Work as a card grid that becomes
a scroll-snap carousel on mobile.

**Baseline motion (tasteful, performant).**
- `Reveal` (client): IntersectionObserver-triggered fade/slide-up on section entry; children are
  server-rendered and passed in, so data stays on the server.
- `CountUp` (client): animates 0→`Value` with `requestAnimationFrame` when the stats band enters
  view; appends prefix/suffix; shows the final value instantly under reduced motion (FR-7.3).
- `GlowBlob`: pure-CSS blurred radial gradients (brand→depth) behind hero/CTA; cheap, optional
  slow drift disabled under reduced motion.
- Card hover/focus: CSS transform-lift + accent border, keyboard-focus equivalent (FR-4.4).
- Global guard: `<MotionConfig reducedMotion="user">` wraps the app and `@media
  (prefers-reduced-motion: reduce)` neutralizes CSS motion (FR-16.2, NFR-10.3). Framer Motion is
  used for reveals/micro-interactions and the playful feature only; it never blocks content or
  traps focus (FR-16.3).

**The one playful signature feature — "DiveField" interactive hero (nice-to-have, FR-17).**
Behind the hero headline/CTA sits a lightweight `<canvas>` field of floating "data points"
(dots sized by value). As the pointer moves, nearby points rise toward the surface and connect
with thin lines — a sense of diving through a sea of data; a gentle scroll/click "descends" to
reveal a deeper layer. Concrete performance budget: ≤60 points, `requestAnimationFrame`,
devicePixelRatio-aware, **paused** when offscreen (IntersectionObserver) and when the tab is
hidden (`visibilitychange`); pointer parallax uses transforms only. It is decorative
(`aria-hidden`) — the headline and CTA are real, fully accessible DOM. On touch (no fine pointer)
or `prefers-reduced-motion`, it renders a **static constellation** image instead. Explicitly a
**nice-to-have**: if cut, the hero still has the gradient glow + content and no requirement fails
(FR-17.2). This is original to Datadive — not the terminal/code-window motif of the reference
sites.

---

## 17. SEO & metadata

Root `layout.tsx` sets `metadataBase` from `NEXT_PUBLIC_SITE_URL` (fallback `VERCEL_URL`, then
localhost) and brand defaults. Each public route exports `generateMetadata`: home and `/blog`
include Open Graph/Twitter tags and a default share image (from `Settings.OgImageUrl` or a
generated brand OG from the 400² mark). Blog posts emit per-post title/description (SeoTitle/
SeoDescription overrides), OG/Twitter with the cover image, and a canonical URL (FR-11.4, NFR-13).

**Single `og:image` source of truth (resolves N4).** `generateMetadata`'s `openGraph.images` is
the **one** mechanism that sets `og:image` for home and `/blog`: it resolves `Settings.OgImageUrl`
first and falls back to the generated brand OG. The file-convention `app/opengraph-image.tsx` is
**not** a competing source — it exists only to *produce* the generated brand-OG bytes used as that
fallback URL (and for routes with no settings-driven override); the design does **not** rely on
its automatic per-route `og:image` injection for home/`/blog`, so the admin-set `Settings.OgImageUrl`
always wins and no duplicate/competing `og:image` tags are emitted. (If keeping both the file
convention and `generateMetadata` on the same route ever risks a duplicate tag in implementation,
drop `opengraph-image.tsx` from those routes and keep only the `generateMetadata` path.)
`sitemap.ts` enumerates `/`, `/blog`, each published post, and each **`hasDetail`** project
(from `getProjectDetailSlugs()`, §6) — a bodyless project has no detail URL and is omitted
(resolves F6); `robots.ts` allows all and points to the sitemap.

---

## 18. Accessibility (WCAG 2.1 AA target)

Semantic landmarks (`header`/`nav`/`main`/`footer`), a skip-to-content link, visible
`focus-visible` rings on every interactive element, and AA contrast for the tokens above. The
mobile menu is keyboard-operable, `aria-expanded`-driven, focus-trapped while open, and closes on
Esc (FR-1.3). Carousels use native scroll-snap (keyboard/scroll friendly) rather than a custom
widget. Forms use real `<label>`s and `aria-describedby` for inline errors. All meaningful images
carry admin-provided alt text; decorative visuals (glow, DiveField) are `aria-hidden`. All motion
honors `prefers-reduced-motion`. Per NFR-10.4 this sets the implementation target; a certified
conformance claim would require manual assistive-technology testing and expert review (Out of
Scope item 9).

---

## 19. Security

Secrets are server-only and never prefixed `NEXT_PUBLIC_` (NFR-11.1). Every mutating surface
(admin actions, image-upload token, optional revalidate route) enforces authorization server-side
(NFR-11.2); the contact endpoint is intentionally public but honeypot- and rate-limited
(NFR-11.5, NFR-11.7). All external input is Zod-validated server-side (NFR-11.3). Stored Markdown
is sanitized with `rehype-sanitize` (NFR-11.4). SVG uploads are rejected. Client-visible errors
never leak stack traces, identifiers, or PII (NFR-11.6). The contact rate limiter is in-memory
(per-instance) by design for v1; its limitation is documented and the honeypot is the primary
spam control. `next.config.ts` restricts `images.remotePatterns` to the Blob host so arbitrary
remote image optimization is not exposed; image URL fields are correspondingly host-validated
(§13), so a stored image URL can never point off the allowlist and break at render time (F1).
OG image URLs are exempt from the host restriction because they are emitted into meta tags for
social crawlers, not optimized through `next/image`.

---

## 20. Environment variables & no-credential behavior

`.env.example` documents every variable with safe placeholders (NFR-3.2); no real secret is
committed (NFR-3.3). **All variables are optional for build and public rendering** — missing
values degrade a specific privileged feature only (NFR-4).

| Variable | Required for | If absent |
|---|---|---|
| `AIRTABLE_API_KEY` | live content | seed data served |
| `AIRTABLE_BASE_ID` | live content | seed data served |
| `AIRTABLE_TABLE_*` (optional overrides) | renamed tables | default contract names used |
| `AUTH_SECRET` | admin sessions | admin login disabled; public unaffected |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google sign-in | admin login disabled |
| `ADMIN_EMAILS` | admin authorization | no email can be admin (login effectively closed) |
| `BLOB_READ_WRITE_TOKEN` | image upload | upload disabled; paste-URL + seed images work |
| `NEXT_PUBLIC_SITE_URL` | absolute metadata/OG/sitemap | falls back to `VERCEL_URL`/localhost |
| `REVALIDATE_SECRET` | optional external revalidate route | route disabled (in-process revalidation still works) |
| `RESEND_API_KEY` + `CONTACT_NOTIFY_TO` | contact email notify | submissions still saved; no email sent |

With **zero** env vars, `npm run build`, lint, and `npm start` succeed and every public page
renders from seed data (NFR-2, NFR-4) — this is the primary verification gate for the build step.

---

## 21. Git isolation plan (critical)

**Confirmed hazard.** A real git repository exists at `C:\Users\Syed Mehdi Abbas\.git` (branch
`master`). There is **no** `.git` in `datadive`, `Downloads`, or `datadive-web`. Because git binds
to the nearest ancestor `.git`, any `git` command run from inside `datadive-web` **before** a local
repo exists would attach to the home repo and could stage the user's entire home directory —
exactly the accident NFR-5 warns against.

**Plan:**
1. Run `git init` **inside** `datadive-web/` so `datadive-web/.git` exists and all git operations
   from that cwd bind locally.
2. **Before any `git add`/`commit`**, verify isolation:
   `git -C "<...>/datadive-web" rev-parse --show-toplevel` **must** resolve to the `datadive-web`
   path. If it resolves to the home directory, **stop** — the local repo was not created; do not
   proceed. All git commands pass `cwd = datadive-web` (never the parent or home).
3. Never run `git init`, `add`, `commit`, `config`, or `push` from `datadive`, `Downloads`, or the
   home directory. The home repo is left entirely untouched (NFR-5.2).
4. `.gitignore` at `datadive-web/.gitignore` excludes: `node_modules/`, `.next/`, `out/`,
   `.vercel/`, `.env*` (except `!.env.example`), `*.log`, coverage/test output, and OS cruft
   (`desktop.ini`, `Thumbs.db`, `.DS_Store`).

Side benefit: because the repo root is `datadive-web/`, the heavy source media in the parent
(25MB+ PDFs, `.pptx`, `.mp4`, `.har`, the session `.zip`, `.ai`) are naturally outside the repo
and can never be committed. `.agents/` lives inside `datadive-web` and may be committed as build
documentation or ignored — operator's choice; default is to keep it tracked.

> Push/branch/PR actions are out of this design's scope and are only performed on explicit
> instruction, always from `cwd = datadive-web`, never force, never touching the home repo.

---

## 22. Testing strategy

**Unit (Vitest), no network, no credentials:**
- `mappers.ts` with fixtures including missing/optional/malformed fields → safe defaults, never throws (FR-24.3).
- Seed data parsed against the entity Zod schemas — every content type present and type-valid (FR-25.4).
- Validation schemas: contact (bad email, over/under length, honeypot), slug normalization + uniqueness suffixing, WhatsApp digit-stripping, URL/email rules, stat formatting (FR-12.3, FR-13.2, §13).
- Utilities: `wa.me` builder, slugify, stat prefix/suffix formatting.
- `requireAdmin` allowlist logic: email in/out of `ADMIN_EMAILS`, case-insensitive, empty allowlist.

**Integration (Vitest + mocked `fetch`/auth):**
- DAL reads: pagination, 429 → backoff → seed fallback, 5xx → cached/seed fallback, missing-creds → seed (no fetch). Airtable is **never** hit live (mocked).
- Server actions: unauthorized rejected before any DAL call; valid create → DAL write + `revalidateTag`; invalid → field errors, no write.
- Contact action: honeypot drop, rate-limit trip, Airtable failure path retains values.

**E2E (Playwright, optional / nice-to-have):** home renders fully with **no** env, mobile menu
open/trap/Esc, blog listing + post, 404, and `/admin` redirect when unauthenticated.

**Build gate:** `npm run build` and lint must pass with zero env configured (NFR-2, NFR-4) — the
non-negotiable check after implementation.

What is testable where: pure logic (mappers, validation, seed, utils, allowlist) → unit;
anything crossing the Airtable/auth boundary → integration with mocks; full user journeys → E2E.
A design note: because all Airtable access is funneled through one `fetch`-based client, mocking a
single boundary covers the whole data layer — a sign the layering is testable.

---

## 23. Future extensibility seam (noted, not built)

This is a **documentation note only — no files, route groups, or interfaces are created in this
build** (NFR-14.2: "noted, not built"; resolves F11). When free analysis tools / Auto-ETL
(upload-data-get-report) are added later, the natural placement is a `src/app/(tools)/` route group
for the UI plus a `src/lib/tools/` typed service interface that mirrors the DAL boundary pattern,
with heavy compute running as **separate** functions — Node route handlers for light transforms,
or **Vercel Python Functions** (`api/*.py`) for Python-based analysis — reusing the Vercel Blob
upload flow for datasets. Because nothing is scaffolded now (no empty route group that could
confuse routing, no unused export that could trip lint), the seam adds zero user-facing surface and
cannot affect the current build or deploy; it is purely a planned placement so a later addition
needs no restructuring (NFR-14, Out of Scope 1).

---

## 24. Source-asset handling

Only the small logo PNGs and extracted text are used; the large media
(25MB+ PDFs, `.pptx`, `.mp4`, `.har`, `.ai`, the session `.zip`) are **never opened, rendered, or
processed** at build time (Out of Scope 6–7) — this is also what caused the earlier failed
session, so the constraint is deliberate. The parent directory holds five small PNGs, but only
**three distinct assets** are needed (`Datadive (1).png` has the **same dimensions and byte size
as `Datadive.png` but is not byte-identical** — different content, verified by hash; it is unused.
`Datadive (2).png` is a 400² no-alpha RGB variant, also unused — rev-2 F4). During setup the
implementer copies those **three** PNGs from the parent
into `datadive-web/public/brand/` (`Datadive logo file-01.png` →
`datadive-logo-color.png`, `Datadive white logo-01.png` → `datadive-logo-white.png`,
`Datadive.png` → `datadive-mark.png`) and generates the favicon/icon set and the default OG image
from the 400² square mark (NFR-7.3). **The generated icons are placed under `app/` — `app/icon.png`,
`app/apple-icon.png`, `app/favicon.ico` — not `public/` (resolves N8).** Next.js App Router
auto-emits `<link rel="icon">` / `apple-touch-icon` tags only for icon files located in `app/`;
files in `public/` do not auto-wire those tags (only root `public/favicon.ico` works by browser
default). Using the `app/` convention wires all three automatically with no manual `metadata.icons`
entry needed. Placeholder images for seed
projects/avatars/logos/covers live in `public/seed/` and are **raster PNG, not SVG**, so they
optimize through `next/image` without the SVG-optimizer 400 (§8/§10, rev-2 F2).

---

## 25. Assumptions carried into design

The requirements' Assumptions 1–10 are adopted as-is. Design-level choices made where the
requirements deferred:
- **Image provider = Vercel Blob**, client-upload flow (§10) — resolves NFR-1.2.
- **Airtable access = direct REST `fetch`** (not the SDK) for native cache tags (§6).
- **Mutations = server actions** with in-process `revalidateTag`; the public revalidation
  endpoint is optional and secret-gated (§7, §12).
- **Table names are a centralized contract constant** with optional `AIRTABLE_TABLE_*` env
  overrides, rather than 14 mandatory env vars; only base id + API key are mandatory secrets (§5).
  This is a **deliberate, accepted reading of FR-24.4** ("table names from env"), recorded here
  rather than left as a reviewer assumption (rev-2 F7): table names are a schema contract, not a
  secret, so the **security** intent of FR-24.4.4 (server-side only, never in the client bundle) is
  fully met by the constants living server-side; and the optional overrides still let an operator
  point at renamed tables, satisfying the **operational** intent of "configurable via env." Making
  all 14 names mandatory would damage the headline zero-config / no-credential build (NFR-4) and
  burden the non-technical owner this site is for, with **no** security gain — and the no-credential
  path needs no table-name variable at all. **Decision (ACCEPTED, resolves N3): keep defaults +
  optional `AIRTABLE_TABLE_*` overrides; only `AIRTABLE_API_KEY` + `AIRTABLE_BASE_ID` are
  mandatory.** Table names default in code (centralized constants in `schema.ts`) and may be
  overridden per table via optional `AIRTABLE_TABLE_*` env vars. This is the accepted reading of
  FR-24.4, recorded here in design.md, and **it must also be carried in `README.md`**. `README.md`
  does not exist yet — the app has not been scaffolded (no `package.json`/`README.md` present) — so
  when the README is created in the build/scaffold step it must record this same accepted FR-24.4
  reading verbatim: *table names default in code with optional `AIRTABLE_TABLE_*` env overrides;
  only the Airtable base id + API key are mandatory.* This decision is surfaced to the requirement
  owner in the step hand-off; if the literal reading is nonetheless required, the single change is
  to drop the defaults and treat `AIRTABLE_TABLE_*` as mandatory whenever Airtable credentials are
  present.
- **Fonts** Inter + Plus Jakarta Sans + JetBrains Mono; **animation** Framer Motion + CSS;
  **playful feature** DiveField hero (§16).

---

## 26. Responses to design-review findings (revision 1)

Review verdict was **CHANGES_REQUESTED** (6 MEDIUM, 0 HIGH, 6 NIT). Every finding is **addressed**
in this revision; none was backlogged or ignored. Each response is traceable to the edited section.

| ID | Sev | Response | Where fixed |
|---|---|---|---|
| **F1** | MED | **Addressed** — chose review option (a): image URL fields are now Zod-validated to a same-origin root-relative path **or** the Blob host only; any other host is rejected, so a stored URL always optimizes through `next/image`. The paste affordance is relabeled "paste a Datadive Blob URL". §19 "Blob host only" claim retained and now consistent. OG URLs explicitly exempt (meta tag, not `next/image`). | §10, §12, §13 (image URL rule), §19 |
| **F2** | MED | **Addressed** — defined `hasAuthCreds()` (= `AUTH_SECRET` + Google id + secret) and require it to be checked **before any `auth()` call** in all three places: middleware (redirect, never call `auth`), `requireAdmin()`, and the `[...nextauth]` handler (404/501). Prevents the lazy `MissingSecret` 500; `/admin/login` shows "sign-in not configured". Zero-env build still passes. | §9 |
| **F3** | MED | **Addressed** — added a `Seed:` line to §5.9 (≥6 clearly-labeled placeholder clients, ≥2 per `SectorGroup` bucket, a mix of placeholder-logo and name-only to exercise the FR-8.2 text fallback) and added clients to the §8 placeholder enumeration. Clientele now renders populated with no creds. | §5.9, §8 |
| **F4** | MED | **Addressed** — published the full `Icon`→lucide tables for both Services (`dashboard→LayoutDashboard`, `bi→BarChart3`, `ai→BrainCircuit`, `custom→Wrench`, `etl→Workflow`, `report→FileBarChart`) and Industries (`hr→Users`, `health→HeartPulse`, `retail→ShoppingCart`, `ops→Building2`, `ml→BrainCircuit`); enumerated the Industries Single-select option set explicitly; specified a `Sparkles` default for missing/unrecognized keys. | §5.4, §5.7, §6 |
| **F5** | MED | **Addressed** — stated the creds-present empty-result rule: **singleton** reads fall back to the seed singleton (never blank, §3.6); **list** reads return the real empty set and never reinject seed. Added two "200 empty result" rows to the §14 reads table. | §6, §8, §14 |
| **F6** | MED | **Addressed** — defined one predicate `hasDetail = Published && Body non-empty` and applied it everywhere: renamed the DAL fn to `getProjectDetailSlugs()`, `/work/[slug]` `generateStaticParams`/`notFound()`, Work-card linking, and the sitemap all use it; a bodyless project is a non-linked card with no detail URL. | §5.5, §6, §7, §11, §17 |
| **F7** | NIT | **Addressed** — added a no-Airtable-creds write row to §14 (typed "content backend not configured" result, no network call, edit retained) and a read-only admin banner (§12) mirroring the Blob "upload unavailable" pattern. | §12, §14 |
| **F8** | NIT | **Addressed** — §4 `public/brand/` comment corrected from "5 small logo PNGs" to "the 3 brand PNGs copied from the parent dir (§24)". | §4 |
| **F9** | NIT | **Addressed** — added a dedicated **href** validation rule (`^(#anchor \| /relative \| https?://…)$`, ≤2048) covering `NavLinks.Href` and every `*CtaHref`, distinct from the http(s)-only URL rule. | §13 |
| **F10** | NIT | **Addressed** — stated that `ProjectImages` has no tag of its own; gallery create/update/delete revalidates the parent `project:{slug}` + `projects`, resolving the parent slug from the project edit context. | §7, §12 |
| **F11** | NIT | **Addressed** — §23 is now explicitly a documentation note only; **no** `(tools)` route group or `src/lib/tools` files are created in this build, so there is zero routing/lint surface. | §23 |
| **F12** | NIT | **Addressed** — the third team member is seeded with the known role "Full-Stack & DevOps Engineer" (from `source-notes.md`) and a placeholder **name**; Assumption 4 is clarified to concern the name only. | §5.11 |

No new technology choices were introduced; the stack in §2 is unchanged. The edits are
clarifications and rule statements only — no section's architecture was reversed.

---

## 27. Responses to design-review findings (revision 2 review)

The revision-2 review verdict was **CHANGES_REQUESTED** (1 HIGH, 1 MEDIUM, 7 LOW). **Every finding
(1–9) is addressed** in this revision; none is backlogged or ignored. No architecture or technology
choice changed — the §2 stack is intact and all edits are route-structure, rule, and wording fixes.

| ID | Sev | Response | Where fixed |
|---|---|---|---|
| **1** | HIGH | **Addressed** — moved the gate below an `app/admin/(protected)/` route group. `app/admin/login/page.tsx` is now **ungated** (a sibling outside the group); `(protected)/layout.tsx` holds `requireAdminPage()` + the dashboard shell and wraps only protected pages. A route group adds no URL segment, so `/admin`, `/admin/settings`, … are unchanged while the sign-in page is never re-gated → no `ERR_TOO_MANY_REDIRECTS`; the whole admin area (FR-18/19/20/21/22) is reachable in both creds and no-creds modes. | §3, §4, §9, §12 |
| **2** | MED | **Addressed** — chose the review's preferred option (a): seed placeholders are **committed raster PNG**, not SVG, so they pass the Image Optimizer (which 400s SVG unless `dangerouslyAllowSVG`, a failure invisible to `npm run build`). No `next.config.ts` change, and the SVG-upload rejection / SVG-XSS stance (§10/§19) is preserved. The §8 "no image is ever broken" claim is re-grounded on the raster choice. | §4, §8, §10, §24 |
| **3** | LOW | **Addressed** — split the guard into `requireAdminPage()` (returns session or `redirect('/admin/login')`; used by the protected layout/pages) and `requireAdmin()` (returns session or **throws `AuthError`**; used by `withAdmin()` actions → typed 401, and `/api/blob/upload` → `401 Response`). Both share one `auth()` + allowlist check, so there is no behavioral drift. | §3, §9, §10, §12, §15 |
| **4** | LOW | **Addressed** — reworded §24: `Datadive (1).png` has the "same dimensions and byte size as `Datadive.png` but is **not** byte-identical (different content)," and is unused; only the three distinct assets are copied. | §24 |
| **5** | LOW | **Addressed** — pinned `next-auth@**5.0.0-beta.25**` in the §2 stack table, relying on the committed `package-lock.json`; the §9 construction / lazy-`MissingSecret` behavior the no-creds safety depends on is tied to this pin and flagged for re-confirmation against it during implementation. | §2, §9 |
| **6** | LOW | **Addressed** — `createContactSubmission()` sets `Status: 'New'` **explicitly** on write (Airtable applies no API-side single-select default), and a §5-intro note states the "Req" column is a Zod/DAL contract (plus mapper safe-defaults on read), not an Airtable constraint. | §5 intro, §5.15, §6 |
| **7** | LOW | **Addressed as a documented decision** — kept defaults + optional `AIRTABLE_TABLE_*` overrides (only base id + API key mandatory), recorded as a deliberate, accepted reading of FR-24.4: table names are a non-secret schema contract, the server-side constants satisfy FR-24.4.4's security intent, the overrides satisfy "configurable via env," and 14 mandatory vars would harm the headline zero-config / no-credential build (NFR-4). The requirements/README are to record this reading; it is also surfaced to the requirement owner in the step hand-off. | §5 intro, §25 |
| **8** | LOW | **Addressed** — stated `getProject(slug)` returns `null` unless `Published === true`; `/work/[slug]` then layers the empty-`Body` `notFound()` branch, so under `dynamicParams` both drafts and bodyless published projects 404 (no draft leak). | §6, §11 |
| **9** | LOW | **Addressed** — specified one tolerant line parser for `About.Points` / `Projects.Metrics`: trim each line, drop blank lines, cap item count; a `Metrics` line without `|` maps to `{ value: '', label: line }` rather than being dropped silently or throwing — upholding the never-throws mapper guarantee. | §5.3, §5.5, §6 |

**Decision needing owner acknowledgement (non-blocking):** finding 7 is resolved by documenting an
accepted reading of FR-24.4 rather than by code change. If the requirement owner insists on the
literal "table names SHALL come from env," the only change is to drop the schema-constant defaults
and treat `AIRTABLE_TABLE_*` as mandatory when Airtable credentials are present.

---

## 28. Responses to design-review findings (latest review)

The latest review verdict was **CHANGES_REQUESTED** (0 HIGH, 2 MEDIUM, 8 NIT). **Every finding is
addressed** in this revision; none is backlogged. No technology or architecture choice changed —
the §2 stack is intact and all edits are rule, wording, and placement fixes.

| ID | Sev | Response | Where fixed |
|---|---|---|---|
| **M1** | MED | **Addressed** — `getReviews()` now special-cases the creds-present empty-table case: an empty live Reviews table falls back to the **seed review placeholders** (FR-9.2), the one deliberate exception to the "list → real empty set" rule; blog stays on the empty-state rule (FR-10.5). §8, §5.10, §6, and the §14 reads table are reconciled with FR-9.2. | §8, §5.10, §6, §14 |
| **M2** | MED | **Addressed** — DAL read caching is split by audience: public reads use `next:{revalidate:3600,tags:[...]}` (explicit 1-hour fetch-level revalidate stated); admin reads (`getAll*`, every `getXById`, `getSubmissions`) use `cache:'no-store'` with **no tags** so `/admin/*` is always live even under `force-dynamic`. §6 and §7 wording reconciled. | §6, §7 |
| **N1** | NIT | **Addressed** — `app/admin/login/page.tsx` sets `export const dynamic = 'force-dynamic'` so `hasAuthCreds()` cred-detection is request-time, not build-frozen. | §4, §7, §9 |
| **N2** | NIT | **Addressed** — `withAdmin()` catches **only** `AuthError` and re-throws any `NEXT_REDIRECT` / `NEXT_NOT_FOUND` (and other non-`AuthError`) throws, so success `redirect()`/`notFound()` control-flow propagates. | §9 |
| **N3** | NIT | **Addressed (ACCEPTED decision)** — recorded the accepted FR-24.4 reading (table names default in code with optional `AIRTABLE_TABLE_*` overrides; only base id + API key mandatory) in design.md; noted that `README.md` (not yet scaffolded) must carry it verbatim when created. | §5 intro, §25 |
| **N4** | NIT | **Addressed** — single `og:image` source of truth via `generateMetadata` (`Settings.OgImageUrl` → generated brand OG fallback); `opengraph-image.tsx` scoped to producing the fallback bytes, not a competing per-route source. | §4, §17 |
| **N5** | NIT | **Addressed** — documented the per-instance limitation of the `client.ts` token bucket (aggregate cross-instance rate can exceed ~5 req/s/base) and its mitigations (cache-served reads + 429 backoff/retry), mirroring the contact-limiter note. | §6, §7 |
| **N6** | NIT | **Addressed** — stated that the config imported by `middleware.ts` must stay Edge-compatible (JWT only, no adapter/Node-only imports) and that the matcher stays scoped to `/admin/:path*` so public routes never invoke `auth()`. | §4, §9 |
| **N7** | NIT | **Addressed** — enumerated the admin by-id reads (`getServiceById`/`getIndustryById`/`getStatById`/`getClientById`/`getReviewById`/`getTeamMemberById`/`getNavLinkById`, plus the existing project/blog ones) and the `ProjectImages` writers (`createProjectImage`/`updateProjectImage`/`deleteProjectImage`), noting the `Project` link array on create and the parent-slug source for `revalidateTag('project:{slug}')`. | §6 |
| **N8** | NIT | **Addressed** — favicon/icon/apple-icon moved to the App Router `app/` convention (`app/icon.png`, `app/apple-icon.png`, `app/favicon.ico`) so `<link>` tags auto-emit; removed from `public/`. | §4, §24 |

---

## Design doc path

`c:\Users\Syed Mehdi Abbas\Downloads\datadive\datadive-web\.agents\tasks\datadive-build\design.md`
