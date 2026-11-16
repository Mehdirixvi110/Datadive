import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Section, SectionHeading, Card, Badge } from "@/components/ui";
import { Reveal } from "@/components/motion";
import type { Project } from "@/lib/types";

/**
 * Work / case studies (design §11, F6). A card grid of every published project
 * that becomes a scroll-snap carousel on mobile. A card links to
 * `/work/[slug]` ONLY when `hasDetail` (Published && Body non-empty); a
 * published project with no body renders as a non-linked card, so no Work card
 * ever links to a 404.
 */
function ProjectBody({ project }: { project: Project }) {
  return (
    <>
      {project.cover ? (
        <div className="aspect-[16/10] overflow-hidden rounded-lg border border-border bg-surface">
          <Image
            src={project.cover.url}
            alt={project.cover.alt}
            width={800}
            height={500}
            sizes="(max-width: 768px) 85vw, 380px"
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      <div className="mt-4 flex items-start justify-between gap-3">
        <h3 className="font-display text-h4 font-semibold text-text">
          {project.name}
        </h3>
        {project.hasDetail ? (
          <ArrowUpRight
            aria-hidden="true"
            className="mt-1 h-5 w-5 shrink-0 text-brand-300"
          />
        ) : null}
      </div>

      {project.summary ? (
        <p className="mt-2 text-body text-muted">{project.summary}</p>
      ) : null}

      {project.metrics.length > 0 ? (
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {project.metrics.slice(0, 4).map((m, i) => (
            <div key={i} className="flex flex-col">
              {m.value ? (
                <dt className="font-mono text-h4 font-semibold text-depth">
                  {m.value}
                </dt>
              ) : null}
              <dd className="text-small text-muted">{m.label}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {project.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {project.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} tone="neutral">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
    </>
  );
}

export function Work({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;

  return (
    <Section id="work">
      <SectionHeading
        eyebrow="Our work"
        title="Case studies & dashboards"
        subtitle="A selection of analytics work — dashboards, data pipelines, and predictive models."
      />

      <div className="mt-14 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-3">
        {projects.map((project, i) => (
          <Reveal
            key={project.id}
            delay={(i % 3) * 80}
            className="w-[85%] shrink-0 snap-start md:w-auto"
          >
            {project.hasDetail ? (
              <Link
                href={`/work/${project.slug}`}
                className="block h-full rounded-xl"
                aria-label={`Read the ${project.name} case study`}
              >
                <Card interactive className="h-full">
                  <ProjectBody project={project} />
                </Card>
              </Link>
            ) : (
              <Card className="h-full">
                <ProjectBody project={project} />
              </Card>
            )}
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
