import type { Metadata } from "next";
import {
  Hero,
  About,
  Services,
  Industries,
  Work,
  Stats,
  Clients,
  Reviews,
  Team,
  Cta,
  Contact,
} from "@/components/sections";
import {
  getSettings,
  getHero,
  getAbout,
  getServices,
  getIndustries,
  getProjects,
  getStats,
  getClients,
  getReviews,
  getTeam,
  getCta,
} from "@/lib/airtable/read";
import { buildOpenGraph, ogImageUrl, resolveSiteUrl } from "@/lib/seo";

/**
 * Home (`/`) — one page composed of RSC sections in the design §11 order
 * (Hero → About → Services → Industries → Work → Stats → Clients → Reviews →
 * Team → Cta → Contact). Every section reads already-typed data from the DAL;
 * public reads are tagged + cached inside the DAL. ISR revalidates hourly.
 */
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const base = resolveSiteUrl();
  const title = "Datadive — Diving Into Data, Driving Decisions";
  const description =
    settings.tagline ||
    "Datadive turns messy data into clear decisions — dashboards, BI, AI, and custom analytics.";

  return {
    alternates: { canonical: "/" },
    openGraph: buildOpenGraph({
      title,
      description,
      url: new URL("/", base).toString(),
      image: ogImageUrl(settings),
    }),
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl(settings)],
    },
  };
}

export default async function HomePage() {
  const [
    hero,
    about,
    services,
    industries,
    projects,
    stats,
    clients,
    reviews,
    team,
    cta,
    settings,
  ] = await Promise.all([
    getHero(),
    getAbout(),
    getServices(),
    getIndustries(),
    getProjects(),
    getStats(),
    getClients(),
    getReviews(),
    getTeam(),
    getCta(),
    getSettings(),
  ]);

  return (
    <>
      <Hero hero={hero} />
      <About about={about} />
      <Services services={services} />
      <Industries industries={industries} />
      <Work projects={projects} />
      <Stats stats={stats} />
      <Clients clients={clients} />
      <Reviews reviews={reviews} />
      <Team team={team} />
      <Cta cta={cta} />
      <Contact settings={settings} />
    </>
  );
}
