# Datadive Marketing Website — Requirements

## Summary

Build the **Datadive** marketing website as a production-ready Next.js application whose single purpose is to win clients. It showcases the company and its work through public sections (hero/intro, about, services, portfolio/projects, industries, stats, clientele, reviews, team, blog, contact, CTA) with strong-but-tasteful animation and interactivity. **All content is managed through Airtable** and edited via an in-app, Google-auth-protected **admin dashboard** — nothing on the public site is hardcoded. The site deploys to Vercel and must build and render even when no live credentials are configured, using seed/sample fallback data.

Brand: **"Datadive — Diving Into Data, Driving Decisions."** Theme: dark, premium, modern, with amber/red/green/blue accents used tastefully. Design intent: simple, catchy, user-friendly, interactive. Avoid heavy text, bulky/edgy/messy layouts, old-style design, uneven gaps, poor color combinations, and a static feel.

**Locked technology stack (do not re-litigate — recorded here so requirements can assume it):**

- Next.js (App Router) + TypeScript + Tailwind CSS.
- Airtable as the single source of truth, accessed through its REST API behind a typed data-access layer that is the **only** place Airtable is touched.
- Next.js ISR / per-segment `revalidate` for static-fast public pages (respecting Airtable's ~5 requests/second/base limit), plus an on-demand revalidation path triggered by admin saves.
- Auth.js / NextAuth v5 Google provider; admin access restricted to an email allowlist supplied via the `ADMIN_EMAILS` environment variable.
- Admin-uploadable images via a single chosen provider (Vercel Blob, Cloudinary, or Airtable attachments — provider selection is a design decision, deferred to the design phase).
- Vercel deployment with project root = `datadive-web/`.

This document defines **what** must be true, not **how** to build it. Each requirement has a user story and numbered, testable acceptance criteria written in EARS style (`WHEN … THEN the system SHALL …`, `IF … THEN the system SHALL …`). Requirement IDs (FR-n, NFR-n) and criterion IDs (n.m) are stable for traceability in design and testing.

---

## Assumptions

These are inferred where the request or source material was silent. The design review should confirm or correct them.

1. **Admin-only authentication.** The public site has no end-user accounts, login, or gated content. Authentication exists solely to protect the admin dashboard.
2. **Reviews == testimonials.** "Reviews" and "testimonials" refer to the same content entity and are managed as one type.
3. **Reviews, blog posts, and phone/WhatsApp number are not present in the company profile.** They are seeded with clearly-labeled sample/placeholder data and are fully admin-editable. The WhatsApp/phone value in seed data is a placeholder, not a real number.
4. **Team third member name is unknown** (not captured in the source). It is an admin-editable field seeded with a placeholder.
5. **Contact submissions are persisted to Airtable** (a dedicated submissions table) because Airtable is the designated single source of truth. An email notification on submission is a nice-to-have, not a blocker.
6. **Industries, Stats/proof, Team, and the CTA band are editable content sections**, not hardcoded, consistent with the "nothing hardcoded" rule, even though the task's admin list named them only implicitly.
7. **Single locale (English)** and no e-commerce/payments.
8. **Image storage provider** is selected during design; requirements only mandate that admins can upload images, that images render on public pages, and that each image carries admin-provided alt text.
9. **Brand logo assets** already exist (full-color, white/reversed, and 400×400 square marks) and are used for header/footer/hero/favicon per the source inventory; the square mark is the basis for favicon/OpenGraph assets.
10. **"Portfolio/projects"** maps to the company's case studies (5 primary + ~4 "other"); these are the seed portfolio entries.

---

## Functional Requirements

### FR-1 — Public site shell, navigation, and routing

**User story:** As a prospective client, I want a consistent, responsive site shell with clear navigation, so that I can move between sections and pages easily on any device.

#### Acceptance Criteria

1. WHEN any public page loads THEN the system SHALL render a sticky top navigation containing the Datadive logo/wordmark, primary navigation links, and a primary CTA button.
2. The system SHALL expose these public routes at minimum: `/` (home), `/blog` (listing), and `/blog/[slug]` (individual post). Home-page sections (hero, about, services, portfolio, industries, stats, clients, reviews, team, contact, CTA) SHALL be reachable via in-page anchors and/or dedicated routes.
3. WHEN the viewport is mobile-width THEN the navigation SHALL collapse into an accessible menu (keyboard-operable, focus-trapped when open) that exposes all primary links and the CTA.
4. WHEN any public page loads THEN the system SHALL render a footer containing company contact details (email, LinkedIn, website) and social links, all sourced from the data layer (see FR-21).
5. The navigation labels, logo asset, and CTA target SHALL be sourced from the data/settings layer, not hardcoded literals.
6. IF a requested public route does not exist THEN the system SHALL render a branded 404 page with a link back to home.

### FR-2 — Hero / company introduction

**User story:** As a prospective client, I want an immediate, striking introduction to Datadive, so that I understand who they are and what they do within seconds.

#### Acceptance Criteria

1. WHEN the home page loads THEN the system SHALL render a hero section with a headline, subheadline, primary CTA, and a supporting visual, all sourced from the data layer.
2. The hero headline/subheadline SHALL default (via seed data) to the brand tagline "Diving Into Data, Driving Decisions" and the mission lockup, and SHALL be fully editable in admin (see FR-20).
3. WHEN the hero CTA is activated THEN the system SHALL navigate to the configured target (e.g., contact section/route) defined in the data/settings layer.
4. The hero SHALL remain legible and correctly laid out across mobile, tablet, and desktop breakpoints without overlapping elements or clipped text.

### FR-3 — About / mission / company intro

**User story:** As a prospective client, I want to read Datadive's mission and approach, so that I can judge whether they fit my needs.

#### Acceptance Criteria

1. WHEN the home page (or about section/route) loads THEN the system SHALL render the company mission/about copy sourced from the data layer, seeded from the company profile text.
2. The about content (heading, body paragraphs, optional supporting points/visual) SHALL be editable in admin without code changes.
3. The about section SHALL present copy in scannable chunks (short paragraphs/points), consistent with the "avoid heavy text" design constraint.

### FR-4 — Services

**User story:** As a prospective client, I want to see the services Datadive offers, so that I can tell whether they solve my problem.

#### Acceptance Criteria

1. WHEN the services section loads THEN the system SHALL render all service entries from the data layer as a card grid, seeded with the four core offerings (Dashboard Development & Data Visualization; Business Intelligence Consulting; Predictive Analytics & AI Solutions; Custom Data Solutions).
2. Each service card SHALL display at least a title and description, and MAY display an icon/visual, all sourced from the data layer.
3. The number of services rendered SHALL be driven by the data (adding/removing a service in admin changes the grid) with no hardcoded count.
4. WHEN a service card is hovered or focused THEN the system SHALL apply a tasteful interactive state (e.g., lift/accent) that also responds to keyboard focus.

### FR-5 — Portfolio / projects (with images)

**User story:** As a prospective client, I want to browse Datadive's past projects with visuals and outcomes, so that I can trust their track record.

#### Acceptance Criteria

1. WHEN the portfolio section/route loads THEN the system SHALL render project entries from the data layer, seeded with the company case studies (e.g., HR Analytics Dashboard, National Health Data Dashboards, Surge & Financial Management Dashboard, Procurement Analytics Dashboard, US Merchant Sales Dashboard, plus the "other" case studies).
2. Each project SHALL support a title, summary/description, one or more images, optional tags/industry, and optional metrics, all sourced from the data layer.
3. WHEN a project has an associated image THEN the system SHALL render it with admin-provided alt text; IF no image is present THEN the system SHALL render a branded placeholder without layout breakage.
4. The portfolio SHALL support ordering controlled from the data layer (admin-defined display order).
5. IF a project exposes a detail view THEN the system SHALL render full details (description, images, metrics) sourced entirely from the data layer.

### FR-6 — Industries / sectors served

**User story:** As a prospective client, I want to see which industries Datadive serves, so that I can see relevance to my sector.

#### Acceptance Criteria

1. WHEN the industries section loads THEN the system SHALL render industry entries from the data layer, seeded with the five sectors from the profile (Human Resources; Healthcare & NGOs; Retail & Sales; Corporate Operations; AI & Machine Learning).
2. Each industry entry (label, short description, optional icon) SHALL be editable in admin.
3. The rendered set SHALL be data-driven with no hardcoded count.

### FR-7 — Stats / proof band

**User story:** As a prospective client, I want to see quantified proof of Datadive's impact, so that I gain confidence quickly.

#### Acceptance Criteria

1. WHEN the stats band loads THEN the system SHALL render stat entries (value + label) from the data layer, seeded with figures from the profile (e.g., 150K+ records, 100K+ records, 85% accuracy, 42+ countries, 30+ staff).
2. Each stat (value, label, optional suffix/prefix) SHALL be editable in admin.
3. WHEN the stats band scrolls into view THEN the system SHALL animate the numeric values counting up, and this animation SHALL be suppressed when the user has `prefers-reduced-motion` enabled (see NFR-10).

### FR-8 — Clientele / client logos

**User story:** As a prospective client, I want to see the organizations Datadive has worked with, so that I trust their credibility.

#### Acceptance Criteria

1. WHEN the clientele section loads THEN the system SHALL render client entries (logo image + name, optional sector grouping) from the data layer, supporting the three sector buckets (International & Development, Corporate & Technology, Independent Case Studies).
2. Each client logo SHALL render with admin-provided alt text; IF a logo image is missing THEN the system SHALL render the client name as a text fallback without layout breakage.
3. The set of logos and their grouping SHALL be fully managed from admin with no hardcoded entries.

### FR-9 — Reviews / testimonials

**User story:** As a prospective client, I want to read testimonials from Datadive's clients, so that I can trust their service quality.

#### Acceptance Criteria

1. WHEN the reviews section loads THEN the system SHALL render review entries (quote, author name, optional role/company, optional avatar, optional rating) from the data layer.
2. IF no reviews exist in the data source THEN the system SHALL render seeded placeholder reviews that are clearly replaceable via admin, and the section SHALL NOT break the layout when empty.
3. Reviews SHALL be fully managed from admin (create, edit, delete, order) with no hardcoded entries.

### FR-10 — Blog listing

**User story:** As a prospective client, I want to browse Datadive's blog, so that I can gauge their expertise and stay engaged.

#### Acceptance Criteria

1. WHEN `/blog` loads THEN the system SHALL render a list of published posts from the data layer, each showing title, excerpt/summary, cover image (or placeholder), author, and publish date.
2. The listing SHALL display posts in reverse-chronological order by publish date by default.
3. IF a post is marked unpublished/draft in the data source THEN the system SHALL exclude it from the public listing and from public post routes.
4. WHEN a listed post is activated THEN the system SHALL navigate to that post's `/blog/[slug]` page.
5. IF there are no published posts THEN the system SHALL render an empty-state message without layout breakage (seed data SHALL include at least sample posts so the page is populated by default).

### FR-11 — Blog individual post page

**User story:** As a reader, I want to read a full blog post on its own page, so that I can consume the content and share it.

#### Acceptance Criteria

1. WHEN `/blog/[slug]` loads for a published post THEN the system SHALL render the full post (title, cover image, author, publish date, body content) sourced from the data layer.
2. The post body SHALL support formatted rich text (headings, lists, links, images, emphasis) as stored in the data layer, rendered safely (untrusted/stored markup sanitized — see NFR-11).
3. IF the slug does not match a published post THEN the system SHALL return the branded 404 page.
4. WHEN a post page renders THEN the system SHALL emit per-post SEO metadata and Open Graph/Twitter tags (title, description, cover image, canonical URL) derived from the post data (see NFR-13).
5. Each post SHALL have a unique, stable, URL-safe slug sourced from the data layer.

### FR-12 — Contact form and contact details

**User story:** As a prospective client, I want to send Datadive a message and see how to reach them, so that I can start a conversation.

#### Acceptance Criteria

1. WHEN the contact section/route loads THEN the system SHALL render a contact form (minimum: name, email, message; optional: company, subject/phone) and the company contact details (email, LinkedIn, website) sourced from the data/settings layer.
2. WHEN a visitor submits the form with valid input THEN the system SHALL persist the submission to the Airtable submissions table via the data-access layer and SHALL show a success confirmation state.
3. IF submission input is invalid (missing required field, malformed email, over length limits) THEN the system SHALL block submission and show inline, field-level validation messages; validation SHALL be enforced server-side as well as client-side (see NFR-11).
4. IF persisting the submission fails THEN the system SHALL show a non-technical error state inviting a retry, SHALL NOT lose the entered values, and SHALL log the failure server-side (no secrets or PII in client-visible errors).
5. The form SHALL include at least one spam-mitigation control (e.g., honeypot and/or server-side rate limiting).
6. An email notification on new submission MAY be sent if configured; its absence SHALL NOT cause submission to fail.

### FR-13 — WhatsApp click-to-chat (dynamic from settings)

**User story:** As a prospective client, I want a one-tap WhatsApp chat button, so that I can reach Datadive instantly; and as the owner, I want to change the number once and have it update everywhere.

#### Acceptance Criteria

1. WHEN any public page loads THEN the system SHALL render a persistent, accessible WhatsApp click-to-chat affordance (e.g., a floating button) whose `wa.me` link is built from the WhatsApp number stored in the Airtable site-settings record.
2. The `wa.me` link SHALL use the correct international format (digits only, no `+`, spaces, or separators) and MAY include a prefilled default message sourced from settings.
3. WHEN the admin changes the WhatsApp number in settings and the change is published/revalidated THEN every WhatsApp link across the entire site SHALL reflect the new number (single source — no duplicated hardcoded numbers anywhere).
4. IF no WhatsApp number is configured (and no seed value is available) THEN the system SHALL hide the WhatsApp affordance rather than render a broken link.
5. The WhatsApp affordance SHALL be keyboard-focusable, have an accessible label, and SHALL respect reduced-motion for any entrance animation.

### FR-14 — Team section

**User story:** As a prospective client, I want to meet the Datadive team, so that I know who I'd be working with.

#### Acceptance Criteria

1. WHEN the team section loads THEN the system SHALL render team member entries (name, role, optional photo, optional links) from the data layer, seeded from the profile (Mehdi Abbas — Founder & Lead Data Analyst; Syed Ali Wazir Tufail — Creative Design & Visualization Expert; third member as an editable placeholder).
2. Each team member SHALL be fully manageable from admin (create, edit, delete, order) with no hardcoded entries.
3. IF a member has no photo THEN the system SHALL render a branded placeholder/avatar without layout breakage.

### FR-15 — CTA band

**User story:** As a prospective client, I want a clear closing prompt to engage Datadive, so that I know the next step.

#### Acceptance Criteria

1. WHEN the CTA band loads THEN the system SHALL render a heading, supporting line, and action button(s) sourced from the data/settings layer, seeded with the "Let's Dive Into Data Together" copy.
2. The CTA action target(s) SHALL be configurable from the data/settings layer (e.g., contact route and/or WhatsApp).

### FR-16 — Tasteful animations and interactive layout

**User story:** As a prospective client, I want the site to feel modern and alive without being distracting, so that I enjoy exploring it and trust the brand.

#### Acceptance Criteria

1. WHEN sections enter the viewport THEN the system SHALL apply tasteful scroll-reveal transitions (e.g., fade/slide-up) and interactive hover/focus states on cards and buttons.
2. WHEN the user has `prefers-reduced-motion: reduce` enabled THEN the system SHALL disable or substantially reduce non-essential motion (scroll reveals, counters, parallax, blob animations) while keeping all content accessible (see NFR-10).
3. Animations SHALL NOT block content rendering, trap focus, or prevent interaction, and SHALL maintain smooth performance on mid-range mobile devices.
4. The layout SHALL use consistent spacing, alignment, and a coherent accent palette (amber/red/green/blue used tastefully), avoiding uneven gaps, bulky/messy composition, and a static feel.

### FR-17 — Unique playful interactive engagement feature (nice-to-have)

**User story:** As a visitor, I want one memorable, playful interaction that reinforces the "dive into data" idea, so that the brand stands out.

#### Acceptance Criteria

1. The system SHOULD provide exactly one distinctive, playful interactive feature that reinforces the brand metaphor (e.g., an interactive data-viz hero that "dives into data," or a data-point parallax/"depth" micro-interaction).
2. This feature is a **nice-to-have**: IF it is not delivered THEN no other requirement SHALL be considered failed, and the site SHALL remain complete and shippable without it.
3. IF delivered THEN the feature SHALL respect `prefers-reduced-motion`, remain accessible/keyboard-friendly or gracefully degrade, and SHALL NOT regress build, performance, or layout quality.

### FR-18 — Admin authentication and access control (Google)

**User story:** As the site owner, I want the admin area protected by Google sign-in limited to approved emails, so that only authorized people can edit content.

#### Acceptance Criteria

1. WHEN an unauthenticated user requests any admin route or admin API THEN the system SHALL deny access and redirect to a sign-in flow (no admin content or data rendered).
2. The system SHALL authenticate admins via the Auth.js / NextAuth v5 Google provider.
3. WHEN a user authenticates with Google AND their email is present in the `ADMIN_EMAILS` allowlist THEN the system SHALL grant admin access; IF the authenticated email is NOT in the allowlist THEN the system SHALL deny access with a clear "not authorized" message and SHALL NOT expose any admin functionality or data.
4. Admin authorization SHALL be enforced server-side on every admin route and every content-mutating API endpoint (not solely in client-side UI).
5. WHEN an admin signs out THEN the system SHALL end the session and subsequent admin requests SHALL be denied until re-authentication.
6. IF Google auth environment variables are absent THEN the app SHALL still build and the public site SHALL still render (the admin area MAY be unavailable), per NFR-4.

### FR-19 — Admin dashboard shell

**User story:** As an admin, I want a clear dashboard to navigate all content types, so that I can find and manage anything quickly.

#### Acceptance Criteria

1. WHEN an authorized admin loads the dashboard THEN the system SHALL present navigation to every manageable content type and to site settings (FR-20, FR-21, FR-22).
2. The dashboard SHALL display the signed-in admin's identity and provide a sign-out action.
3. The admin UI SHALL be responsive and usable on desktop at minimum, without broken layout.

### FR-20 — Admin CRUD for all content types (nothing hardcoded)

**User story:** As an admin, I want full create/read/update/delete control over every content type, so that the entire public site is editable without code changes.

#### Acceptance Criteria

1. The system SHALL provide create, read, update, and delete operations, via the Airtable data-access layer, for **all** of: projects/portfolio, services, reviews/testimonials, clients/logos, blog posts, company intro/about, hero content, team members, industries, and stats.
2. WHEN an admin creates, edits, or deletes a content record AND saves THEN the change SHALL persist to Airtable and SHALL become visible on the corresponding public page after revalidation (see FR-23).
3. WHERE a content type supports display order, the admin SHALL be able to set/reorder it, and the public site SHALL honor that order.
4. WHERE a content type supports a published/draft state (e.g., blog posts), the admin SHALL be able to set it, and only published items SHALL appear publicly.
5. WHEN an admin submits invalid or incomplete data (missing required fields, wrong types, over limits) THEN the system SHALL reject the save and show field-level validation messages; required-field and type rules SHALL be enforced server-side (see NFR-11).
6. IF a save operation fails (Airtable error, rate limit, network) THEN the system SHALL surface a clear, non-technical error, SHALL NOT silently drop the edit, and SHALL log the failure server-side.
7. No public section defined in FR-2 through FR-16 SHALL rely on hardcoded content literals; every such piece of copy, list, link, and image SHALL be sourced from the data layer and therefore editable through this requirement.

### FR-21 — Site settings management

**User story:** As an admin, I want to manage global site settings in one place, so that cross-cutting values stay consistent everywhere.

#### Acceptance Criteria

1. The system SHALL provide editing of a site-settings record including at least: WhatsApp number (+ optional prefilled message), contact details (email, phone, address as applicable), and social links (e.g., LinkedIn, website).
2. WHEN an admin updates a setting AND saves THEN the new value SHALL be reflected everywhere it is consumed across the site after revalidation (see FR-23) — notably the WhatsApp link (FR-13), footer, and contact section.
3. Settings SHALL be validated on save (e.g., WhatsApp number reduces to digits-only international format; URLs well-formed; email well-formed), with field-level errors on failure.
4. The site-settings values SHALL be the single source for these cross-cutting values; no page SHALL hardcode a duplicate.

### FR-22 — Image upload and management

**User story:** As an admin, I want to upload and manage images for content, so that the public site shows the right visuals without developer involvement.

#### Acceptance Criteria

1. The system SHALL allow an authorized admin to upload images and associate them with content records (hero, projects, clients/logos, blog covers/inline, team photos, review avatars).
2. WHEN an image is uploaded THEN the system SHALL store it via the configured image provider and persist a reference usable by public pages through the data-access layer.
3. The admin SHALL be able to provide alt text for each image, and public pages SHALL render that alt text (see NFR-10).
4. IF an image upload fails (type not allowed, over size limit, provider error) THEN the system SHALL reject it with a clear message and SHALL NOT corrupt the associated record.
5. Allowed image types and a maximum file size SHALL be enforced server-side; the limits SHALL be documented.
6. IF the image provider is not configured (no credentials) THEN image upload MAY be disabled, but the public site SHALL still build and render using seed images/placeholders (see NFR-4).

### FR-23 — On-demand revalidation on save

**User story:** As an admin, I want my saved changes to appear on the live site promptly, so that I don't wait for a timed rebuild.

#### Acceptance Criteria

1. WHEN an admin successfully saves a content or settings change THEN the system SHALL trigger on-demand revalidation of the affected public page(s)/paths.
2. The on-demand revalidation endpoint SHALL be protected (callable only by the authenticated admin action / a server-held secret), not publicly triggerable without authorization.
3. WHEN revalidation completes THEN a subsequent public request SHALL serve the updated content.
4. IF on-demand revalidation fails THEN scheduled ISR revalidation (FR-24 / NFR-9) SHALL still bring the public site up to date within the configured interval, and the failure SHALL be logged.

### FR-24 — Typed Airtable data-access layer (single source of truth)

**User story:** As a developer, I want all Airtable access centralized in one typed layer, so that data handling is consistent, cached, and safe to evolve.

#### Acceptance Criteria

1. The system SHALL access Airtable **only** through a single typed data-access layer; no React component, page, or route handler SHALL call the Airtable API directly.
2. The data-access layer SHALL expose typed read functions for every content type and typed write functions for admin CRUD, returning typed domain models (not raw Airtable records) to callers.
3. The data-access layer SHALL map Airtable fields to typed domain models and SHALL tolerate missing/optional fields without throwing (returning safe defaults).
4. Airtable credentials (API key/token, base id, table names) SHALL be read only server-side from environment variables and SHALL never be exposed to the client bundle (see NFR-11).
5. IF Airtable credentials are absent THEN the read functions SHALL return seed/sample fallback data (see NFR-4) rather than throwing.
6. The data-access layer SHALL be the single place where caching/revalidation and rate-limit handling for Airtable are implemented (see NFR-9).

### FR-25 — Seed/sample fallback data

**User story:** As a developer or reviewer, I want the site to run without live credentials, so that I can build, preview, and test it anywhere.

#### Acceptance Criteria

1. The system SHALL include seed/sample data covering every public content type, derived from the company profile where available (brand copy, services, case studies, industries, stats, team, contact details) and clearly-labeled placeholders where not (reviews, blog posts, WhatsApp number).
2. WHEN the app runs with no Airtable (and no provider) credentials THEN every public page SHALL render fully using seed data, with no crashes, empty-screen states, or broken images.
3. The seed data SHALL be served through the same typed data-access layer interface as live data, so public components are agnostic to the source.
4. Seed data SHALL be verifiably testable without network access or live credentials.

---

## Non-Functional Requirements

### NFR-1 — Technology stack conformance

1. The implementation SHALL use Next.js (App Router) + TypeScript + Tailwind CSS, Airtable via a typed data-access layer, Auth.js/NextAuth v5 Google provider, and deploy to Vercel, as specified in the Summary. These choices are locked and SHALL NOT be substituted.
2. Exactly one image-storage provider (Vercel Blob, Cloudinary, or Airtable attachments) SHALL be chosen in the design phase and used consistently.

### NFR-2 — Build and lint quality

1. `npm run build` SHALL complete successfully with no TypeScript or build errors.
2. The project's lint step SHALL pass with no errors.
3. Criteria 1 and 2 SHALL hold **even when no environment variables are configured** (see NFR-4).

### NFR-3 — Configuration via environment variables

1. All secrets and environment-specific configuration (Airtable token/base, Google OAuth client id/secret, `ADMIN_EMAILS`, `NEXTAUTH_SECRET`/auth config, image-provider credentials, revalidation secret, app URL) SHALL be supplied via environment variables.
2. A committed `.env.example` SHALL document every required and optional variable with safe placeholder values and brief descriptions.
3. No real secret values SHALL be committed to the repository.

### NFR-4 — Graceful operation without credentials

1. WHEN environment variables are absent THEN the app SHALL build (NFR-2) AND the public site SHALL render using seed/sample fallback data (FR-25).
2. WHEN auth or provider credentials are absent THEN public rendering SHALL be unaffected; only the corresponding privileged feature (admin login, image upload) MAY be unavailable, and SHALL fail safe (no crash).
3. This behavior SHALL be testable locally without any live credentials.

### NFR-5 — Isolated version control

1. A dedicated git repository SHALL be initialized **inside** `datadive-web/`.
2. Version-control operations SHALL NOT stage, commit, or otherwise modify any git repository outside `datadive-web/` — in particular the accidental repository at the parent of `c:\Users\Syed Mehdi Abbas\Downloads\datadive`.
3. A `.gitignore` SHALL exclude `node_modules`, build output (`.next`), environment files (`.env*` except `.env.example`), and provider/local artifacts.

### NFR-6 — Vercel deployment

1. The project SHALL deploy to Vercel with project root = `datadive-web/`, building via `npm run build`.
2. ISR / on-demand revalidation (FR-23, NFR-9) SHALL function in the Vercel environment.
3. Required environment variables SHALL be documented for configuration in Vercel (consistent with NFR-3).

### NFR-7 — Branding and visual theme

1. The site SHALL present a dark, premium, modern theme consistent with the Datadive brand, using amber/red/green/blue accents tastefully (accent, not dominant).
2. The brand name/tagline "Datadive — Diving Into Data, Driving Decisions" SHALL appear appropriately (e.g., hero, metadata, footer), sourced from the data/settings layer where it is content.
3. Logo usage SHALL follow the asset inventory: reversed/white mark on dark surfaces, full-color mark on light surfaces, and the square mark as the basis for favicon/OpenGraph.

### NFR-8 — Design quality constraints

1. The design SHALL be simple, catchy, user-friendly, and interactive, and SHALL avoid: heavy walls of text, bulky/edgy/messy layouts, old-style design, uneven gaps, poor color combinations, and a static feel.
2. Spacing, typography scale, and alignment SHALL be consistent across sections (a shared design system/tokens), with a coherent type pairing (a clean sans for body plus a distinctive display face, optionally a mono accent for data/numbers).

### NFR-9 — Performance and Airtable rate limits

1. Public pages SHALL be statically fast via ISR/per-segment `revalidate`, serving cached content rather than hitting Airtable on every request.
2. The data-access layer SHALL respect Airtable's ~5 requests/second/base limit (e.g., via caching and controlled fetching) and SHALL avoid request storms during build or revalidation.
3. IF an Airtable rate-limit or transient error occurs during a read THEN the system SHALL serve the last good/cached or seed data where possible rather than failing the public page.
4. Image delivery SHALL use optimized/responsive rendering so visuals do not degrade load performance on mobile.

### NFR-10 — Accessibility

1. The site SHALL target WCAG 2.1 AA as a goal: semantic structure, keyboard operability of all interactive elements (nav, forms, carousels, WhatsApp button), visible focus states, and alt text on meaningful images (admin-provided per FR-22).
2. Color contrast SHALL meet AA for text and essential UI against the dark theme and bright accents.
3. All motion/animation SHALL honor `prefers-reduced-motion: reduce` by disabling or substantially reducing non-essential motion while preserving content and functionality.
4. Note: full WCAG conformance claims require manual testing with assistive technologies and expert review; this requirement sets the implementation target, not a certified claim.

### NFR-11 — Security and data handling

1. Secrets (Airtable token, Google client secret, provider keys, revalidation secret) SHALL be server-side only and SHALL never appear in the client bundle or client-visible errors/logs.
2. All content-mutating endpoints (admin CRUD, image upload, revalidation) SHALL enforce authentication/authorization server-side (FR-18) and SHALL reject unauthorized requests.
3. All external inputs — contact form fields and admin form fields — SHALL be validated server-side for presence (when required), type, and length/limits, and rejected with clear errors on failure.
4. Stored rich text / HTML (e.g., blog bodies) SHALL be sanitized or rendered safely to prevent stored XSS.
5. The contact endpoint SHALL have spam/abuse mitigation (honeypot and/or rate limiting) per FR-12.
6. Error messages shown to users SHALL not leak secrets, stack traces, or PII; detailed diagnostics SHALL be server-side logs only.
7. Any new network-exposed endpoint created (e.g., contact submit, revalidation, upload) SHALL have its access-control posture explicitly defined; none SHALL be left unauthenticated unless intentionally public (e.g., contact submit, which SHALL then be rate-limited and spam-protected).

### NFR-12 — Responsiveness and compatibility

1. All public pages and the admin dashboard SHALL render correctly across mobile, tablet, and desktop breakpoints without horizontal overflow, overlapping, or clipped content.
2. The site SHALL function on current versions of mainstream evergreen browsers (Chrome, Edge, Firefox, Safari).

### NFR-13 — SEO and metadata

1. Every public page SHALL emit appropriate `<title>` and meta description; the home and blog pages SHALL include Open Graph/Twitter metadata and a default share image derived from brand assets.
2. Each blog post SHALL emit per-post metadata, Open Graph/Twitter tags, and a canonical URL (FR-11).
3. The site SHALL provide a sitemap and robots configuration appropriate for a public marketing site.

### NFR-14 — Future extensibility seam (noted, not built)

1. The architecture SHALL leave a clean, modular seam for future "free analysis tools" / Auto-ETL capabilities (e.g., upload-data-get-report), potentially implemented later as Python / Vercel Python serverless functions.
2. This is a **boundary/structure concern only**: the current scope SHALL NOT implement any analysis tool, ETL pipeline, or Python runtime. The seam SHALL add no user-facing feature and SHALL not block build/deploy.

---

## Out of Scope

1. Building the free analysis tools, Auto-ETL pipelines, report generation, or any Python / Vercel Python serverless functions (only a clean modular seam is noted — NFR-14).
2. Public end-user accounts, registration, or any non-admin authentication; the only auth is admin Google sign-in.
3. E-commerce, payments, pricing/checkout, or subscriptions.
4. Multi-language / internationalization and multi-currency.
5. A custom CMS backend beyond Airtable; Airtable is the single source of truth.
6. Rendering, opening, or processing the large source media at build time (25MB PDFs, .pptx, .mp4, full-page screenshot images); only extracted text/copy and the small logo PNGs are used.
7. Converting the `.ai` vector logo source; it is handed to a designer later.
8. Advanced analytics/marketing integrations (A/B testing, heatmaps, CRM sync) beyond basic SEO metadata.
9. A certified WCAG conformance audit (the target is AA implementation; certification requires separate manual expert testing — NFR-10.4).
10. Migrating, altering, or committing to any git repository outside `datadive-web/` (NFR-5).

---

## Requirements doc path

`c:\Users\Syed Mehdi Abbas\Downloads\datadive\datadive-web\.agents\tasks\datadive-build\requirements.md`
