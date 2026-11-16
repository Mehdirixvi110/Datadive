import { Section, SectionHeading, Card } from "@/components/ui";
import { Reveal } from "@/components/motion";
import { iconFor } from "@/lib/airtable/mappers";
import type { Accent, Service } from "@/lib/types";

/**
 * Services (design §11/§16). 2×2 / 4-up responsive grid. Each card carries its
 * own `Accent` (from the DAL) for an intentional, balanced color spread, and
 * resolves its icon key to a lucide icon via the shared `iconFor` mapper
 * (Sparkles default).
 */
const ICON_TONE: Record<Accent, string> = {
  blue: "bg-brand-900/40 text-brand-200",
  amber: "bg-accent-amber/10 text-accent-amber",
  green: "bg-accent-green/10 text-accent-green",
  red: "bg-accent-red/10 text-accent-red",
};

export function Services({ services }: { services: Service[] }) {
  if (services.length === 0) return null;

  return (
    <Section id="services">
      <SectionHeading
        eyebrow="What we do"
        title="Services built around your data"
        subtitle="From dashboards to AI, we meet you where your data lives and take it somewhere useful."
      />
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service, i) => {
          const Icon = iconFor(service.icon);
          return (
            <Reveal key={service.id} delay={i * 80}>
              <Card accent={service.accent} interactive className="h-full">
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${ICON_TONE[service.accent]}`}
                >
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </div>
                <h3 className="font-display text-h4 font-semibold text-text">
                  {service.name}
                </h3>
                <p className="mt-2 text-body text-muted">{service.description}</p>
              </Card>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
