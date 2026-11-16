import Image from "next/image";
import { Section, SectionHeading, Card } from "@/components/ui";
import { Reveal } from "@/components/motion";
import type { TeamMember } from "@/lib/types";

/**
 * Team (design §11). Member grid with photo, name, role, bio, and optional
 * LinkedIn link. All content flows from the DAL/seed.
 */
function LinkedInGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="currentColor"
    >
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

export function Team({ team }: { team: TeamMember[] }) {
  if (team.length === 0) return null;

  return (
    <Section id="team">
      <SectionHeading
        eyebrow="The people"
        title="Meet the team"
        subtitle="A small, senior team that stays close to every engagement."
      />
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((member, i) => (
          <Reveal key={member.id} delay={i * 80}>
            <Card interactive className="flex h-full flex-col items-center gap-4 text-center">
              {member.photo ? (
                <Image
                  src={member.photo.url}
                  alt={member.photo.alt}
                  width={120}
                  height={120}
                  sizes="120px"
                  className="h-28 w-28 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-28 w-28 items-center justify-center rounded-full bg-brand-900/50 font-display text-display-3 font-semibold text-brand-200"
                >
                  {member.name.charAt(0) || "?"}
                </span>
              )}
              <div className="flex flex-col gap-1">
                <h3 className="font-display text-h4 font-semibold text-text">
                  {member.name}
                </h3>
                <p className="font-mono text-small text-depth">{member.role}</p>
              </div>
              {member.bio ? (
                <p className="text-small text-muted">{member.bio}</p>
              ) : null}
              {member.linkedinUrl ? (
                <a
                  href={member.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.name} on LinkedIn`}
                  className="mt-auto rounded text-muted transition-colors hover:text-brand-200"
                >
                  <LinkedInGlyph />
                </a>
              ) : null}
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
