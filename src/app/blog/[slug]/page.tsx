import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Container, Badge } from "@/components/ui";
import { Markdown } from "@/components/blog/Markdown";
import { formatDate } from "@/lib/utils/date";
import {
  getBlogPost,
  getPublishedPostSlugs,
  getSettings,
} from "@/lib/airtable/read";
import { buildOpenGraph, ogImageUrl, resolveSiteUrl } from "@/lib/seo";

/**
 * Blog post (design §11/§17, FR-11). Prebuilt from `getPublishedPostSlugs()`
 * with `dynamicParams=true` so new posts render on demand; an unknown or draft
 * slug `notFound()`s. Per-post SEO/OG + canonical; Markdown is sanitized.
 */
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getPublishedPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Post not found" };

  const settings = await getSettings();
  const base = resolveSiteUrl();
  const url = new URL(`/blog/${post.slug}`, base).toString();
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  // Per-post OG uses the cover when present, else the single-source brand OG.
  const image = post.cover?.url || ogImageUrl(settings);

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: buildOpenGraph({
      title: `${title} | Datadive`,
      description,
      url,
      image,
      type: "article",
    }),
    twitter: {
      card: "summary_large_image",
      title: `${title} | Datadive`,
      description,
      images: [image],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  return (
    <article className="py-20">
      <Container className="max-w-3xl">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 rounded text-small text-muted transition-colors hover:text-text"
        >
          <ArrowRight aria-hidden="true" className="h-4 w-4 rotate-180" />
          Back to blog
        </Link>

        <header className="mt-6 flex flex-col gap-4">
          {post.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} tone="brand">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
          <h1 className="font-display text-display-3 font-bold text-text">
            {post.title}
          </h1>
          <p className="text-small text-muted">
            {post.author ? `${post.author} · ` : ""}
            {formatDate(post.publishDate)}
          </p>
        </header>

        {post.cover ? (
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface">
            <Image
              src={post.cover.url}
              alt={post.cover.alt}
              width={1200}
              height={675}
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="h-auto w-full"
            />
          </div>
        ) : null}

        <div className="mt-10">
          <Markdown content={post.body} />
        </div>
      </Container>
    </article>
  );
}
