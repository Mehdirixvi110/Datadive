/**
 * Seed / sample fallback data (design §8). One typed constant per content type,
 * using the same domain models the DAL returns. Derived from `source-notes.md`
 * where real copy exists (brand, tagline, mission, 4 services, 5 industries,
 * 9 case studies, 5 stats, team, contact) and CLEARLY-LABELED placeholders
 * where the source is silent (reviews, blog, clients, WhatsApp number).
 *
 * Pure module: NO network, NO secrets, importable anywhere. Image fields point
 * to committed raster PNGs under public/seed/ or public/brand/ (same-origin
 * root-relative paths, valid under the §13 image rule — never SVG, §8/F2).
 */
import type {
  About,
  BlogPost,
  Client,
  Cta,
  Hero,
  Industry,
  NavLink,
  Project,
  Review,
  Service,
  Settings,
  Stat,
  TeamMember,
} from "@/lib/types";

const SEED_COVER = "/seed/cover.png";
const SEED_PROJECT = "/seed/project.png";
const SEED_AVATAR = "/seed/avatar.png";
const SEED_LOGO = "/seed/logo.png";

export const SEED_SETTINGS: Settings = {
  id: "seed-settings",
  name: "Site Settings",
  brandName: "Datadive",
  tagline: "Diving Into Data, Driving Decisions",
  contactEmail: "datadive.analytics@gmail.com",
  phone: "",
  // Clearly-labeled PLACEHOLDER number (§8). An operator replaces it in admin;
  // if they clear it, the WhatsApp button hides rather than linking wrongly.
  whatsappNumber: "10000000000",
  whatsappPrefillMessage: "Hi Datadive — I'd like to talk about a data project.",
  linkedinUrl: "https://www.linkedin.com/company/data-dive-analystics/",
  websiteUrl: "https://www.datadiveanalytics.com",
  addressText: "",
  logoLightUrl: "/brand/datadive-logo-color.png",
  logoDarkUrl: "/brand/datadive-logo-white.png",
  ogImageUrl: "",
  primaryCtaLabel: "Start a project",
  primaryCtaHref: "#contact",
};

export const SEED_HERO: Hero = {
  id: "seed-hero",
  name: "Hero",
  eyebrow: "Data Analytics Services",
  headline: "Diving Into Data, Driving Decisions",
  subheadline:
    "We transform raw numbers into clear, actionable insights that drive smarter decisions — through dashboards, business intelligence, and AI.",
  primaryCtaLabel: "Start a project",
  primaryCtaHref: "#contact",
  secondaryCtaLabel: "See our work",
  secondaryCtaHref: "#work",
  image: {
    url: SEED_COVER,
    alt: "Datadive analytics dashboard preview (placeholder image)",
  },
};

export const SEED_ABOUT: About = {
  id: "seed-about",
  name: "About",
  heading: "Where Data Meets Clarity",
  body: "At Datadive, we help organizations unlock the true potential of their data. Our mission is simple yet powerful: to transform raw numbers into clear, actionable insights that drive smarter decisions.\n\nWe specialize in data visualization, business intelligence, predictive analytics, and dashboard development, creating tailored solutions that give businesses a deeper understanding of their performance. Every dataset has a story, and our job is to help you dive deep and discover it.",
  points: [
    "Interactive dashboards and intuitive reports",
    "Business intelligence strategy and tooling",
    "Predictive analytics and AI-driven insight",
    "Expertise across healthcare, retail, tech, and non-profits",
  ],
  image: {
    url: SEED_COVER,
    alt: "The Datadive team collaborating on analytics (placeholder image)",
  },
};

export const SEED_CTA: Cta = {
  id: "seed-cta",
  name: "CTA Band",
  heading: "Let's Dive Into Data Together",
  subtext:
    "Partner with Datadive to turn raw data into clarity and confidence. Reach out today — let's explore how data can drive your next success.",
  primaryCtaLabel: "Start a project",
  primaryCtaHref: "#contact",
  secondaryCtaLabel: "Message us",
  secondaryCtaHref: "#contact",
};

export const SEED_NAV_LINKS: NavLink[] = [
  { id: "seed-nav-1", name: "Home", href: "/", order: 0, visible: true, openInNewTab: false },
  { id: "seed-nav-2", name: "About", href: "#about", order: 1, visible: true, openInNewTab: false },
  { id: "seed-nav-3", name: "Services", href: "#services", order: 2, visible: true, openInNewTab: false },
  { id: "seed-nav-4", name: "Work", href: "#work", order: 3, visible: true, openInNewTab: false },
  { id: "seed-nav-5", name: "Clients", href: "#clients", order: 4, visible: true, openInNewTab: false },
  { id: "seed-nav-6", name: "Team", href: "#team", order: 5, visible: true, openInNewTab: false },
  { id: "seed-nav-7", name: "Blog", href: "/blog", order: 6, visible: true, openInNewTab: false },
  { id: "seed-nav-8", name: "Contact", href: "#contact", order: 7, visible: true, openInNewTab: false },
];

export const SEED_SERVICES: Service[] = [
  {
    id: "seed-service-1",
    name: "Dashboard Development & Data Visualization",
    description:
      "Transform raw data into intuitive, interactive dashboards that empower smarter decision-making.",
    icon: "dashboard",
    accent: "blue",
    order: 0,
    visible: true,
  },
  {
    id: "seed-service-2",
    name: "Business Intelligence Consulting",
    description:
      "Set up BI strategies, tools, and workflows that unlock data-driven growth across the organization.",
    icon: "bi",
    accent: "amber",
    order: 1,
    visible: true,
  },
  {
    id: "seed-service-3",
    name: "Predictive Analytics & AI Solutions",
    description:
      "Leverage machine-learning models to forecast trends and uncover hidden business opportunities.",
    icon: "ai",
    accent: "green",
    order: 2,
    visible: true,
  },
  {
    id: "seed-service-4",
    name: "Custom Data Solutions",
    description:
      "From ETL pipelines to automated reporting, we build solutions tailored to your business needs.",
    icon: "custom",
    accent: "red",
    order: 3,
    visible: true,
  },
];

export const SEED_INDUSTRIES: Industry[] = [
  {
    id: "seed-industry-1",
    name: "Human Resources",
    description: "Employee performance, retention, and workforce planning.",
    icon: "hr",
    accent: "blue",
    order: 0,
    visible: true,
  },
  {
    id: "seed-industry-2",
    name: "Healthcare & NGOs",
    description: "Data management, financial monitoring, and campaign tracking.",
    icon: "health",
    accent: "green",
    order: 1,
    visible: true,
  },
  {
    id: "seed-industry-3",
    name: "Retail & Sales",
    description: "Market insights, sales performance, and predictive analysis.",
    icon: "retail",
    accent: "amber",
    order: 2,
    visible: true,
  },
  {
    id: "seed-industry-4",
    name: "Corporate Operations",
    description: "Procurement, complaints management, and performance tracking.",
    icon: "ops",
    accent: "red",
    order: 3,
    visible: true,
  },
  {
    id: "seed-industry-5",
    name: "AI & Machine Learning",
    description: "Predictive models and custom applications for smarter decisions.",
    icon: "ml",
    accent: "blue",
    order: 4,
    visible: true,
  },
];

export const SEED_STATS: Stat[] = [
  { id: "seed-stat-1", name: "Records cleaned", value: 150, prefix: "", suffix: "K+", displayOverride: "", order: 0, visible: true },
  { id: "seed-stat-2", name: "Records unified", value: 100, prefix: "", suffix: "K+", displayOverride: "", order: 1, visible: true },
  { id: "seed-stat-3", name: "Model accuracy", value: 85, prefix: "", suffix: "%", displayOverride: "", order: 2, visible: true },
  { id: "seed-stat-4", name: "Countries reached", value: 42, prefix: "", suffix: "+", displayOverride: "", order: 3, visible: true },
  { id: "seed-stat-5", name: "Staff trained", value: 30, prefix: "", suffix: "+", displayOverride: "", order: 4, visible: true },
];

export const SEED_PROJECTS: Project[] = [
  {
    id: "seed-project-1",
    name: "HR Analytics Dashboard",
    slug: "hr-analytics-dashboard",
    summary:
      "Power BI drill-down dashboards plus a Random Forest attrition model served through a Streamlit app.",
    body: "## HR Analytics Dashboard\n\nInspired by the IBM workforce dataset, this project pairs interactive Power BI drill-down dashboards with a Random Forest attrition-prediction model in Python, served via a Streamlit app.\n\n- Workforce performance and retention views\n- Attrition prediction with explainable drivers\n- Self-serve exploration for HR leaders",
    cover: { url: SEED_PROJECT, alt: "HR analytics dashboard preview (placeholder)" },
    images: [
      {
        id: "seed-projimg-1",
        name: "HR dashboard overview",
        url: SEED_PROJECT,
        alt: "HR dashboard overview (placeholder)",
        order: 0,
      },
    ],
    tags: ["HR", "Power BI", "Machine Learning"],
    metrics: [
      { value: "Random Forest", label: "attrition model" },
      { value: "Streamlit", label: "self-serve app" },
    ],
    featured: true,
    order: 0,
    published: true,
    hasDetail: true,
  },
  {
    id: "seed-project-2",
    name: "National Health Data & Service Delivery Dashboards",
    slug: "national-health-data-dashboards",
    summary:
      "Cleaned 150K+ health records and delivered four automated Power BI dashboards for a UN-affiliated initiative.",
    body: "## National Health Data & Service Delivery\n\nFor a UN-affiliated health initiative in Pakistan, we cleaned and standardized 150K+ health records, resolved 200+ data-quality issues, and shipped four automated Power BI dashboards — then trained 30+ staff to run them.",
    cover: { url: SEED_PROJECT, alt: "National health dashboards preview (placeholder)" },
    images: [],
    tags: ["Healthcare", "NGO", "Power BI"],
    metrics: [
      { value: "150K+", label: "health records cleaned" },
      { value: "200+", label: "data-quality issues resolved" },
      { value: "4", label: "automated dashboards" },
      { value: "30+", label: "staff trained" },
    ],
    featured: true,
    order: 1,
    published: true,
    hasDetail: true,
  },
  {
    id: "seed-project-3",
    name: "Surge & Financial Management Dashboard",
    slug: "surge-financial-management-dashboard",
    summary:
      "Integrated HR and financial data across 42+ countries with a DAX star-rating performance system.",
    body: "## Surge & Financial Management\n\nA global health project spanning 42+ African countries. We integrated HR and financial data, eliminated 100+ discrepancies, and built a star-rating performance system in DAX with natural-language Q&A.",
    cover: { url: SEED_PROJECT, alt: "Surge and financial management dashboard preview (placeholder)" },
    images: [],
    tags: ["NGO", "Finance", "Power BI"],
    metrics: [
      { value: "42+", label: "countries" },
      { value: "100+", label: "discrepancies eliminated" },
    ],
    featured: true,
    order: 2,
    published: true,
    hasDetail: true,
  },
  {
    id: "seed-project-4",
    name: "Procurement Analytics Dashboard",
    slug: "procurement-analytics-dashboard",
    summary:
      "Consolidated 100K+ purchase, vendor, and invoice records into a unified Power BI star schema.",
    body: "## Procurement Analytics\n\nWe consolidated 100K+ purchase, vendor, and invoice records into a unified Power BI star schema — surfacing PO aging, spend, vendor performance, and anomaly detection in one place.",
    cover: { url: SEED_PROJECT, alt: "Procurement analytics dashboard preview (placeholder)" },
    images: [],
    tags: ["Procurement", "Operations", "Power BI"],
    metrics: [
      { value: "100K+", label: "records consolidated" },
      { value: "1", label: "unified star schema" },
    ],
    featured: false,
    order: 3,
    published: true,
    hasDetail: true,
  },
  {
    id: "seed-project-5",
    name: "US Merchant Sales Dashboard",
    slug: "us-merchant-sales-dashboard",
    summary:
      "Retail sales analytics with a reusable star-schema model, YoY growth measures, and dynamic KPIs.",
    body: "## US Merchant Sales\n\nRetail sales analytics built on a star-schema model with year-over-year growth measures and dynamic KPIs — delivered as a reusable, scalable dashboard template.",
    cover: { url: SEED_PROJECT, alt: "US merchant sales dashboard preview (placeholder)" },
    images: [],
    tags: ["Retail", "Sales", "Power BI"],
    metrics: [
      { value: "YoY", label: "growth measures" },
      { value: "Reusable", label: "dashboard template" },
    ],
    featured: false,
    order: 4,
    published: true,
    hasDetail: true,
  },
  // "Other" case studies: published card-only entries (empty Body → no detail
  // page), exercising the hasDetail=false path (§5.5).
  {
    id: "seed-project-6",
    name: "Complaint Management Dashboard",
    slug: "complaint-management-dashboard",
    summary:
      "5,000+ complaints across 12 categories with SLA tracking; reduced unresolved backlog by 30%.",
    body: "",
    cover: { url: SEED_PROJECT, alt: "Complaint management dashboard preview (placeholder)" },
    images: [],
    tags: ["Operations", "Consumer"],
    metrics: [
      { value: "5,000+", label: "complaints tracked" },
      { value: "30%", label: "backlog reduction" },
    ],
    featured: false,
    order: 5,
    published: true,
    hasDetail: false,
  },
  {
    id: "seed-project-7",
    name: "Employee Performance Dashboard",
    slug: "employee-performance-dashboard",
    summary: "200+ KPIs across 8 departments in a single corporate performance view.",
    body: "",
    cover: { url: SEED_PROJECT, alt: "Employee performance dashboard preview (placeholder)" },
    images: [],
    tags: ["HR", "Corporate"],
    metrics: [
      { value: "200+", label: "KPIs" },
      { value: "8", label: "departments" },
    ],
    featured: false,
    order: 6,
    published: true,
    hasDetail: false,
  },
  {
    id: "seed-project-8",
    name: "Employee Churn Prediction App",
    slug: "employee-churn-prediction-app",
    summary:
      "Streamlit + Random Forest (85% accuracy) on 1,500+ employees; ~15% simulated turnover-risk reduction.",
    body: "",
    cover: { url: SEED_PROJECT, alt: "Employee churn prediction app preview (placeholder)" },
    images: [],
    tags: ["Machine Learning", "HR"],
    metrics: [
      { value: "85%", label: "model accuracy" },
      { value: "1,500+", label: "employees analyzed" },
    ],
    featured: false,
    order: 7,
    published: true,
    hasDetail: false,
  },
  {
    id: "seed-project-9",
    name: "Performance Reporting Template",
    slug: "performance-reporting-template",
    summary:
      "50+ KPIs across finance, sales, and HR; saves 20+ hours per reporting cycle.",
    body: "",
    cover: { url: SEED_PROJECT, alt: "Performance reporting template preview (placeholder)" },
    images: [],
    tags: ["Finance", "Cross-industry"],
    metrics: [
      { value: "50+", label: "KPIs" },
      { value: "20+ hrs", label: "saved per cycle" },
    ],
    featured: false,
    order: 8,
    published: true,
    hasDetail: false,
  },
];

export const SEED_CLIENTS: Client[] = [
  {
    id: "seed-client-1",
    name: "Global Health Initiative (sample)",
    logo: { url: SEED_LOGO, alt: "Global Health Initiative logo (placeholder)" },
    sectorGroup: "International & Development",
    websiteUrl: "",
    order: 0,
    visible: true,
  },
  {
    id: "seed-client-2",
    name: "Development Partners Network (sample)",
    logo: null,
    sectorGroup: "International & Development",
    websiteUrl: "",
    order: 1,
    visible: true,
  },
  {
    id: "seed-client-3",
    name: "Northwind Technologies (sample)",
    logo: { url: SEED_LOGO, alt: "Northwind Technologies logo (placeholder)" },
    sectorGroup: "Corporate & Technology",
    websiteUrl: "",
    order: 2,
    visible: true,
  },
  {
    id: "seed-client-4",
    name: "Contoso Retail Group (sample)",
    logo: null,
    sectorGroup: "Corporate & Technology",
    websiteUrl: "",
    order: 3,
    visible: true,
  },
  {
    id: "seed-client-5",
    name: "Independent Study: Workforce Attrition (sample)",
    logo: { url: SEED_LOGO, alt: "Independent case study logo (placeholder)" },
    sectorGroup: "Independent Case Studies",
    websiteUrl: "",
    order: 4,
    visible: true,
  },
  {
    id: "seed-client-6",
    name: "Independent Study: Retail Forecasting (sample)",
    logo: null,
    sectorGroup: "Independent Case Studies",
    websiteUrl: "",
    order: 5,
    visible: true,
  },
];

export const SEED_REVIEWS: Review[] = [
  {
    id: "seed-review-1",
    name: "Sample Client (placeholder)",
    quote:
      "Datadive turned a tangle of spreadsheets into dashboards our whole team actually uses. Decisions are faster and better informed.",
    role: "Operations Director",
    company: "Sample Organization",
    avatar: { url: SEED_AVATAR, alt: "Placeholder reviewer avatar" },
    rating: 5,
    order: 0,
    published: true,
  },
  {
    id: "seed-review-2",
    name: "Sample Client (placeholder)",
    quote:
      "The predictive model gave us early warning on attrition we never had before. Clear, practical, and well explained.",
    role: "Head of People",
    company: "Sample Company",
    avatar: { url: SEED_AVATAR, alt: "Placeholder reviewer avatar" },
    rating: 5,
    order: 1,
    published: true,
  },
  {
    id: "seed-review-3",
    name: "Sample Client (placeholder)",
    quote:
      "Reliable delivery and genuinely useful insight. Datadive feels like an extension of our own analytics team.",
    role: "Program Manager",
    company: "Sample NGO",
    avatar: null,
    rating: 4,
    order: 2,
    published: true,
  },
];

export const SEED_TEAM: TeamMember[] = [
  {
    id: "seed-team-1",
    name: "Mehdi Abbas",
    role: "Founder & Lead Data Analyst",
    bio: "Leads Datadive's analytics practice, turning complex data into clear decisions for clients worldwide.",
    photo: { url: SEED_AVATAR, alt: "Portrait of Mehdi Abbas (placeholder)" },
    linkedinUrl: "",
    order: 0,
    visible: true,
  },
  {
    id: "seed-team-2",
    name: "Syed Ali Wazir Tufail",
    role: "Creative Design & Visualization Expert",
    bio: "Designs the dashboards and visual stories that make Datadive's analytics intuitive and engaging.",
    photo: { url: SEED_AVATAR, alt: "Portrait of Syed Ali Wazir Tufail (placeholder)" },
    linkedinUrl: "",
    order: 1,
    visible: true,
  },
  {
    id: "seed-team-3",
    // Placeholder NAME (confirm with client); the ROLE is known from source.
    name: "Team Member (name to be confirmed)",
    role: "Full-Stack & DevOps Engineer",
    bio: "Builds and operates the pipelines, apps, and infrastructure behind Datadive's solutions.",
    photo: { url: SEED_AVATAR, alt: "Placeholder team member portrait" },
    linkedinUrl: "",
    order: 2,
    visible: true,
  },
];

export const SEED_BLOG_POSTS: BlogPost[] = [
  {
    id: "seed-blog-1",
    title: "Five Signs Your Dashboards Are Working Against You",
    slug: "five-signs-your-dashboards-are-working-against-you",
    excerpt:
      "A placeholder post: common anti-patterns that quietly erode trust in your analytics — and how to fix them.",
    body: "## Dashboards that fight you\n\n_This is a clearly-labeled placeholder post._\n\nGreat dashboards answer a question before you ask it. Here are five signs yours are getting in the way, and practical fixes for each.",
    cover: { url: SEED_COVER, alt: "Abstract dashboard illustration (placeholder)" },
    author: "Datadive",
    publishDate: "2024-01-15",
    published: true,
    tags: ["Dashboards", "Best Practices"],
    seoTitle: "",
    seoDescription: "",
  },
  {
    id: "seed-blog-2",
    title: "From Raw Data to Decisions: A Practical ETL Checklist",
    slug: "from-raw-data-to-decisions-a-practical-etl-checklist",
    excerpt:
      "A placeholder post: a field-tested checklist for turning messy source data into something you can trust.",
    body: "## A practical ETL checklist\n\n_This is a clearly-labeled placeholder post._\n\nClean inputs make clean decisions. Walk through the extract, transform, and load checkpoints we use on every engagement.",
    cover: { url: SEED_COVER, alt: "Data pipeline illustration (placeholder)" },
    author: "Datadive",
    publishDate: "2024-02-02",
    published: true,
    tags: ["ETL", "Data Quality"],
    seoTitle: "",
    seoDescription: "",
  },
];
