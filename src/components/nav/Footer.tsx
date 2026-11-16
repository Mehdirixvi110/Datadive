import Link from "next/link";
import { Mail, Globe } from "lucide-react";
import { Container } from "@/components/ui";
import type { Settings } from "@/lib/types";

/**
 * Site footer (design §11). Contact details — email / LinkedIn / website — all
 * come from Settings (FR-13.3); nothing is hardcoded. Links render only when
 * their value is present, so an empty field never produces a dead link.
 */
function LinkedInGlyph() {
  // lucide-react in this pinned version omits a LinkedIn glyph, so inline a
  // small brand mark. The surrounding link carries the accessible label.
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

export function Footer({ settings }: { settings: Settings }) {
  const year = new Date().getFullYear();
  const brand = settings.brandName || "Datadive";

  return (
    <footer className="border-t border-border bg-surface">
      <Container as="div" className="flex flex-col gap-8 py-12 md:flex-row md:items-start md:justify-between">
        <div className="flex max-w-sm flex-col gap-3">
          <span className="font-display text-h4 font-bold text-text">{brand}</span>
          {settings.tagline ? (
            <p className="text-small text-muted">{settings.tagline}</p>
          ) : null}
          {settings.addressText ? (
            <p className="text-small text-muted">{settings.addressText}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-mono text-small uppercase tracking-widest text-depth">
            Get in touch
          </h2>
          <ul className="flex flex-col gap-2 text-body text-muted">
            {settings.contactEmail ? (
              <li>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="inline-flex items-center gap-2 rounded transition-colors hover:text-text"
                >
                  <Mail aria-hidden="true" className="h-5 w-5" />
                  {settings.contactEmail}
                </a>
              </li>
            ) : null}
            {settings.linkedinUrl ? (
              <li>
                <a
                  href={settings.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded transition-colors hover:text-text"
                >
                  <LinkedInGlyph />
                  LinkedIn
                </a>
              </li>
            ) : null}
            {settings.websiteUrl ? (
              <li>
                <a
                  href={settings.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded transition-colors hover:text-text"
                >
                  <Globe aria-hidden="true" className="h-5 w-5" />
                  Website
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </Container>

      <div className="border-t border-border">
        <Container as="div" className="flex flex-col gap-2 py-6 text-small text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {brand}. All rights reserved.
          </p>
          <Link href="/blog" className="rounded transition-colors hover:text-text">
            Blog
          </Link>
        </Container>
      </div>
    </footer>
  );
}
