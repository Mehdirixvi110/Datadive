import { Mail, Globe, MessageCircle } from "lucide-react";
import { Section, SectionHeading, Card } from "@/components/ui";
import { ContactForm } from "./ContactForm";
import { buildWaMeUrl } from "@/lib/utils/whatsapp";
import type { Settings } from "@/lib/types";

/**
 * Contact (design §11). Server-rendered contact details from Settings
 * (email / LinkedIn / website / optional WhatsApp) alongside the client
 * ContactForm. Nothing is hardcoded.
 */
function LinkedInGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

export function Contact({ settings }: { settings: Settings }) {
  const waHref = buildWaMeUrl(settings.whatsappNumber, settings.whatsappPrefillMessage);

  return (
    <Section id="contact" surface>
      <SectionHeading
        eyebrow="Get in touch"
        title="Let's talk about your data"
        subtitle="Tell us what you're working on and we'll get back to you."
      />

      <div className="mx-auto mt-14 grid max-w-5xl gap-10 lg:grid-cols-5">
        <div className="flex flex-col gap-5 lg:col-span-2">
          {settings.contactEmail ? (
            <a
              href={`mailto:${settings.contactEmail}`}
              className="flex items-center gap-3 rounded-lg text-body text-text transition-colors hover:text-brand-200"
            >
              <Mail aria-hidden="true" className="h-5 w-5 text-brand-300" />
              {settings.contactEmail}
            </a>
          ) : null}
          {settings.linkedinUrl ? (
            <a
              href={settings.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg text-body text-text transition-colors hover:text-brand-200"
            >
              <span className="text-brand-300">
                <LinkedInGlyph />
              </span>
              LinkedIn
            </a>
          ) : null}
          {settings.websiteUrl ? (
            <a
              href={settings.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg text-body text-text transition-colors hover:text-brand-200"
            >
              <Globe aria-hidden="true" className="h-5 w-5 text-brand-300" />
              Website
            </a>
          ) : null}
          {waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg text-body text-text transition-colors hover:text-brand-200"
            >
              <MessageCircle aria-hidden="true" className="h-5 w-5 text-accent-green" />
              WhatsApp
            </a>
          ) : null}
          {settings.addressText ? (
            <p className="text-small text-muted">{settings.addressText}</p>
          ) : null}
        </div>

        <Card className="lg:col-span-3">
          <ContactForm />
        </Card>
      </div>
    </Section>
  );
}
