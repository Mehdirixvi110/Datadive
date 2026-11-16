import Link from "next/link";
import { Container, buttonVariants } from "@/components/ui";
import { GlowBlob, Reveal } from "@/components/motion";
import type { Cta as CtaModel } from "@/lib/types";

/**
 * CTA band (design §11/§16). Heading + subtext + primary/secondary CTAs over a
 * brand→depth gradient glow. All copy/targets flow from the DAL/seed.
 */
export function Cta({ cta }: { cta: CtaModel }) {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <GlowBlob
        tone="brand"
        drift
        className="left-1/2 top-1/2 h-[480px] w-[640px] -translate-x-1/2 -translate-y-1/2"
      />
      <Container className="relative z-10">
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-3xl border border-border bg-card/70 px-6 py-14 text-center backdrop-blur">
          <h2 className="font-display text-display-2 font-bold text-text">
            {cta.heading}
          </h2>
          {cta.subtext ? (
            <p className="max-w-2xl text-body text-muted">{cta.subtext}</p>
          ) : null}
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            {cta.primaryCtaLabel ? (
              <Link
                href={cta.primaryCtaHref || "#contact"}
                className={buttonVariants({ variant: "primary", size: "lg" })}
              >
                {cta.primaryCtaLabel}
              </Link>
            ) : null}
            {cta.secondaryCtaLabel ? (
              <Link
                href={cta.secondaryCtaHref || "#contact"}
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                {cta.secondaryCtaLabel}
              </Link>
            ) : null}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
