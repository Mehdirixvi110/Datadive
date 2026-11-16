import { Section } from "@/components/ui";
import { CountUp, Reveal } from "@/components/motion";
import type { Stat } from "@/lib/types";

/**
 * Stats / proof band (design §11/§16). Each number animates 0→value with
 * CountUp when it scrolls into view (instant under reduced motion); a
 * `displayOverride` is shown verbatim.
 */
export function Stats({ stats }: { stats: Stat[] }) {
  if (stats.length === 0) return null;

  return (
    <Section id="stats" surface>
      <dl className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat, i) => (
          <Reveal
            key={stat.id}
            delay={i * 80}
            className="flex flex-col items-center gap-2 text-center"
          >
            <dt className="font-mono text-display-3 font-bold text-text">
              <CountUp
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                displayOverride={stat.displayOverride}
              />
            </dt>
            <dd className="text-small text-muted">{stat.name}</dd>
          </Reveal>
        ))}
      </dl>
    </Section>
  );
}
