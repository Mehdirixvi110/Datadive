import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Container, Badge } from "@/components/ui";
import { Markdown } from "@/components/blog/Markdown";
import {
  getProject,
  getProjectDetailSlugs,
  getSettings,
} from "@/lib/airtable/read";
import { buildOpenGraph, ogImageUrl, resolveSiteUrl } from "@/lib/seo";

/**
 * Project detail (design §11, F6/F8). Prebuilt only for `hasDetail` projects
 * (Published && Body non-empty) via `getProjectDetailSlugs()`. `getProject`
 * returns null for a draft (no leak); a published-but-bodyless slug then hits
 * the empty-Body `notFound()` branch — so both 404 under `dynamicParams=true`.
 */
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getProjectDetailSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project || project.body.trim().length === 0) {
    return { title: "Case study not found" };
  }

  const settings = await getSettings();
  const base = resolveSiteUrl();
  const url = new URL(`/work/${project.slug}`, base).toString();
  const title = project.name;
  const description = project.summary;
  const image = project.cover?.url || ogImageUrl(settings);

  return {
    title,
    description,
    alternates: { canonical: `/work/${project.slug}` },
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

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);
  // Draft → getProject returns null; published-but-bodyless → 404 here (F6/F8).
  if (!project || project.body.trim().length === 0) notFound();

  return (
    <article className="py-20">
      <Container className="max-w-3xl">
        <Link
          href="/#work"
          className="inline-flex items-center gap-1 rounded text-small text-muted transition-colors hover:text-text"
        >
          <ArrowRight aria-hidden="true" className="h-4 w-4 rotate-180" />
          Back to work
        </Link>

        <header className="mt-6 flex flex-col gap-4">
          <h1 className="font-display text-display-3 font-bold text-text">
            {project.name}
          </h1>
          {project.summary ? (
            <p className="text-body text-muted">{project.summary}</p>
          ) : null}
          {project.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <Badge key={tag} tone="neutral">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </header>

        {project.cover ? (
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface">
            <Image
              src={project.cover.url}
              alt={project.cover.alt}
              width={1200}
              height={750}
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="h-auto w-full"
            />
          </div>
        ) : null}

        {project.metrics.length > 0 ? (
          <dl className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {project.metrics.map((m, i) => (
              <div key={i} className="flex flex-col gap-1">
                {m.value ? (
                  <dt className="font-mono text-h3 font-semibold text-depth">
                    {m.value}
                  </dt>
                ) : null}
                <dd className="text-small text-muted">{m.label}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="mt-10">
          <Markdown content={project.body} />
        </div>

        {project.images.length > 0 ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {project.images.map((img) => (
              <div
                key={img.id}
                className="overflow-hidden rounded-xl border border-border bg-surface"
              >
                <Image
                  src={img.url}
                  alt={img.alt}
                  width={800}
                  height={500}
                  sizes="(max-width: 640px) 100vw, 400px"
                  className="h-auto w-full"
                />
              </div>
            ))}
          </div>
        ) : null}
      </Container>
    </article>
  );
}
