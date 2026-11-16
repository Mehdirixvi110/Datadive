import { Section, SectionHeading, Card } from "@/components/ui";
import { Reveal } from "@/components/motion";
import { iconFor } from "@/lib/airtable/mappers";
import type { Accent, Industry } from "@/lib/types";

/**
 * Industries (design §11/§16). 5-up responsive grid ("who we build for"). Per
 * card accent + lucide icon via the shared `iconFor` mapper.
 */
const ICON_TONE: Record<Accent, string> = {
  blue: "bg-brand-900/40 text-brand-200",
  amber: "bg-accent-amber/10 text-accent-amber",
  green: "bg-accent-green/10 text-accent-green",
  red: "bg-accent-red/10 text-accent-red",
};

export function Industries({ industries }: { industries: Industry[] }) {
  if (industries.length === 0) return null;

  return (
    <Section id="industries" surface>
      <SectionHeading
        eyebrow="Who we build for"
        title="Industries we know well"
        subtitle="We've shipped analytics across these sectors — and bring that context to every engagement."
      />
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {industries.map((industry, i) => {
          const Icon = iconFor(industry.icon);
          return (
            <Reveal key={industry.id} delay={i * 70}>
              <Card accent={industry.accent} interactive className="h-full">
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg ${ICON_TONE[industry.accent]}`}
                >
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </div>
                <h3 className="font-display text-h4 font-semibold text-text">
                  {industry.name}
                </h3>
                <p className="mt-2 text-small text-muted">
                  {industry.description}
                </p>
              </Card>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
