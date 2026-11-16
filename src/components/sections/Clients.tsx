import Image from "next/image";
import { Section, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/motion";
import type { Client, SectorGroup } from "@/lib/types";

/**
 * Clients & collaborations (design §11, FR-8.2). Grouped by SectorGroup; each
 * client shows its logo via next/image, falling back to its name as text when
 * no logo is set — so an empty logo never leaves a blank slot.
 */
const GROUP_ORDER: SectorGroup[] = [
  "International & Development",
  "Corporate & Technology",
  "Independent Case Studies",
];

function ClientMark({ client }: { client: Client }) {
  if (client.logo) {
    return (
      <Image
        src={client.logo.url}
        alt={client.logo.alt}
        width={160}
        height={64}
        sizes="160px"
        className="h-12 w-auto object-contain opacity-80 transition-opacity hover:opacity-100"
      />
    );
  }
  return (
    <span className="text-body font-medium text-muted">{client.name}</span>
  );
}

export function Clients({ clients }: { clients: Client[] }) {
  if (clients.length === 0) return null;

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: clients.filter((c) => c.sectorGroup === group),
  })).filter((g) => g.items.length > 0);

  if (grouped.length === 0) return null;

  return (
    <Section id="clients">
      <SectionHeading
        eyebrow="Trusted by"
        title="Clients & collaborations"
        subtitle="Organizations we've partnered with across development, corporate, and independent work."
      />
      <div className="mt-14 flex flex-col gap-10">
        {grouped.map(({ group, items }) => (
          <Reveal key={group} className="flex flex-col gap-5">
            <h3 className="text-center font-mono text-small uppercase tracking-widest text-muted">
              {group}
            </h3>
            <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
              {items.map((client) => (
                <li
                  key={client.id}
                  className="flex h-12 items-center justify-center"
                >
                  {client.websiteUrl ? (
                    <a
                      href={client.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={client.name}
                      className="flex items-center rounded"
                    >
                      <ClientMark client={client} />
                    </a>
                  ) : (
                    <ClientMark client={client} />
                  )}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
