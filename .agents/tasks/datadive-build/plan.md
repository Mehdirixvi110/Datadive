# Datadive — Implementation Plan

> Source of truth: `design.md` (locked) + `requirements.md`. Seed copy from `source-notes.md`;
> visual/motion cues from `inspiration-notes.md`. This plan sequences the build; it does **not**
> re-decide architecture. Every decision below is already made in `design.md` — where this plan
> states a choice it is quoting that decision with a one-line rationale.
>
> **Where the app is built:** everything lives in
> `c:\Users\Syed Mehdi Abbas\Downloads\datadive\datadive-web`. The implementing agent's cwd is the
> workspace root `c:\Users\Syed Mehdi Abbas\Downloads\datadive` (NOT a worktree), so **every path
> must target `datadive-web\...` explicitly**. A relative path lands in the parent workspace by
> mistake.
>
> **Git hazard (confirmed, §21):** a real repo exists at `C:\Users\Syed Mehdi Abbas\.git`. There is
> **no** `.git` in `datadive`, `Downloads`, or `datadive-web`. Git binds to the nearest ancestor
> `.git`, so any `git` command run before a local repo exists would attach to the **home** repo and
> could stage the entire home directory. The local repo MUST be created inside `datadive-web` and
> verified with `rev-parse --show-toplevel` **before any `git add`/`commit`** (item 4). All `git`
> commands pass `-C "...\datadive-web"` and are never run from the parent or home dir.
>
> **Primary build gate (every phase):** `npm run build` + `npm run lint` succeed with **ZERO env
> vars** configured, and the public site renders fully from seed data (NFR-2, NFR-4, §20). This is
> non-negotiable after each phase.
>
> Verification uses the project's real commands — `npm run build`, `npm run lint`,
> `npx vitest run`. Grep is never a substitute for these.

---

## Phase A — Scaffold, configuration, git isolation, brand & seed assets

- [ ] 1. Scaffold a Next.js 15 App Router + TypeScript + Tailwind project **inside** `datadive-web`.
      Because `datadive-web\.agents\` already exists, `create-next-app` will refuse the non-empty
      dir: scaffold into a temp dir (`datadive-web\.scaffold-tmp`) with App Router + TS + Tailwind
      + ESLint + `src/` dir + import alias `@/*`, then move the generated files up into
      `datadive-web\` (preserving `.agents\`) and delete the temp dir. Pin the stack from design §2:
      `next@15`, `react@19`, `react-dom@19`, `typescript@5`, `tailwindcss@3.4.x`, `postcss`,
      `autoprefixer`. Set `tsconfig.json` `"strict": true`. Package manager is **npm**; commit the
      lockfile later.
      Files: `datadive-web\package.json`, `datadive-web\tsconfig.json`,
      `datadive-web\next.config.ts`, `datadive-web\postcss.config.mjs`, `datadive-web\.nvmrc`
      (Node 20), `datadive-web\src\app\layout.tsx`, `datadive-web\src\app\page.tsx`,
      `datadive-web\src\app\globals.css`.
      Verify: `npm install` then `npm run build` in `datadive-web` succeeds with zero env vars.

- [ ] 2. Install the full locked dependency set from design §2 and pin versions in `package.json`.
      Runtime: `next-auth@5.0.0-beta.25` (exact pin — the lazy-`MissingSecret` zero-env behavior in
      §9 is tied to this version), `@vercel/blob`, `react-hook-form`, `zod`,
      `@hookform/resolvers`, `react-markdown`, `remark-gfm`, `rehype-sanitize`, `framer-motion`,
      `lucide-react`. Dev: `vitest`, `@vitejs/plugin-react`, `eslint-config-prettier`, `prettier`,
      `sharp` (one-time asset generation). Add scripts: `dev`, `build`, `start`, `lint`,
      `test` → `vitest run`, `test:watch` → `vitest`.
      Files: `datadive-web\package.json`, `datadive-web\package-lock.json`.
      Verify: `npm install` resolves and `npm run build` still passes with zero env.

- [ ] 3. Author the config files that enforce the design's invariants.
      `next.config.ts`: `images.remotePatterns` allowing host `*.public.blob.vercel-storage.com`
      only (§10/§19); do **not** enable `dangerouslyAllowSVG`. ESLint: extend
      `next/core-web-vitals` + add a `no-restricted-imports` rule forbidding imports of
      `src/lib/airtable/client` (and the Airtable REST layer) outside `src/lib/airtable/**` (§3/§15),
      plus `eslint-config-prettier`. `tailwind.config.ts`: dark theme tokens, accent palette, type
      scale, and font CSS variables from §16. `vitest.config.ts`: node/jsdom env, no network.
      Files: `datadive-web\next.config.ts`, `datadive-web\.eslintrc.json` (or `eslint.config.mjs`),
      `datadive-web\.prettierrc`, `datadive-web\tailwind.config.ts`, `datadive-web\vitest.config.ts`.
      Verify: `npm run lint` and `npm run build` pass with zero env.

- [ ] 4. **Initialize the isolated git repo and verify isolation (do this before any commit).**
      Run `git init` with cwd = `datadive-web`. Then run
      `git -C "c:\Users\Syed Mehdi Abbas\Downloads\datadive\datadive-web" rev-parse --show-toplevel`
      and confirm it resolves to the `datadive-web` path. **If it resolves to the home directory,
      STOP — the local repo was not created; do not run any `git add`/`commit`.** Write
      `.gitignore` excluding `node_modules/`, `.next/`, `out/`, `.vercel/`, `.env*` (with
      `!.env.example`), `*.log`, coverage output, and OS cruft (`desktop.ini`, `Thumbs.db`,
      `.DS_Store`). `.agents/` stays tracked (build docs, §21). Stage specific app files (never
      `git add .` from a parent) and make the initial commit.
      Files: `datadive-web\.gitignore`, `datadive-web\.git\` (new repo).
      Verify: `rev-parse --show-toplevel` equals the `datadive-web` path; `git -C ...\datadive-web
      status` shows the repo and does not list the home directory's files.

- [ ] 5. Copy the three brand PNGs and generate the icon + raster placeholder assets (§8/§24).
      Copy from the parent dir into `datadive-web\public\brand\`: `Datadive logo file-01.png` →
      `datadive-logo-color.png`, `Datadive white logo-01.png` → `datadive-logo-white.png`,
      `Datadive.png` → `datadive-mark.png` (the two 400² variants are unused — §24/F4). With a
      `sharp` script, generate from the 400² mark the App Router icon set **under `app/`**:
      `src\app\icon.png`, `src\app\apple-icon.png`, `src\app\favicon.ico` (so `<link>` tags
      auto-emit — N8), and generate small **raster PNG** placeholders (project/avatar/logo/cover) in
      `datadive-web\public\seed\`. **Never SVG** — the Image Optimizer 400s on SVG without
      `dangerouslyAllowSVG` and the failure is invisible to `npm run build` (§8/F2).
      Files: `datadive-web\public\brand\*.png`, `datadive-web\src\app\icon.png`,
      `datadive-web\src\app\apple-icon.png`, `datadive-web\src\app\favicon.ico`,
      `datadive-web\public\seed\*.png`, `datadive-web\scripts\gen-assets.mjs`.
      Verify: `npm run build` passes; the generated files exist with non-zero size.

- [ ] 6. Set up theme tokens, fonts, and the global layout shell.
      In `globals.css` add Tailwind layers and the CSS custom properties for the §16 token set
      (`bg`, `surface`, `card`, `border`, `text`, `muted`, `brand`, `depth` + accent roles). Wire
      `next/font/google` for **Inter** (body), **Plus Jakarta Sans** (display), **JetBrains Mono**
      (data) as CSS variables consumed by `tailwind.config.ts`. Root `layout.tsx` sets `<html>` dark
      theme, `metadataBase` (from `NEXT_PUBLIC_SITE_URL` → `VERCEL_URL` → localhost), fonts, and a
      skip-to-content link (§18). Keep a minimal placeholder home `page.tsx` until Phase D.
      Files: `datadive-web\src\app\globals.css`, `datadive-web\src\app\layout.tsx`,
      `datadive-web\tailwind.config.ts`.
      Verify: `npm run build` + `npm run lint` pass with zero env.

- [ ] 7. Write `.env.example` documenting **every** variable from §20 with safe placeholders and
      one-line descriptions: `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, optional `AIRTABLE_TABLE_*`,
      `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ADMIN_EMAILS`,
      `BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_SITE_URL`, `REVALIDATE_SECRET`, `RESEND_API_KEY`,
      `CONTACT_NOTIFY_TO`. No real secret values. State that all are optional for build/public
      render.
      Files: `datadive-web\.env.example`.
      Verify: file lists all §20 vars; `.gitignore` keeps `.env*` ignored except `.env.example`.

---

## Phase B — Typed core: domain types, validation, seed data, utilities, and the Airtable DAL

- [ ] 8. Define the domain model TypeScript types for every content type (camelCase), with image
      fields typed as `{ url: string; alt: string } | null` and line-parsed fields as arrays.
      Cover Settings, Hero, About, Cta, NavLink, Service, Project (+ ProjectImage gallery), Industry,
      Stat, Client, Review, TeamMember, BlogPost, ContactSubmission (§5/§6).
      Files: `datadive-web\src\lib\types\index.ts`.
      Verify: `npm run build` passes (types compile).

- [ ] 9. Write the shared Zod validation schemas (used client + server) exactly per §13.
      Contact schema (name 2–100, email ≤254, optional company/subject/phone, message 10–5000,
      honeypot `website` must be empty, length limits); per-entity admin schemas; settings schema
      (WhatsApp digits-only 7–15, email, URL rules); the **image-URL rule** (same-origin
      `^/[\w\-./]+$` OR `https://*.public.blob.vercel-storage.com`, ≤2048), the **href rule**
      (`^(#anchor|/relative|https?://…)$`), alt required when paired URL set, Order ≥ 0, Rating
      1–5, slug pattern.
      Files: `datadive-web\src\lib\validation\*.ts`.
      Verify: `npx vitest run` — validation unit tests pass (added in item 14).

- [ ] 10. Write the utilities: `wa.me` builder (digits-only, optional prefill), `slugify` +
      uniqueness suffixing, stat prefix/suffix formatting, env helpers `hasAirtableCreds()`
      (`AIRTABLE_API_KEY` && `AIRTABLE_BASE_ID`) and `hasAuthCreds()` (`AUTH_SECRET` &&
      `AUTH_GOOGLE_ID` && `AUTH_GOOGLE_SECRET`), and a `logger` util that never interpolates secrets
      (§9/§14/§15).
      Files: `datadive-web\src\lib\utils\*.ts`.
      Verify: `npx vitest run` — util unit tests pass (item 14).

- [ ] 11. Write the seed data module — one typed constant per content type, same domain types the
      DAL returns, derived from `source-notes.md` where real copy exists (brand, tagline, mission,
      4 services with icon keys, 5 industries, 9 case studies, 5 stats, team incl. 3rd member role
      "Full-Stack & DevOps Engineer" + placeholder name, contact email/LinkedIn/website) and
      **clearly-labeled placeholders** where silent (reviews, ≥2 blog posts, WhatsApp number, ≥6
      clients across the 3 SectorGroups incl. some name-only). Image fields point to committed
      `public/seed/*.png` / `public/brand/*.png` raster paths. Pure module — no network, no secrets.
      Files: `datadive-web\src\lib\seed\index.ts`.
      Verify: `npx vitest run` — seed-vs-Zod tests pass (item 14).

- [ ] 12. Build the Airtable client — the single network touchpoint (§6). Start the file with
      `import 'server-only'`. Implement raw REST `fetch` to
      `https://api.airtable.com/v0/{baseId}/{table}` with PAT bearer; a **token-bucket rate limiter**
      (capacity 5, refill ~4/sec, concurrency cap 4) wrapping every call; `offset` **pagination**;
      **retry/backoff** on 429/5xx (3× exponential, base 500ms); and the **audience-split caching**:
      public reads pass `next: { revalidate: 3600, tags }`, admin reads pass `cache: 'no-store'`
      with no tags, writes `cache: 'no-store'`. Add `schema.ts` (table-name constants + optional
      `AIRTABLE_TABLE_*` overrides + field maps) and `tags.ts` (one tag per table + `blogpost:{slug}`
      / `project:{slug}`).
      Files: `datadive-web\src\lib\airtable\client.ts`, `datadive-web\src\lib\airtable\schema.ts`,
      `datadive-web\src\lib\airtable\tags.ts`.
      Verify: `npm run build` passes; `npm run lint` confirms no import of `client.ts` outside
      `src/lib/airtable/**`.

- [ ] 13. Write the mappers and the typed read/write functions (§6). `mappers.ts`: Airtable record
      → domain model with safe defaults for every optional field (never throws — FR-24.3), image
      fields → `{url,alt}|null`, and ONE tolerant line parser for `About.Points` / `Projects.Metrics`
      (trim, drop blank lines, cap ~24; a `Metrics` line without `|` → `{value:'',label:line}`).
      `read.ts`: all public reads (publish/visible filtering + ordering inside the DAL; seed fallback
      when `!hasAirtableCreds()`; singleton empty→seed singleton; list empty→real empty set) with the
      **`getReviews()` seed special-case** (empty live Reviews table → seed placeholders, FR-9.2),
      `getProject(slug)` returning `null` unless `Published`, and `getProjectDetailSlugs()`
      (hasDetail = Published && Body non-empty); admin `getAll*` + enumerated `getXById`
      (`getServiceById`/`getIndustryById`/`getStatById`/`getClientById`/`getReviewById`/
      `getTeamMemberById`/`getNavLinkById`/`getProjectById`/`getBlogPostById`) + `getSubmissions`.
      `write.ts`: `create*/update*/delete*` per list, singleton upserts, `updateSettings`,
      `createContactSubmission` (sets `Status:'New'` explicitly — F6), `updateSubmissionStatus`, and
      the three `ProjectImages` writers (`createProjectImage` sets the `Project` link as an id array;
      all three resolve parent slug for revalidation).
      Files: `datadive-web\src\lib\airtable\mappers.ts`, `datadive-web\src\lib\airtable\read.ts`,
      `datadive-web\src\lib\airtable\write.ts`.
      Verify: `npm run build` passes; `npx vitest run` DAL integration tests pass (item 14).

- [ ] 14. Add the unit + integration tests for Phase B (§22), all network-free.
      Unit: mappers (missing/optional/malformed → safe defaults, never throws); seed parsed against
      the entity Zod schemas; validation (bad email, length, honeypot, slug normalization +
      uniqueness, WhatsApp digit-stripping, URL/href/image-URL rules); utils (wa.me, slugify, stat
      format). Integration (mocked `fetch`): DAL pagination, 429→backoff→seed, 5xx→cached/seed,
      missing-creds→seed (no fetch), `getReviews()` empty→seed. Airtable is never hit live.
      Files: `datadive-web\src\lib\**\__tests__\*.test.ts` (or `tests/`), using mocked `fetch`.
      Verify: `npx vitest run` — all Phase B tests pass; `npm run build` still green with zero env.

---

## Phase C — Auth & access control

- [ ] 15. Write the NextAuth v5 config and the two admin guards (§9), kept **Edge-compatible**
      (JWT sessions only, Google provider, no DB adapter, no Node-only imports — N6). `config.ts`:
      Google provider from `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`, JWT sessions, `pages.signIn =
      '/admin/login'`, and a `signIn` callback rejecting emails not in `ADMIN_EMAILS` (comma-split,
      trimmed, lowercased) → redirect `/admin/login?error=AccessDenied`. `require-admin.ts`:
      `requireAdminPage()` (returns session or `redirect('/admin/login')`), `requireAdmin()` (returns
      session or **throws `AuthError`**, never redirects), and `withAdmin()` whose `catch` is
      **narrow** — maps only `AuthError` to a typed 401-style result and **re-throws**
      `NEXT_REDIRECT`/`NEXT_NOT_FOUND` (N2). All three short-circuit via `hasAuthCreds()` **before any
      `auth()` call** (fail safe — F2). Re-confirm the lazy-`MissingSecret` behavior against
      `next-auth@5.0.0-beta.25`.
      Files: `datadive-web\src\lib\auth\config.ts`, `datadive-web\src\lib\auth\require-admin.ts`,
      `datadive-web\src\auth.ts` (re-exports `{ handlers, auth, signIn, signOut }`).
      Verify: `npm run build` passes with zero env (construction must not throw).

- [ ] 16. Wire the auth route handler and middleware. `app/api/auth/[...nextauth]/route.ts`
      re-exports `handlers` but short-circuits to 404/501 when `!hasAuthCreds()`. `middleware.ts`
      matches `/admin/:path*` **excluding `/admin/login`**; it checks `hasAuthCreds()` first (false →
      redirect to `/admin/login` without calling `auth`), then redirects unauthenticated requests to
      sign-in. Matcher stays scoped to `/admin/:path*` so public routes never invoke `auth()`.
      Files: `datadive-web\src\app\api\auth\[...nextauth]\route.ts`,
      `datadive-web\src\middleware.ts`.
      Verify: `npm run build` + `npm run lint` pass with zero env; middleware config imports only
      Edge-safe code.

- [ ] 17. Add auth unit tests: `requireAdmin` allowlist logic (email in/out, case-insensitive,
      empty allowlist), and `hasAuthCreds()` gating. No live auth.
      Files: `datadive-web\src\lib\auth\__tests__\require-admin.test.ts`.
      Verify: `npx vitest run` — auth tests pass.

---

## Phase D — Public site: shell, sections, blog, work, contact, WhatsApp, SEO, motion

- [ ] 18. Build the shared UI primitives and layout atoms used by every section (and later admin):
      `Button`, `Card`, `Badge`, `Input`, `Textarea`, `Select`, `Container` (`max-w-7xl px-6`),
      `Section` (`py-24 md:py-32` + optional surface band), `SectionHeading`, `Toast` (§16). Keyboard
      focus-visible rings and AA contrast baked in.
      Files: `datadive-web\src\components\ui\*.tsx`.
      Verify: `npm run build` + `npm run lint` pass.

- [ ] 19. Build the baseline motion components (§16), all honoring reduced motion: `Reveal`
      (IntersectionObserver fade/slide-up), `CountUp` (rAF 0→value, instant under reduced motion),
      `GlowBlob` (pure-CSS blurred radial gradient). Wrap the app in `<MotionConfig
      reducedMotion="user">`.
      Files: `datadive-web\src\components\motion\Reveal.tsx`,
      `datadive-web\src\components\motion\CountUp.tsx`,
      `datadive-web\src\components\motion\GlowBlob.tsx`.
      Verify: `npm run build` passes.

- [ ] 20. Build the nav/footer/WhatsApp chrome. `Navbar` (client; sticky; logo + data-driven
      `NavLinks` + CTA; mobile menu keyboard-operable, `aria-expanded`, focus-trapped, Esc-closes —
      FR-1.3). `Footer` (email/LinkedIn/website from `settings`). `WhatsAppButton` (client; builds
      `wa.me/<digits>?text=`; **hidden entirely** when no number — FR-13.4; focusable + aria-label).
      Update root `layout.tsx` to render Navbar + Footer + WhatsAppButton reading `getSettings()` +
      `getNavLinks()`.
      Files: `datadive-web\src\components\nav\Navbar.tsx`,
      `datadive-web\src\components\nav\Footer.tsx`,
      `datadive-web\src\components\nav\WhatsAppButton.tsx`, `datadive-web\src\app\layout.tsx`.
      Verify: `npm run build` + `npm run lint` pass; layout renders from seed with zero env.

- [ ] 21. Build the home-page sections as RSC reading DAL data, with interactive bits as nested
      client components (§11/§16). In order: `Hero`, `About`, `Services`, `Industries`, `Work`,
      `Stats`, `Clients`, `Reviews`, `Team`, `Cta`, `Contact`. Icon keys → lucide via the §5.4/§5.7
      mapping with a `Sparkles` default. Services 2×2/4-up; Industries 5-up→responsive; Work card
      grid (card links to `/work/[slug]` **only when `hasDetail`** — F6) → mobile scroll-snap;
      Stats uses `CountUp`; Clients grouped by SectorGroup with name text fallback (FR-8.2); images
      via `next/image` with alt. Compose them in `src/app/page.tsx` with `export const revalidate =
      3600` and all section tags.
      Files: `datadive-web\src\components\sections\*.tsx`, `datadive-web\src\app\page.tsx`.
      Verify: `npm run build` + `npm run lint` pass; `/` renders every section from seed with zero
      env (no crashes, no broken images).

- [ ] 22. Build the contact form + server action (§11/§13/§14). `ContactForm` (client,
      react-hook-form + the contact Zod schema, honeypot field, preserves values on error).
      `submitContact` server action: server-side Zod validate → honeypot silent-drop → per-IP
      in-memory rate limit (≤5/min, friendly 429) → `createContactSubmission` → success/error result;
      best-effort email notify only if `RESEND_API_KEY` + `CONTACT_NOTIFY_TO` set (never fails the
      submission). No secrets/PII in client-visible errors.
      Files: `datadive-web\src\components\sections\Contact.tsx`,
      `datadive-web\src\app\actions\contact.ts`.
      Verify: `npm run build` passes; `npx vitest run` contact-action tests (honeypot drop, rate-limit
      trip, Airtable-failure retains values) pass.

- [ ] 23. Build the blog + work routes and the sanitized Markdown renderer. `/blog` (published,
      reverse-chron, empty-state safe — FR-10). `/blog/[slug]` (`generateStaticParams` from
      `getPublishedPostSlugs()`, `dynamicParams=true`, per-post `generateMetadata` + OG/Twitter +
      canonical, `notFound()` on unknown/draft — FR-11). `/work/[slug]` (`generateStaticParams` from
      `getProjectDetailSlugs()`, `notFound()` when draft or empty `Body` — F6/F8). `Markdown`
      component uses `react-markdown` + `remark-gfm` + **`rehype-sanitize`** (NFR-11.4). `PostCard`
      for listing.
      Files: `datadive-web\src\app\blog\page.tsx`, `datadive-web\src\app\blog\[slug]\page.tsx`,
      `datadive-web\src\app\work\[slug]\page.tsx`, `datadive-web\src\components\blog\PostCard.tsx`,
      `datadive-web\src\components\blog\Markdown.tsx`.
      Verify: `npm run build` passes (static params generate from seed); `/blog`, a seed post, and a
      seed project detail render with zero env.

- [ ] 24. Add 404, SEO, and crawler files. Branded `not-found.tsx` with a home link (FR-1.6).
      `sitemap.ts` enumerating `/`, `/blog`, each published post, each `hasDetail` project.
      `robots.ts` allowing all + pointing to the sitemap. `opengraph-image.tsx` producing the
      generated brand-OG **fallback bytes only** — `generateMetadata.openGraph.images`
      (`Settings.OgImageUrl` → generated fallback) remains the single `og:image` source of truth (N4).
      Files: `datadive-web\src\app\not-found.tsx`, `datadive-web\src\app\sitemap.ts`,
      `datadive-web\src\app\robots.ts`, `datadive-web\src\app\opengraph-image.tsx`.
      Verify: `npm run build` + `npm run lint` pass; `/sitemap.xml`, `/robots.txt`, and 404 render.

- [ ] 25. Build the "DiveField" playful hero feature (§16, FR-17) — **nice-to-have, must not
      jeopardize core delivery.** A decorative (`aria-hidden`) `<canvas>` behind the real hero
      headline/CTA: ≤60 data points, `requestAnimationFrame`, DPR-aware, **paused** offscreen
      (IntersectionObserver) and when the tab is hidden (`visibilitychange`); pointer parallax via
      transforms only. On touch / `prefers-reduced-motion`, render a static constellation instead.
      If it risks build/perf/layout, ship the hero with the gradient glow only (no requirement fails).
      Files: `datadive-web\src\components\motion\DiveField.tsx`,
      `datadive-web\src\components\sections\Hero.tsx` (mount it).
      Verify: `npm run build` + `npm run lint` pass; hero still renders and is accessible with the
      feature on and (simulated) reduced-motion off/on.

---

## Phase E — Admin dashboard: shell, login, CRUD, image upload, revalidation

- [ ] 26. Build the ungated login page and the `(protected)` route group shell (§9/§12). 
      `app/admin/login/page.tsx` **outside** the group, `export const dynamic = 'force-dynamic'`,
      rendering Google sign-in / AccessDenied / "sign-in not configured" (branches on `hasAuthCreds()`
      + `?error`). `app/admin/(protected)/layout.tsx` calls `requireAdminPage()` then renders the
      dashboard shell (nav to every entity + signed-in identity + sign-out); `export const dynamic =
      'force-dynamic'` on admin. `app/admin/(protected)/page.tsx` dashboard home with per-entity
      counts. Degraded banner when `!hasAirtableCreds()` (§12).
      Files: `datadive-web\src\app\admin\login\page.tsx`,
      `datadive-web\src\app\admin\(protected)\layout.tsx`,
      `datadive-web\src\app\admin\(protected)\page.tsx`,
      `datadive-web\src\components\admin\SignOut.tsx`.
      Verify: `npm run build` + `npm run lint` pass with zero env; `/admin` redirects to
      `/admin/login` unauthenticated; `/admin/login` shows the "not configured" notice with zero env.

- [ ] 27. Build the shared admin components (§12): `EntityTable` (list with order, visibility/
      published flags, edit/delete), `EntityForm` (client, react-hook-form + the entity Zod schema),
      `ImageField` (upload via `@vercel/blob/client` `upload()` → `/api/blob/upload`, or paste a
      Datadive **Blob URL** host-validated per §13, with required alt input), `OrderControls`,
      `DeleteButton` (confirm dialog).
      Files: `datadive-web\src\components\admin\EntityTable.tsx`,
      `datadive-web\src\components\admin\EntityForm.tsx`,
      `datadive-web\src\components\admin\ImageField.tsx`,
      `datadive-web\src\components\admin\OrderControls.tsx`,
      `datadive-web\src\components\admin\DeleteButton.tsx`.
      Verify: `npm run build` + `npm run lint` pass.

- [ ] 28. Build the Vercel Blob upload route (§10). `app/api/blob/upload/route.ts` using
      `handleUpload`: `onBeforeGenerateToken` calls `requireAdmin()` (maps `AuthError` → `401
      Response`), restricts `allowedContentTypes` to jpeg/png/webp/avif, `maximumSizeInBytes` 8MB,
      `addRandomSuffix: true`, **SVG disallowed**; `onUploadCompleted` server-log only. When
      `BLOB_READ_WRITE_TOKEN` is absent, `ImageField` disables upload but still accepts a pasted,
      host-validated Blob URL.
      Files: `datadive-web\src\app\api\blob\upload\route.ts`.
      Verify: `npm run build` + `npm run lint` pass with zero env.

- [ ] 29. Implement the per-entity admin CRUD pages + server actions over the uniform pattern
      (§12/§20). Singletons `/admin/settings`, `/hero`, `/about`, `/cta` (upsert the one row). Lists
      `/admin/nav`, `/services`, `/projects` (inline ProjectImages **gallery editor**), `/industries`,
      `/stats`, `/clients`, `/reviews`, `/team`, `/blog` (published/draft toggle) each with
      `page.tsx` + `new/page.tsx` + `[id]/page.tsx`. `/admin/submissions` read + status triage (no
      create). Every mutating action is wrapped in `withAdmin()`, re-validates with Zod, writes via
      the DAL, calls `revalidateTag(...)` (settings also revalidates `nav`; blog/project also the
      per-item tag), and redirects back with a success toast. When `!hasAirtableCreds()`, saves return
      the typed "content backend not configured" result and make no network call.
      Files: `datadive-web\src\app\admin\(protected)\**\page.tsx`,
      `datadive-web\src\app\admin\(protected)\**\new\page.tsx`,
      `datadive-web\src\app\admin\(protected)\**\[id]\page.tsx`,
      `datadive-web\src\app\admin\actions\*.ts`.
      Verify: `npm run build` + `npm run lint` pass with zero env; admin pages render from seed in
      degraded (no-creds) mode.

- [ ] 30. Add the optional secret-gated external revalidate route (§7). `app/api/revalidate/route.ts`
      accepts `POST { tag }` behind a `REVALIDATE_SECRET` bearer header; returns 404/501 when the
      secret is unset. Not required for normal admin flow (in-process `revalidateTag` already covers
      it).
      Files: `datadive-web\src\app\api\revalidate\route.ts`.
      Verify: `npm run build` passes with zero env (route disabled when secret unset).

- [ ] 31. Add admin/action integration tests (§22, mocked auth + `fetch`): unauthorized action
      rejected before any DAL call; valid create → DAL write + `revalidateTag`; invalid input →
      field errors, no write; no-creds save → typed "not configured" result, no network.
      Files: `datadive-web\src\app\admin\actions\__tests__\*.test.ts`.
      Verify: `npx vitest run` — admin/action tests pass.

---

## Phase F — Integration, docs, final gate

- [ ] 32. Write `README.md`: setup, the full §5 Airtable schema contract (mirroring `schema.ts`
      exactly), every env var from §20, the deploy-to-Vercel steps (project root `datadive-web/`),
      and the **accepted FR-24.4 reading verbatim** — table names default in code with optional
      `AIRTABLE_TABLE_*` overrides; only the Airtable base id + API key are mandatory (§25/N3). Note
      the §23/NFR-14 Python/Auto-ETL seam as documentation only (not built).
      Files: `datadive-web\README.md`.
      Verify: README lists every env var and the schema matches `schema.ts`.

- [ ] 33. Final full-project gate with **zero env vars**: `npm install` from the committed lockfile,
      `npm run build`, `npm run lint`, `npx vitest run` all pass; `npm start` serves `/` fully from
      seed with no crashes or broken images (NFR-2, NFR-4, §22 build gate). Fix any seams between
      phases. Clean up temporary files (`.scaffold-tmp`, scratch).
      Files: (whole repo).
      Verify: all four commands pass with zero env; `/`, `/blog`, a seed post, a seed project, 404,
      and `/admin` redirect all behave per spec.

---

## Notes, assumptions, and gaps

- **Scaffolding into a non-empty dir:** `datadive-web\.agents\` pre-exists, so `create-next-app`
  must be run via a temp subdir + move (item 1). If the implementer prefers, an equivalent manual
  scaffold (hand-written `package.json` + config + `npm install`) is acceptable — the design does
  not mandate the tool, only the resulting stack.
- **Committing `.agents/`:** §21 leaves this to the operator; default is tracked. These plan/FEAT
  artifacts therefore may be committed as build docs. Always stage specific files (never `git add .`
  from a parent) to avoid sweeping anything outside `datadive-web`.
- **`next-auth@5.0.0-beta.25` pin:** the zero-env, no-throw-at-construction behavior (§9) is tied
  to this exact version; re-confirm during item 15 and keep the lockfile committed.
- **DiveField (item 25) is a nice-to-have** (FR-17.2): it must never block the build, lint, perf,
  or layout. Cut to the gradient-glow hero if it risks the core.
- **Python / Auto-ETL is out of scope** (NFR-14, Out-of-Scope 1): keep the data-access and routing
  modular and record the §23 seam note in the README; build nothing.
```
