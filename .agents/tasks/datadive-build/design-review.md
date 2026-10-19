# Datadive — Design Review (fresh, pre-implementation)

**Reviewed:** `design.md` (current revision, incl. §26 rev-1 and §27 rev-2 response logs)
**Against:** `requirements.md`
**Method:** Read the design cold, then verified its factual claims against the filesystem and
`source-notes.md` / `inspiration-notes.md`. The design must stand on its own; where it asserts an
external fact ("the home `.git` exists", "these three PNGs", "Airtable attachment URLs expire") I
checked rather than trusted.

## Verdict summary

| Severity | Count |
|---|---|
| HIGH | 0 |
| MEDIUM | 2 |
| NIT | 8 |

**Verdict: CHANGES_REQUESTED** (2 MEDIUM). The design is unusually complete and internally
cross-referenced; the schema, auth, image, and git-isolation stories are solid and were verified
against reality. The two MEDIUM findings are a direct contradiction with a numbered acceptance
criterion (FR-9.2) and an internal §6↔§7 caching conflict that would ship stale data to admins.
Both have cheap, concrete fixes.

---

## Findings

### M1 — Reviews empty-table behavior contradicts FR-9.2 (MEDIUM)

**Where:** §8 "Empty-result rule (credentials present)" list rule; §5.10; vs requirements FR-9.2.

**Problem.** §8 states that for **list** reads — and it names `reviews` explicitly — "if the table
returns zero rows, the DAL returns the **real empty list** and **never** reinjects seed." So with
Airtable credentials present and an empty Reviews table, the Reviews section renders an empty state.
But FR-9.2 says: "IF no reviews exist in the data source THEN the system SHALL render **seeded
placeholder reviews** that are clearly replaceable via admin." The requirements deliberately treat
reviews differently from blog: FR-10.5 wants blog to show an **empty-state** when there are no
published posts, while FR-9.2 wants reviews to **fall back to seed placeholders**. The design
collapses both into one generic "empty list → empty state" rule and so misses the reviews-specific
requirement. This is a silent override of a numbered acceptance criterion, not flagged anywhere in
§26/§27.

**Fix (pick one, and record it):**
- (a) Honor FR-9.2 literally: special-case `getReviews()` so that when credentials are present but
  the live Reviews table returns zero rows, it returns the seed reviews (the same clearly-labeled
  placeholders used in no-creds mode). Leave all other lists on the "real empty set" rule.
- (b) If the intended behavior really is empty-state-on-empty (arguably better UX — deleted reviews
  shouldn't resurrect), then amend FR-9.2 and note the change explicitly, mirroring FR-10.5's
  blog wording. Do not leave the design and FR-9.2 in silent conflict.

Recommended: (a), because it is the lower-risk way to pass the FR-9.2 acceptance check, and the
"admin emptied the table" case is an edge case for a brand-new site that is normally seeded.

---

### M2 — Admin reads are cached by the DAL, contradicting §7's "/admin = no cache / always live" (MEDIUM)

**Where:** §6 (`client.ts`: "Attach `next: { revalidate, tags }` to read requests") vs §7 route
table (`/admin/*` → `dynamic (no cache)` / `force-dynamic`, "always live").

**Problem.** §6 attaches `next: { revalidate, tags }` to **every** DAL read, with no carve-out for
the admin `getAll*` / `getXById` variants (those variants only bypass publish/visibility
*filtering*, not caching). In Next 15 an explicit per-fetch `next.revalidate` still writes to the
**Data Cache** even inside a `force-dynamic` route — `force-dynamic` changes the *default* fetch
behavior to `no-store`, but an explicit `next:{revalidate,tags}` opts back in and takes precedence.
Net effect: admin list/edit screens read Data-Cache-served data, not live Airtable, so §7's
"`/admin/*` … always live, always auth-checked" is false as written. In-app edits happen to stay
fresh because each write calls `revalidateTag(entity)`, but any **out-of-band** change (a direct
Airtable edit, which is a first-class workflow for an Airtable-backed CMS) is invisible to the admin
UI for up to the 1-hour backstop. The two sections are also simply inconsistent with each other.

Secondary ambiguity: the fetch-level `revalidate` value the DAL passes is never specified (§7 only
defines the page-segment `export const revalidate`). Public reads should state what fetch-level
revalidate they use so freshness is deterministic.

**Fix.** In the DAL, split read caching by audience:
- Public reads (`getServices`, `getProjects`, …): `next: { revalidate: <explicit N>, tags: [...] }`.
- Admin reads (`getAll*`, `getXById`, `getSubmissions`): `cache: 'no-store'` and **no** tags, so the
  admin always sees live backing-store state.
Then reconcile the wording so §6 and §7 agree ("admin reads are uncached; public reads are tagged").

---

### N1 — `/admin/login` render mode is unspecified but it branches on env + query (NIT)

**Where:** §4 (`app/admin/login/page.tsx`), §9 ("`/admin/login` detects the same condition and
renders a 'sign-in not configured' notice").

**Problem.** The login page is ungated (correctly, to avoid the redirect loop) and renders one of
three states driven by `hasAuthCreds()` (env) and `?error=AccessDenied` (query). If it is
statically pre-rendered, `hasAuthCreds()` is evaluated at **build time** and frozen — the "not
configured" vs "sign-in" state would reflect build-time env, not runtime env. In practice reading
`searchParams.error` (an async dynamic API in Next 15) likely forces dynamic rendering, so it may
"just work", but the design relies on that implicitly for a security-adjacent page.

**Fix.** Make it explicit: add `export const dynamic = 'force-dynamic'` to
`app/admin/login/page.tsx` (or document that it reads `searchParams`, which forces dynamic
rendering), so cred-detection is always request-time.

---

### N2 — `withAdmin()` must not swallow framework control-flow throws (NIT)

**Where:** §9 (`withAdmin()` "maps a thrown `AuthError` to a typed 401-style result"), §12 (actions
"redirect back to the list with a success toast").

**Problem.** The create/edit actions both return a typed result **and** call `redirect()` on
success. `redirect()` works by throwing a `NEXT_REDIRECT` error (and `notFound()` throws
`NEXT_NOT_FOUND`). If `withAdmin()` wraps the action body in a broad `try/catch` that converts "the
throw" into a 401/typed result, it will intercept the success redirect and break every admin
create/edit navigation.

**Fix.** In `withAdmin()`, catch **only** `AuthError` (or re-throw any error whose `digest` begins
with `NEXT_REDIRECT` / `NEXT_NOT_FOUND`) so framework control-flow propagates normally.

---

### N3 — FR-24.4 "table names from env" vs server-side constants (NIT — needs owner acknowledgement)

**Where:** §5 intro, §25, §27 F7; vs FR-24.4.

**Problem.** FR-24.4 lists "table names" among values that "SHALL be read only server-side from
environment variables." The design instead makes table names server-side **constants** in
`schema.ts` with **optional** `AIRTABLE_TABLE_*` overrides, keeping only API key + base id
mandatory. The design argues (reasonably) that the **security** intent (server-side only, never in
the client bundle) is fully met by the constants, and the override preserves the **operational**
intent (configurable via env), while 14 mandatory env vars would damage the headline zero-config /
no-credential build (NFR-4). This is a defensible reading, and the design already surfaces it as
"needs owner acknowledgement (non-blocking)."

**Fix.** This is an interpretation to confirm, not a defect: record the accepted reading of FR-24.4
in `requirements.md` and `README.md`. If the owner insists on the literal text, the single change is
to drop the constant defaults and treat `AIRTABLE_TABLE_*` as mandatory whenever Airtable
credentials are present. Flagged here so the gate captures it rather than leaving it buried in a
response log.

---

### N4 — Two competing OG-image mechanisms for home/blog (NIT)

**Where:** §4 (`app/opengraph-image.tsx`), §17 (home/`/blog` OG "from `Settings.OgImageUrl` or a
generated brand OG").

**Problem.** A file-convention `opengraph-image.tsx` and a `generateMetadata`-driven
`openGraph.images` (from `Settings.OgImageUrl`) both set the og:image for the same routes. If both
exist they can emit competing/duplicate `og:image` tags, and the admin-set `Settings.OgImageUrl`
would not reliably win over the static route image.

**Fix.** Choose one source of truth. Simplest: drive the home/blog OG image through
`generateMetadata` (`Settings.OgImageUrl` → generated brand OG fallback) and reserve
`opengraph-image.tsx` only for routes that have no settings-driven override, or drop it entirely.

---

### N5 — Airtable rate limiter is per-instance; the 5 req/s/base ceiling is not guaranteed cross-instance (NIT)

**Where:** §6 (`client.ts` token bucket, capacity 5, refill ~4/s), §7 "Rate-limit respect", NFR-9.2.

**Problem.** The token bucket lives in-process. On Vercel, concurrent lambdas each hold their own
bucket, so the **aggregate** rate across instances can exceed Airtable's ~5 req/s/base during a
revalidation burst or parallel builds — the same per-instance limitation already acknowledged for
the contact rate limiter, but **not** acknowledged here. It is acceptable for v1 (reads are
cache-served, writes are low-volume admin actions, build runs single-process), but the claim as
written ("caps all Airtable traffic at ~4 req/sec regardless") is stronger than what a per-instance
limiter can guarantee.

**Fix.** Add one sentence documenting the per-instance limitation (mirroring §13/§19's contact-limiter
note) and the mitigation (cache-served reads + the 429 backoff/retry in `client.ts`).

---

### N6 — Edge-runtime compatibility of the middleware auth config is unstated (NIT)

**Where:** §4 (`middleware.ts`), §9 (middleware "redirects unauthenticated requests" → implies an
`auth()` call in middleware).

**Problem.** Middleware runs on the Edge runtime. Calling `auth()` there requires the NextAuth
config it imports to be Edge-compatible (no Node-only crypto/adapter imports). The current config
(Google provider + JWT sessions + string-only `signIn` allowlist callback) is Edge-safe, so this
works today — but nothing in the design states the constraint, so a later addition (a DB adapter, a
Node-only import in `config.ts`) could silently break middleware and, with it, the no-creds public
render if the matcher ever widened.

**Fix.** State that the config imported by `middleware.ts` must remain Edge-compatible (JWT only, no
adapter), and keep the middleware matcher scoped to `/admin/:path*` so public routes never invoke
`auth()` (this scoping is already implied and is what keeps the public no-creds render auth-free —
make it explicit).

---

### N7 — Admin by-id reads and ProjectImages writers are implied, not enumerated (NIT)

**Where:** §6 (DAL function list ends with "… one per entity"), §12 (inline gallery editor), §5.6,
§5.16, §7 (gallery CRUD revalidation).

**Problem.** The DAL enumerates `getProjectById` and `getBlogPostById` but leaves the other list
entities' by-id reads under "… one per entity", and the `ProjectImages` writers
(`create/update/delete`) — including the requirement to set the `Project` link array on create and
to resolve the parent slug for revalidation — are only implied. These are the functions the
`/admin/[entity]/[id]` edit pages and the inline gallery editor directly depend on.

**Fix.** Enumerate the admin by-id reads (`getServiceById`, `getIndustryById`, `getStatById`,
`getClientById`, `getReviewById`, `getTeamMemberById`, `getNavLinkById`) and the `ProjectImages`
writers in §6, noting that create must populate the `Project` link (array of record ids) and that
the parent slug for `revalidateTag('project:{slug}')` comes from the editing project's context.

---

### N8 — Favicon/icon assets placed under `public/` rather than the App Router `app/` convention (NIT)

**Where:** §4 (`public/ ├─ icon.png, favicon.ico, apple-icon.png`), §24.

**Problem.** Next.js App Router auto-generates icon `<link>` tags only for icon files located in
`app/` (`app/icon.png`, `app/apple-icon.png`, `app/favicon.ico`). Files in `public/` are served at
their path but do **not** auto-emit `<link rel="icon">` / `apple-touch-icon` tags —
`public/favicon.ico` works at the root by browser default, but `icon.png` / `apple-icon.png` in
`public/` would need manual `metadata.icons` wiring.

**Fix.** Either move the generated icons to `app/icon.png` / `app/apple-icon.png` / `app/favicon.ico`
(the convention that auto-wires them), or declare them explicitly via `metadata.icons` in the root
layout. Pick one and state it.

---

## Verified assumptions

These design claims were checked against the filesystem / source material and are **correct**:

1. **Git isolation hazard (§21).** Verified: `C:\Users\Syed Mehdi Abbas\.git` exists; there is **no**
   `.git` in `Downloads`, `datadive`, or `datadive-web`. The hazard analysis and the "run `git init`
   inside `datadive-web`, then assert `rev-parse --show-toplevel` resolves to `datadive-web` before
   any add/commit" plan are accurate and sufficient to satisfy NFR-5.
2. **Brand assets (§4, §24).** Verified via SHA-256 + PNG header dimensions:
   `Datadive logo file-01.png` = 1667×1667, `Datadive white logo-01.png` = 1667×1667,
   `Datadive.png` = 400×400. `Datadive (1).png` is **21404 bytes — identical size to `Datadive.png`
   — but a different SHA-256** (`4B5DF417…` vs `2518B97D…`), confirming "same byte size, not
   byte-identical, unused." `Datadive (2).png` is a 400×400 variant. The "3 distinct assets" copy
   plan is correct.
3. **Seed content derivation (§5, §8).** Verified against `source-notes.md`: exactly 4 services,
   5 industries, 5 primary + 4 "other" case studies, the five stat figures (150K+/100K+/85%/42+/30+),
   3 team members (Mehdi Abbas; Syed Ali Wazir Tufail; third = known role "Full-Stack & DevOps
   Engineer" + placeholder name), contact email/LinkedIn/website, and the three client sector buckets
   with **no** named clients and **no** testimonials in source (so reviews + clients-as-named-logos
   are correctly treated as placeholders).
4. **Typography (§16).** Inter (body) + Plus Jakarta Sans (display) + JetBrains Mono (data) is a
   valid, consistent pick from `inspiration-notes.md`.
5. **Schema completeness (§5).** Every content type named in FR-20.1 plus Nav, Cta, Settings, and
   ContactSubmissions has a table with explicit Airtable field types. No public/admin content type is
   missing a table or field typing.
6. **Pre-implementation state.** No `datadive-web/package.json` exists yet; reviewing the design
   before any code is written is correct and the build-gate strategy (zero-env `npm run build` + lint
   + `npm start`) is the right non-negotiable check.

## Unverified / external-dependency assumptions

These claims drive core guarantees but depend on third-party library/platform behavior that cannot
be executed in this review (no app is scaffolded yet). They match documented behavior to the best of
my knowledge; each should be smoke-tested early in implementation.

1. **NextAuth v5 `NextAuth(config)` does not throw at construction when `AUTH_SECRET` is absent**
   (lazy `MissingSecret` at request time) — the linchpin of the zero-env build (NFR-2/NFR-4) and the
   `hasAuthCreds()` guards (§9). This matches known `next-auth@5.0.0-beta.x` behavior and the design
   responsibly pins `5.0.0-beta.25` and flags re-confirmation. **Action:** add a trivial test that
   imports `src/auth.ts` with zero env and asserts no throw, as part of the build gate.
2. **Next 15: `fetch` is uncached by default and an explicit `next:{revalidate,tags}` persists in the
   Data Cache even under `force-dynamic`.** This is accurate per Next 15 docs and is precisely why
   M2 matters (admin reads need `no-store`).
3. **Airtable attachment URLs expire / can't be hotlinked**, justifying the URL-text-field image
   convention (§5 image rule) — accurate per Airtable's documented change; not independently
   re-tested here.
4. **Vercel ~4.5MB serverless request-body cap** (justifying client-upload) and **Vercel Blob stable
   public URLs on `*.public.blob.vercel-storage.com`** (used by the §13 host allowlist) — accurate
   per Vercel docs.
5. **Next.js Image Optimizer returns HTTP 400 for `image/svg+xml` unless `dangerouslyAllowSVG`** —
   accurate; underpins the committed-raster-PNG seed decision (§8). Note the design's own caveat that
   this failure is invisible to `npm run build` (the optimizer only runs at request time), so the
   no-creds **render** must be smoke-tested with `npm start`, not just `npm run build`.
6. **Airtable ~5 req/s/base limit** — accurate; see N5 for the per-instance limiter caveat.

## Notes on areas explicitly requested for scrutiny

- **Airtable schema completeness:** complete; every type typed (verified). ✔
- **DAL + no-credentials fallback:** well specified, including the creds-present empty-result split
  (singleton→seed, list→empty) — except that the list rule contradicts FR-9.2 for reviews (M1).
- **Caching / revalidation / on-demand path:** the public in-process `revalidateTag` path is sound
  and needs no protected endpoint; the optional secret-gated `/api/revalidate` is correctly disabled
  when unset. The gap is admin-read caching (M2).
- **Auth allowlist over pages AND mutating routes:** fully covered — `requireAdminPage()` on the
  protected layout/pages, `requireAdmin()` via `withAdmin()` on every server action, `requireAdmin()`
  in `/api/blob/upload`, secret on `/api/revalidate`, and the `hasAuthCreds()` short-circuit before
  any `auth()` call. No unauthenticated mutating surface. ✔ (See N2 for the control-flow caveat and
  N6 for the Edge-config caveat.)
- **Image storage choice:** concrete and justified — Vercel Blob, client-upload, host-validated
  URLs, SVG rejected. ✔
- **Git isolation:** verified against the real filesystem; plan is correct and sufficient. ✔
- **No-credentials build/render achievable:** yes, as designed, contingent on the NextAuth
  construction behavior (Unverified #1) and on validating render — not just build — under `npm start`
  (Unverified #5).
