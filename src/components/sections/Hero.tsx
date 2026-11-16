import Image from "next/image";
import Link from "next/link";
import { Container, buttonVariants } from "@/components/ui";
import { DiveField, GlowBlob } from "@/components/motion";
import type { Hero as HeroModel } from "@/lib/types";

/**
 * Hero (design §11/§16). Server-rendered headline + CTAs sit in front of the
 * decorative DiveField canvas and a gradient glow. The DiveField is the
 * nice-to-have signature feature (FR-17) and is purely decorative
 * (`aria-hidden`); if it were ever removed the glow + content still stand on
 * their own, so no requirement depends on it.
 */
export function Hero({ hero }: { hero: HeroModel }) {
  return (
    <section
      id="top"
      className="relative overflow-hidden border-b border-border"
    >
      {/* Decorative background layers */}
      <DiveField className="opacity-70" />
      <GlowBlob
        tone="brand"
        drift
        className="left-1/2 top-[-10%] h-[520px] w-[520px] -translate-x-1/2"
      />
      <GlowBlob
        tone="depth"
        className="right-[-10%] top-1/3 h-[360px] w-[360px]"
      />

      <Container className="relative z-10 flex flex-col items-center gap-6 py-28 text-center md:py-36">
        {hero.eyebrow ? (
          <span className="font-mono text-small uppercase tracking-widest text-depth">
            {hero.eyebrow}
          </span>
        ) : null}

        <h1 className="max-w-4xl font-display text-display-1 font-bold text-text">
          {hero.headline}
        </h1>

        {hero.subheadline ? (
          <p className="max-w-2xl text-body text-muted md:text-h4 md:leading-relaxed">
            {hero.subheadline}
          </p>
        ) : null}

        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          {hero.primaryCtaLabel ? (
            <Link
              href={hero.primaryCtaHref || "#contact"}
              className={buttonVariants({ variant: "primary", size: "lg" })}
            >
              {hero.primaryCtaLabel}
            </Link>
          ) : null}
          {hero.secondaryCtaLabel ? (
            <Link
              href={hero.secondaryCtaHref || "#work"}
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              {hero.secondaryCtaLabel}
            </Link>
          ) : null}
        </div>

        {hero.image ? (
          <div className="mt-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/40">
            <Image
              src={hero.image.url}
              alt={hero.image.alt}
              width={1600}
              height={900}
              priority
              sizes="(max-width: 896px) 100vw, 896px"
              className="h-auto w-full"
            />
          </div>
        ) : null}
      </Container>
    </section>
  );
}
