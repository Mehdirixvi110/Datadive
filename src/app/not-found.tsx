import Link from "next/link";
import { Container, buttonVariants } from "@/components/ui";
import { GlowBlob } from "@/components/motion";

/**
 * Branded 404 (design §11, FR-1.6). Served for unknown routes and `notFound()`
 * calls (unknown/draft blog posts, bodyless/draft projects).
 */
export default function NotFound() {
  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden">
      <GlowBlob
        tone="brand"
        className="left-1/2 top-1/2 h-[420px] w-[520px] -translate-x-1/2 -translate-y-1/2"
      />
      <Container className="relative z-10 flex flex-col items-center gap-6 text-center">
        <span className="font-mono text-display-3 font-bold text-depth">404</span>
        <h1 className="font-display text-display-3 font-bold text-text">
          This page took a deep dive
        </h1>
        <p className="max-w-md text-body text-muted">
          We couldn&apos;t surface the page you were looking for. It may have
          moved, or never existed.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/" className={buttonVariants({ variant: "primary" })}>
            Back to home
          </Link>
          <Link href="/blog" className={buttonVariants({ variant: "outline" })}>
            Read the blog
          </Link>
        </div>
      </Container>
    </section>
  );
}
