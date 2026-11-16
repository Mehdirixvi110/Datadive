// Datadive Airtable provisioner (one-off, operator-run).
//
// Creates the 15 content tables defined in src/lib/airtable/schema.ts on the
// live Datadive base, seeds them from src/lib/seed, and verifies the result.
// The table + field names here are derived from schema.ts / mappers.ts, so the
// running site's data-access layer maps every record instead of falling back
// to seed content.
//
// Credentials are READ AT RUNTIME from datadive-web/.env.local (falling back to
// datadive-leadgen/.env) and NEVER printed or written to the log. Progress,
// results, and errors go to .agents/tasks/airtable-provision/run.log plus a
// machine-readable summary.json, because this shell does not reliably capture
// stdout from external network calls.
//
// Run:  node scripts/provision-airtable.mjs
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import {
  SEED_ABOUT,
  SEED_BLOG_POSTS,
  SEED_CLIENTS,
  SEED_CTA,
  SEED_HERO,
  SEED_INDUSTRIES,
  SEED_NAV_LINKS,
  SEED_PROJECTS,
  SEED_REVIEWS,
  SEED_SERVICES,
  SEED_SETTINGS,
  SEED_STATS,
  SEED_TEAM,
} from "../src/lib/seed/index.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, ".."); // datadive-web
const ENV_LOCAL = join(ROOT, ".env.local");
const LEADGEN_ENV = join(ROOT, "..", "datadive-leadgen", ".env");
const TASK_DIR = join(ROOT, ".agents", "tasks", "airtable-provision");
const LOG = join(TASK_DIR, "run.log");
const SUMMARY = join(TASK_DIR, "summary.json");

const TARGET_BASE_ID = "appS52F8OZKoDLIqH"; // "Datadive" base (not secret).
const API = "https://api.airtable.com/v0";

// A clearly-fake, operator-editable placeholder WhatsApp number. It is
// deliberately DIFFERENT from the seed constant (10000000000) so that a live
// render can be told apart from the seed fallback: wa.me/<this> only appears
// when the page is actually reading Settings from Airtable.
const WHATSAPP_PLACEHOLDER = "19999999999";

const ACCENTS = ["blue", "amber", "green", "red"];
const SECTORS = [
  "International & Development",
  "Corporate & Technology",
  "Independent Case Studies",
];
const STATUSES = ["New", "Read", "Archived"];

// --- Field builders (mirror the Airtable Web API field model) ---------------
const txt = (name) => ({ name, type: "singleLineText" });
const long = (name) => ({ name, type: "multilineText" });
const email = (name) => ({ name, type: "email" });
const url = (name) => ({ name, type: "url" });
const int = (name) => ({ name, type: "number", options: { precision: 0 } });
const check = (name) => ({
  name,
  type: "checkbox",
  options: { icon: "check", color: "greenBright" },
});
const select = (name, choices) => ({
  name,
  type: "singleSelect",
  options: { choices: choices.map((c) => ({ name: c })) },
});
const multi = (name, choices) => ({
  name,
  type: "multipleSelects",
  options: { choices: choices.map((c) => ({ name: c })) },
});
const date = (name) => ({
  name,
  type: "date",
  options: { dateFormat: { name: "iso", format: "YYYY-MM-DD" } },
});
const dateTime = (name) => ({
  name,
  type: "dateTime",
  options: {
    dateFormat: { name: "iso", format: "YYYY-MM-DD" },
    timeFormat: { name: "24hour", format: "HH:mm" },
    timeZone: "utc",
  },
});

const projectTags = [...new Set(SEED_PROJECTS.flatMap((p) => p.tags))];
const blogTags = [...new Set(SEED_BLOG_POSTS.flatMap((p) => p.tags))];

// Table specs in creation order (Projects precedes ProjectImages so the link
// resolves). Link fields are added AFTER both tables exist. "*Url" fields that
// hold same-origin asset paths (e.g. /seed/cover.png) are singleLineText; only
// genuinely external http(s) URLs use the url type. Image fields are TEXT, not
// attachments, because mappers.ts reads them with str().
const TABLE_SPECS = [
  {
    name: "Settings",
    fields: [
      txt("Name"),
      txt("BrandName"),
      txt("Tagline"),
      email("ContactEmail"),
      txt("Phone"),
      txt("WhatsappNumber"),
      long("WhatsappPrefillMessage"),
      url("LinkedinUrl"),
      url("WebsiteUrl"),
      long("AddressText"),
      txt("LogoLightUrl"),
      txt("LogoDarkUrl"),
      url("OgImageUrl"),
      txt("PrimaryCtaLabel"),
      txt("PrimaryCtaHref"),
    ],
  },
  {
    name: "Hero",
    fields: [
      txt("Name"),
      txt("Eyebrow"),
      txt("Headline"),
      long("Subheadline"),
      txt("PrimaryCtaLabel"),
      txt("PrimaryCtaHref"),
      txt("SecondaryCtaLabel"),
      txt("SecondaryCtaHref"),
      txt("ImageUrl"),
      txt("ImageAlt"),
    ],
  },
  {
    name: "About",
    fields: [
      txt("Name"),
      txt("Heading"),
      long("Body"),
      long("Points"),
      txt("ImageUrl"),
      txt("ImageAlt"),
    ],
  },
  {
    name: "Services",
    fields: [
      txt("Name"),
      long("Description"),
      txt("Icon"),
      select("Accent", ACCENTS),
      int("Order"),
      check("Visible"),
    ],
  },
  {
    name: "Projects",
    fields: [
      txt("Name"),
      txt("Slug"),
      long("Summary"),
      long("Body"),
      txt("CoverImageUrl"),
      txt("CoverImageAlt"),
      multi("Tags", projectTags),
      long("Metrics"),
      check("Featured"),
      int("Order"),
      check("Published"),
    ],
  },
  {
    name: "ProjectImages",
    fields: [txt("Name"), txt("ImageUrl"), txt("Alt"), int("Order")],
  },
  {
    name: "Industries",
    fields: [
      txt("Name"),
      long("Description"),
      txt("Icon"),
      select("Accent", ACCENTS),
      int("Order"),
      check("Visible"),
    ],
  },
  {
    name: "Stats",
    fields: [
      txt("Name"),
      int("Value"),
      txt("Prefix"),
      txt("Suffix"),
      txt("DisplayOverride"),
      int("Order"),
      check("Visible"),
    ],
  },
  {
    name: "Clients",
    fields: [
      txt("Name"),
      txt("LogoUrl"),
      txt("LogoAlt"),
      select("SectorGroup", SECTORS),
      url("WebsiteUrl"),
      int("Order"),
      check("Visible"),
    ],
  },
  {
    name: "Reviews",
    fields: [
      txt("Name"),
      long("Quote"),
      txt("Role"),
      txt("Company"),
      txt("AvatarUrl"),
      txt("AvatarAlt"),
      int("Rating"),
      int("Order"),
      check("Published"),
    ],
  },
  {
    name: "TeamMembers",
    fields: [
      txt("Name"),
      txt("Role"),
      long("Bio"),
      txt("PhotoUrl"),
      txt("PhotoAlt"),
      url("LinkedinUrl"),
      int("Order"),
      check("Visible"),
    ],
  },
  {
    name: "BlogPosts",
    fields: [
      txt("Title"),
      txt("Slug"),
      long("Excerpt"),
      long("Body"),
      txt("CoverImageUrl"),
      txt("CoverImageAlt"),
      txt("Author"),
      date("PublishDate"),
      check("Published"),
      multi("Tags", blogTags),
      txt("SeoTitle"),
      long("SeoDescription"),
    ],
  },
  {
    name: "CtaBand",
    fields: [
      txt("Name"),
      txt("Heading"),
      long("Subtext"),
      txt("PrimaryCtaLabel"),
      txt("PrimaryCtaHref"),
      txt("SecondaryCtaLabel"),
      txt("SecondaryCtaHref"),
    ],
  },
  {
    name: "NavLinks",
    fields: [
      txt("Name"),
      txt("Href"),
      int("Order"),
      check("Visible"),
      check("OpenInNewTab"),
    ],
  },
  {
    name: "ContactSubmissions",
    fields: [
      txt("Name"),
      email("Email"),
      txt("Company"),
      txt("Subject"),
      txt("Phone"),
      long("Message"),
      dateTime("SubmittedAt"),
      select("Status", STATUSES),
      txt("SourcePage"),
    ],
  },
];

// Link fields added after both tables exist (and the schema-expected inverse).
const EXPECTED_EXTRA_FIELDS = {
  Projects: [{ name: "Images", type: "multipleRecordLinks" }],
  ProjectImages: [{ name: "Project", type: "multipleRecordLinks" }],
};

const REQUIRED_TABLE_NAMES = TABLE_SPECS.map((t) => t.name);

// --- Logging (token-safe) ----------------------------------------------------
async function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  await appendFile(LOG, line);
  // Mirror to stdout too; harmless if the shell drops it.
  process.stdout.write(line);
}

// --- .env parsing ------------------------------------------------------------
function parseEnv(text) {
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    let key = line.slice(0, eq).trim();
    if (key.startsWith("export ")) key = key.slice(7).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

async function resolveCreds() {
  let apiKey = "";
  let baseId = "";
  let source = "";
  if (existsSync(ENV_LOCAL)) {
    const env = parseEnv(await readFile(ENV_LOCAL, "utf8"));
    if (env.AIRTABLE_API_KEY && env.AIRTABLE_API_KEY.trim()) {
      apiKey = env.AIRTABLE_API_KEY.trim();
      source = "datadive-web/.env.local";
    }
    if (env.AIRTABLE_BASE_ID && env.AIRTABLE_BASE_ID.trim()) {
      baseId = env.AIRTABLE_BASE_ID.trim();
    }
  }
  if (!apiKey && existsSync(LEADGEN_ENV)) {
    const env = parseEnv(await readFile(LEADGEN_ENV, "utf8"));
    if (env.AIRTABLE_API_KEY && env.AIRTABLE_API_KEY.trim()) {
      apiKey = env.AIRTABLE_API_KEY.trim();
      source = "datadive-leadgen/.env";
    }
  }
  // process.env wins if explicitly provided (CI / ad-hoc override).
  if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_API_KEY.trim()) {
    apiKey = process.env.AIRTABLE_API_KEY.trim();
    source = "process.env";
  }
  if (process.env.AIRTABLE_BASE_ID && process.env.AIRTABLE_BASE_ID.trim()) {
    baseId = process.env.AIRTABLE_BASE_ID.trim();
  }
  if (!baseId) baseId = TARGET_BASE_ID;
  return { apiKey, baseId, source };
}

// --- HTTP plumbing -----------------------------------------------------------
class ScopeError extends Error {
  constructor(scope, op, status, body) {
    super(`Missing Airtable scope '${scope}' for ${op} (HTTP ${status})`);
    this.scope = scope;
    this.op = op;
    this.status = status;
    this.body = body;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastReq = 0;
async function throttle() {
  const gap = 230 - (Date.now() - lastReq);
  if (gap > 0) await sleep(gap);
  lastReq = Date.now();
}

function makeRequester(apiKey) {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  return async function req(method, reqUrl, body, { scope, op } = {}) {
    for (let attempt = 0; attempt <= 3; attempt += 1) {
      await throttle();
      let res;
      try {
        res = await fetch(reqUrl, {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
        });
      } catch (err) {
        if (attempt < 3) {
          await sleep(500 * 2 ** attempt);
          continue;
        }
        throw new Error(`Network error on ${op}: ${String(err)}`);
      }
      if ((res.status === 429 || res.status >= 500) && attempt < 3) {
        await sleep(500 * 2 ** attempt);
        continue;
      }
      let data;
      try {
        data = await res.json();
      } catch {
        data = undefined;
      }
      if (res.status === 403) {
        throw new ScopeError(scope ?? "unknown", op ?? method, res.status, data);
      }
      return { status: res.status, ok: res.ok, data };
    }
    throw new Error(`Request retries exhausted on ${op}`);
  };
}

// --- Metadata + data helpers -------------------------------------------------
function makeApi(req, baseId) {
  const metaBase = `${API}/meta/bases/${baseId}`;
  return {
    async listTables() {
      const r = await req("GET", `${metaBase}/tables`, undefined, {
        scope: "schema.bases:read",
        op: "list tables",
      });
      if (!r.ok) throw new Error(`list tables failed: HTTP ${r.status} ${JSON.stringify(r.data)}`);
      return r.data.tables ?? [];
    },
    async createTable(name, fields) {
      const r = await req("POST", `${metaBase}/tables`, { name, fields }, {
        scope: "schema.bases:write",
        op: `create table ${name}`,
      });
      if (!r.ok) throw new Error(`create table ${name} failed: HTTP ${r.status} ${JSON.stringify(r.data)}`);
      return r.data;
    },
    async createField(tableId, field, tableName) {
      const r = await req("POST", `${metaBase}/tables/${tableId}/fields`, field, {
        scope: "schema.bases:write",
        op: `create field ${tableName}.${field.name}`,
      });
      if (!r.ok) throw new Error(`create field ${tableName}.${field.name} failed: HTTP ${r.status} ${JSON.stringify(r.data)}`);
      return r.data;
    },
    async renameField(tableId, fieldId, name, tableName) {
      const r = await req("PATCH", `${metaBase}/tables/${tableId}/fields/${fieldId}`, { name }, {
        scope: "schema.bases:write",
        op: `rename field on ${tableName} to ${name}`,
      });
      if (!r.ok) throw new Error(`rename field on ${tableName} failed: HTTP ${r.status} ${JSON.stringify(r.data)}`);
      return r.data;
    },
    async listRecords(tableName) {
      const out = [];
      let offset;
      do {
        const params = new URLSearchParams({ pageSize: "100" });
        if (offset) params.set("offset", offset);
        const r = await req(
          "GET",
          `${API}/${baseId}/${encodeURIComponent(tableName)}?${params}`,
          undefined,
          { scope: "data.records:read", op: `list records ${tableName}` },
        );
        if (r.status === 404) return null; // table does not exist
        if (!r.ok) throw new Error(`list records ${tableName} failed: HTTP ${r.status} ${JSON.stringify(r.data)}`);
        out.push(...(r.data.records ?? []));
        offset = r.data.offset;
      } while (offset);
      return out;
    },
    async createRecords(tableName, records) {
      const created = [];
      for (let i = 0; i < records.length; i += 10) {
        const chunk = records.slice(i, i + 10);
        const r = await req(
          "POST",
          `${API}/${baseId}/${encodeURIComponent(tableName)}`,
          { records: chunk.map((fields) => ({ fields })), typecast: true },
          { scope: "data.records:write", op: `seed ${tableName}` },
        );
        if (!r.ok) throw new Error(`seed ${tableName} failed: HTTP ${r.status} ${JSON.stringify(r.data)}`);
        created.push(...(r.data.records ?? []));
      }
      return created;
    },
  };
}

// --- Seed → Airtable field mapping ------------------------------------------
function clean(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.length === 0) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

const metricsToText = (metrics) =>
  (metrics ?? []).map((m) => `${m.value} | ${m.label}`).join("\n");

const settingsFields = (s) =>
  clean({
    Name: s.name,
    BrandName: s.brandName,
    Tagline: s.tagline,
    ContactEmail: s.contactEmail,
    Phone: s.phone,
    WhatsappNumber: WHATSAPP_PLACEHOLDER,
    WhatsappPrefillMessage: s.whatsappPrefillMessage,
    LinkedinUrl: s.linkedinUrl,
    WebsiteUrl: s.websiteUrl,
    AddressText: s.addressText,
    LogoLightUrl: s.logoLightUrl,
    LogoDarkUrl: s.logoDarkUrl,
    OgImageUrl: s.ogImageUrl,
    PrimaryCtaLabel: s.primaryCtaLabel,
    PrimaryCtaHref: s.primaryCtaHref,
  });

const heroFields = (h) =>
  clean({
    Name: h.name,
    Eyebrow: h.eyebrow,
    Headline: h.headline,
    Subheadline: h.subheadline,
    PrimaryCtaLabel: h.primaryCtaLabel,
    PrimaryCtaHref: h.primaryCtaHref,
    SecondaryCtaLabel: h.secondaryCtaLabel,
    SecondaryCtaHref: h.secondaryCtaHref,
    ImageUrl: h.image?.url,
    ImageAlt: h.image?.alt,
  });

const aboutFields = (a) =>
  clean({
    Name: a.name,
    Heading: a.heading,
    Body: a.body,
    Points: (a.points ?? []).join("\n"),
    ImageUrl: a.image?.url,
    ImageAlt: a.image?.alt,
  });

const ctaFields = (c) =>
  clean({
    Name: c.name,
    Heading: c.heading,
    Subtext: c.subtext,
    PrimaryCtaLabel: c.primaryCtaLabel,
    PrimaryCtaHref: c.primaryCtaHref,
    SecondaryCtaLabel: c.secondaryCtaLabel,
    SecondaryCtaHref: c.secondaryCtaHref,
  });

const serviceFields = (s) =>
  clean({
    Name: s.name,
    Description: s.description,
    Icon: s.icon,
    Accent: s.accent,
    Order: s.order,
    Visible: s.visible,
  });

const industryFields = serviceFields;

const statFields = (s) =>
  clean({
    Name: s.name,
    Value: s.value,
    Prefix: s.prefix,
    Suffix: s.suffix,
    DisplayOverride: s.displayOverride,
    Order: s.order,
    Visible: s.visible,
  });

const clientFields = (c) =>
  clean({
    Name: c.name,
    LogoUrl: c.logo?.url,
    LogoAlt: c.logo?.alt,
    SectorGroup: c.sectorGroup,
    WebsiteUrl: c.websiteUrl,
    Order: c.order,
    Visible: c.visible,
  });

const reviewFields = (r) =>
  clean({
    Name: r.name,
    Quote: r.quote,
    Role: r.role,
    Company: r.company,
    AvatarUrl: r.avatar?.url,
    AvatarAlt: r.avatar?.alt,
    Rating: r.rating,
    Order: r.order,
    Published: r.published,
  });

const teamFields = (t) =>
  clean({
    Name: t.name,
    Role: t.role,
    Bio: t.bio,
    PhotoUrl: t.photo?.url,
    PhotoAlt: t.photo?.alt,
    LinkedinUrl: t.linkedinUrl,
    Order: t.order,
    Visible: t.visible,
  });

const navFields = (n) =>
  clean({
    Name: n.name,
    Href: n.href,
    Order: n.order,
    Visible: n.visible,
    OpenInNewTab: n.openInNewTab,
  });

const blogFields = (b) =>
  clean({
    Title: b.title,
    Slug: b.slug,
    Excerpt: b.excerpt,
    Body: b.body,
    CoverImageUrl: b.cover?.url,
    CoverImageAlt: b.cover?.alt,
    Author: b.author,
    PublishDate: b.publishDate,
    Published: b.published,
    Tags: b.tags,
    SeoTitle: b.seoTitle,
    SeoDescription: b.seoDescription,
  });

const projectFields = (p) =>
  clean({
    Name: p.name,
    Slug: p.slug,
    Summary: p.summary,
    Body: p.body,
    CoverImageUrl: p.cover?.url,
    CoverImageAlt: p.cover?.alt,
    Tags: p.tags,
    Metrics: metricsToText(p.metrics),
    Featured: p.featured,
    Order: p.order,
    Published: p.published,
  });

const projectImageFields = (img, projectRecId) =>
  clean({
    Name: img.name,
    Project: [projectRecId],
    ImageUrl: img.url,
    Alt: img.alt,
    Order: img.order,
  });

// --- Main --------------------------------------------------------------------
async function main() {
  await mkdir(TASK_DIR, { recursive: true });
  await writeFile(LOG, `[${new Date().toISOString()}] Datadive Airtable provisioning started\n`);

  const summary = {
    startedAt: new Date().toISOString(),
    baseId: null,
    apiKeySource: null,
    whatsappPlaceholder: WHATSAPP_PLACEHOLDER,
    tables: [],
    link: null,
    seeded: [],
    verify: { tables: [], counts: {} },
    extraTables: [],
    missingScope: null,
    status: "incomplete",
  };

  const creds = await resolveCreds();
  summary.baseId = creds.baseId;
  summary.apiKeySource = creds.source || "not found";
  if (!creds.apiKey) {
    await log("ERROR: AIRTABLE_API_KEY not found in .env.local or datadive-leadgen/.env");
    summary.status = "failed-no-token";
    await writeFile(SUMMARY, JSON.stringify(summary, null, 2));
    process.exitCode = 1;
    return;
  }
  await log(`Credentials loaded (token from ${creds.source}; value hidden). Base ${creds.baseId}.`);
  if (creds.baseId !== TARGET_BASE_ID) {
    await log(`WARNING: resolved base ${creds.baseId} differs from expected ${TARGET_BASE_ID}; proceeding with resolved value.`);
  }

  const req = makeRequester(creds.apiKey);
  const at = makeApi(req, creds.baseId);

  try {
    // 1. Discover existing tables.
    const before = await at.listTables();
    const byName = new Map(before.map((t) => [t.name, t]));
    await log(`Existing tables (${before.length}): ${before.map((t) => t.name).join(", ") || "(none)"}`);

    // 2. Ensure the 15 required tables (create missing; add missing fields).
    for (const spec of TABLE_SPECS) {
      const existing = byName.get(spec.name);
      if (!existing) {
        const created = await at.createTable(spec.name, spec.fields);
        byName.set(spec.name, created);
        await log(`Created table ${spec.name} (${created.id}) with ${spec.fields.length} fields.`);
        summary.tables.push({ name: spec.name, status: "created", fieldCount: spec.fields.length, fieldsAdded: [], conflicts: [] });
        continue;
      }
      // Table exists: add any missing fields; report type conflicts.
      const existingFields = new Map((existing.fields ?? []).map((f) => [f.name, f]));
      const added = [];
      const conflicts = [];
      for (const field of spec.fields) {
        const cur = existingFields.get(field.name);
        if (!cur) {
          await at.createField(existing.id, field, spec.name);
          added.push(field.name);
          await log(`Added missing field ${spec.name}.${field.name} (${field.type}).`);
        } else if (cur.type !== field.type) {
          conflicts.push({ field: field.name, expected: field.type, actual: cur.type });
          await log(`CONFLICT: ${spec.name}.${field.name} is ${cur.type}, expected ${field.type} (left unchanged).`);
        }
      }
      await log(`Table ${spec.name} already existed; added ${added.length} field(s), ${conflicts.length} conflict(s).`);
      summary.tables.push({ name: spec.name, status: "preexisting", fieldsAdded: added, conflicts });
    }

    // 3. Projects <-> ProjectImages link (+ schema-expected "Images" inverse).
    const projectsTable = byName.get("Projects");
    const imagesTable = byName.get("ProjectImages");
    const linkResult = { created: false, inverseRenamedTo: null, note: null };
    if (projectsTable && imagesTable) {
      // Refresh ProjectImages to see whether the link already exists.
      let piFresh = (await at.listTables()).find((t) => t.id === imagesTable.id);
      const hasProjectLink = (piFresh.fields ?? []).some(
        (f) => f.name === "Project" && f.type === "multipleRecordLinks",
      );
      if (!hasProjectLink) {
        await at.createField(
          imagesTable.id,
          { name: "Project", type: "multipleRecordLinks", options: { linkedTableId: projectsTable.id } },
          "ProjectImages",
        );
        linkResult.created = true;
        await log("Created ProjectImages.Project link -> Projects.");
      } else {
        await log("ProjectImages.Project link already present.");
      }
      // Find the auto-created inverse on Projects; rename it to "Images".
      const projFresh = (await at.listTables()).find((t) => t.id === projectsTable.id);
      const hasImages = (projFresh.fields ?? []).some((f) => f.name === "Images");
      if (hasImages) {
        linkResult.inverseRenamedTo = "Images";
        linkResult.note = "Images field already present.";
        await log("Projects.Images link field already present.");
      } else {
        const inverse = (projFresh.fields ?? []).find(
          (f) => f.type === "multipleRecordLinks" && f.options?.linkedTableId === imagesTable.id,
        );
        if (inverse) {
          await at.renameField(projectsTable.id, inverse.id, "Images", "Projects");
          linkResult.inverseRenamedTo = "Images";
          await log(`Renamed Projects inverse link field '${inverse.name}' -> 'Images'.`);
        } else {
          linkResult.note = "Could not locate inverse link field on Projects.";
          await log("WARNING: inverse link field on Projects not found.");
        }
      }
    } else {
      linkResult.note = "Projects or ProjectImages table missing; link skipped.";
      await log("WARNING: Projects/ProjectImages missing; link step skipped.");
    }
    summary.link = linkResult;

    // 4. Seed. Singletons get exactly one record; lists get their seed count.
    //    Tables already holding records are left untouched (idempotent re-run).
    const slugToId = {};
    async function seed(tableName, records, { capture } = {}) {
      const existing = await at.listRecords(tableName);
      if (existing === null) {
        await log(`Skip seed ${tableName}: table does not exist.`);
        summary.seeded.push({ name: tableName, action: "skipped-missing-table", requested: records.length });
        return [];
      }
      if (existing.length > 0) {
        await log(`Skip seed ${tableName}: already has ${existing.length} record(s).`);
        summary.seeded.push({ name: tableName, action: "skipped-existing", requested: records.length, existingBefore: existing.length });
        if (capture) for (const rec of existing) capture(rec);
        return existing;
      }
      if (records.length === 0) {
        await log(`No seed records for ${tableName}.`);
        summary.seeded.push({ name: tableName, action: "none", requested: 0 });
        return [];
      }
      const created = await at.createRecords(tableName, records);
      await log(`Seeded ${tableName}: ${created.length} record(s).`);
      summary.seeded.push({ name: tableName, action: "seeded", requested: records.length, created: created.length });
      if (capture) for (const rec of created) capture(rec);
      return created;
    }

    await seed("Settings", [settingsFields(SEED_SETTINGS)]);
    await seed("Hero", [heroFields(SEED_HERO)]);
    await seed("About", [aboutFields(SEED_ABOUT)]);
    await seed("CtaBand", [ctaFields(SEED_CTA)]);
    await seed("Services", SEED_SERVICES.map(serviceFields));
    await seed("Industries", SEED_INDUSTRIES.map(industryFields));
    await seed("Stats", SEED_STATS.map(statFields));
    await seed("Clients", SEED_CLIENTS.map(clientFields));
    await seed("Reviews", SEED_REVIEWS.map(reviewFields));
    await seed("TeamMembers", SEED_TEAM.map(teamFields));
    await seed("NavLinks", SEED_NAV_LINKS.map(navFields));
    await seed("BlogPosts", SEED_BLOG_POSTS.map(blogFields));
    await seed("Projects", SEED_PROJECTS.map(projectFields), {
      capture: (rec) => {
        const slug = rec.fields?.Slug;
        if (slug) slugToId[slug] = rec.id;
      },
    });

    const imageRecords = [];
    for (const p of SEED_PROJECTS) {
      const parentId = slugToId[p.slug];
      if (!parentId) continue;
      for (const img of p.images ?? []) imageRecords.push(projectImageFields(img, parentId));
    }
    await seed("ProjectImages", imageRecords);
    // ContactSubmissions intentionally has no seed content (runtime inbox).
    await log("ContactSubmissions left empty by design (contact-form inbox).");
    summary.seeded.push({ name: "ContactSubmissions", action: "none-by-design", requested: 0 });

    // 5. Verify: re-list tables, check fields/types, read back counts.
    const after = await at.listTables();
    const afterByName = new Map(after.map((t) => [t.name, t]));
    for (const spec of TABLE_SPECS) {
      const t = afterByName.get(spec.name);
      if (!t) {
        summary.verify.tables.push({ name: spec.name, present: false });
        await log(`VERIFY: ${spec.name} MISSING.`);
        continue;
      }
      const expected = [...spec.fields, ...(EXPECTED_EXTRA_FIELDS[spec.name] ?? [])];
      const fieldByName = new Map((t.fields ?? []).map((f) => [f.name, f]));
      const missingFields = [];
      const typeMismatches = [];
      for (const ef of expected) {
        const cur = fieldByName.get(ef.name);
        if (!cur) missingFields.push(ef.name);
        else if (cur.type !== ef.type) typeMismatches.push({ field: ef.name, expected: ef.type, actual: cur.type });
      }
      summary.verify.tables.push({
        name: spec.name,
        present: true,
        fieldCount: (t.fields ?? []).length,
        expectedFieldCount: expected.length,
        missingFields,
        typeMismatches,
      });
      await log(`VERIFY: ${spec.name} present, ${(t.fields ?? []).length} fields, ${missingFields.length} missing, ${typeMismatches.length} type mismatch(es).`);
    }

    // Record any non-required tables (e.g. a default "Table 1").
    summary.extraTables = after
      .filter((t) => !REQUIRED_TABLE_NAMES.includes(t.name))
      .map((t) => t.name);
    if (summary.extraTables.length) {
      await log(`Non-required tables left in place: ${summary.extraTables.join(", ")}`);
    }

    for (const spec of TABLE_SPECS) {
      const recs = await at.listRecords(spec.name);
      const count = recs === null ? "missing" : recs.length;
      summary.verify.counts[spec.name] = count;
      await log(`COUNT ${spec.name}: ${count}`);
    }

    summary.status = "complete";
    summary.finishedAt = new Date().toISOString();
    await writeFile(SUMMARY, JSON.stringify(summary, null, 2));
    await log("PROVISION-COMPLETE");
  } catch (err) {
    if (err instanceof ScopeError) {
      summary.missingScope = { scope: err.scope, op: err.op, status: err.status, errorType: err.body?.error?.type ?? null };
      summary.status = "stopped-missing-scope";
      await log(`STOP: missing scope '${err.scope}' needed for '${err.op}' (HTTP ${err.status}). Add this scope to the PAT and re-run.`);
    } else {
      summary.status = "error";
      summary.error = String(err?.message ?? err);
      await log(`ERROR: ${String(err?.message ?? err)}`);
    }
    await writeFile(SUMMARY, JSON.stringify(summary, null, 2));
    await log("PROVISION-FAILED");
    process.exitCode = 1;
  }
}

main().catch(async (err) => {
  try {
    await log(`FATAL: ${String(err?.stack ?? err)}`);
  } catch {
    /* ignore */
  }
  process.exitCode = 1;
});
