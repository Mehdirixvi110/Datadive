import Image from "next/image";
import { Check } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/motion";
import { Markdown } from "@/components/blog/Markdown";
import type { About as AboutModel } from "@/lib/types";

/**
 * About (design §11). Heading + sanitized-Markdown body + bullet points, with
 * an optional image. All copy flows from the DAL/seed.
 */
export function About({ about }: { about: AboutModel }) {
  return (
    <Section id="about" surface>
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal className="flex flex-col gap-6">
          <SectionHeading
            align="left"
            eyebrow="About Datadive"
            title={about.heading}
          />
          {about.body ? (
            <div className="max-w-xl text-body text-muted">
              <Markdown content={about.body} />
            </div>
          ) : null}

          {about.points.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {about.points.map((point, i) => (
                <li key={i} className="flex items-start gap-3 text-body text-text">
                  <Check
                    aria-hidden="true"
                    className="mt-1 h-5 w-5 shrink-0 text-accent-green"
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </Reveal>

        {about.image ? (
          <Reveal delay={120}>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <Image
                src={about.image.url}
                alt={about.image.alt}
                width={1200}
                height={900}
                sizes="(max-width: 1024px) 100vw, 600px"
                className="h-auto w-full"
              />
            </div>
          </Reveal>
        ) : null}
      </div>
    </Section>
  );
}
