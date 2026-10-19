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
disables the one feature it powers (see `.env.example` for the per-variable
behavior and `design.md` §20).

## Airtable configuration

Only two secrets are mandatory to serve live content: `AIRTABLE_API_KEY` and
`AIRTABLE_BASE_ID`. Table names are **not** required as environment variables.

> **Accepted reading of FR-24.4:** table names default in code with optional
> `AIRTABLE_TABLE_*` env overrides; only the Airtable base id + API key are
> mandatory.

Table names are centralized constants in `src/lib/airtable/schema.ts` (the schema
contract) and may each be overridden with an optional `AIRTABLE_TABLE_<KEY>` env
var if you rename a table in Airtable. The base schema contract (tables, fields,
and select options) is defined in `design.md` §5.

## Project layout

Application code lives under `src/` (App Router in `src/app`, the Airtable DAL in
`src/lib/airtable`, auth in `src/lib/auth`, seed data in `src/lib/seed`). Brand
assets are in `public/brand/`; raster seed placeholders in `public/seed/`; the
App Router icon set (`icon.png`, `apple-icon.png`, `favicon.ico`) under `src/app/`.
See `design.md` §4 for the full folder map.
