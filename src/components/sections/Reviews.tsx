import Image from "next/image";
import { Quote, Star } from "lucide-react";
import { Section, SectionHeading, Card } from "@/components/ui";
import { Reveal } from "@/components/motion";
import type { Review } from "@/lib/types";

/**
 * Reviews / testimonials (design §11). Quote, optional star rating, reviewer
 * name/role/company, optional avatar. Data comes from the DAL, which reinjects
 * seed placeholders on an empty live Reviews table (FR-9.2).
 */
function Stars({ rating }: { rating: number }) {
  return (
    <div
      className="flex gap-0.5"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={
            i < rating
              ? "h-4 w-4 fill-accent-amber text-accent-amber"
              : "h-4 w-4 text-border"
          }
        />
      ))}
    </div>
  );
}

export function Reviews({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  return (
    <Section id="reviews" surface>
      <SectionHeading
        eyebrow="In their words"
        title="What clients say"
      />
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review, i) => (
          <Reveal key={review.id} delay={(i % 3) * 80}>
            <Card className="flex h-full flex-col gap-4">
              <Quote aria-hidden="true" className="h-7 w-7 text-brand-400" />
              {review.rating ? <Stars rating={review.rating} /> : null}
              <blockquote className="flex-1 text-body text-text">
                “{review.quote}”
              </blockquote>
              <div className="flex items-center gap-3">
                {review.avatar ? (
                  <Image
                    src={review.avatar.url}
                    alt={review.avatar.alt}
                    width={48}
                    height={48}
                    sizes="48px"
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-900/50 font-display text-h4 font-semibold text-brand-200"
                  >
                    {review.name.charAt(0) || "?"}
                  </span>
                )}
                <div className="flex flex-col">
                  <span className="font-medium text-text">{review.name}</span>
                  <span className="text-small text-muted">
                    {[review.role, review.company].filter(Boolean).join(", ")}
                  </span>
                </div>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
