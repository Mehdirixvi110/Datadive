import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/motion";
import { PostCard } from "@/components/blog/PostCard";
import { getBlogPosts, getSettings } from "@/lib/airtable/read";
import { buildOpenGraph, ogImageUrl, resolveSiteUrl } from "@/lib/seo";

/**
 * Blog index (design §11, FR-10). Published posts in reverse-chronological
 * order (the DAL already filters + sorts). Empty-state safe.
 */
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const base = resolveSiteUrl();
  const title = "Blog";
  const description = "Insights on analytics, dashboards, BI, and data strategy from Datadive.";

  return {
    title,
    description,
    alternates: { canonical: "/blog" },
    openGraph: buildOpenGraph({
      title: `${title} | Datadive`,
      description,
      url: new URL("/blog", base).toString(),
      image: ogImageUrl(settings),
    }),
    twitter: {
      card: "summary_large_image",
      title: `${title} | Datadive`,
      description,
      images: [ogImageUrl(settings)],
    },
  };
}

export default async function BlogIndexPage() {
  const posts = await getBlogPosts();

  return (
    <Section>
      <SectionHeading
        eyebrow="Blog"
        title="Notes on data & decisions"
        subtitle="Practical takes on analytics, dashboards, and turning raw data into decisions."
      />

      {posts.length === 0 ? (
        <p className="mt-14 text-center text-body text-muted">
          No posts published yet. Check back soon.
        </p>
      ) : (
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <Reveal key={post.id} delay={(i % 3) * 80}>
              <PostCard post={post} />
            </Reveal>
          ))}
        </div>
      )}
    </Section>
  );
}
