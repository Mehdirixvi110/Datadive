import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { MotionProvider } from "@/components/motion";
import { Navbar } from "@/components/nav/Navbar";
import { Footer } from "@/components/nav/Footer";
import { WhatsAppButton } from "@/components/nav/WhatsAppButton";
import { getSettings, getNavLinks } from "@/lib/airtable/read";
import { resolveSiteUrl } from "@/lib/seo";

/**
 * Fonts (design §16): Inter (body/UI), Plus Jakarta Sans (display/headings),
 * JetBrains Mono (data accents). Exposed as CSS variables consumed by
 * tailwind.config.ts and globals.css.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: resolveSiteUrl(),
  title: {
    default: "Datadive — Diving Into Data, Driving Decisions",
    template: "%s | Datadive",
  },
  description:
    "Datadive turns messy data into clear decisions — dashboards, BI, AI, and custom analytics for teams that want to move faster.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Chrome reads come from the DAL (seed when no Airtable creds), so the layout
  // always renders fully — even on the zero-env build/render gate.
  const [settings, navLinks] = await Promise.all([getSettings(), getNavLinks()]);

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-bg text-text font-sans antialiased">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <MotionProvider>
          <Navbar
            brandName={settings.brandName}
            logoUrl={settings.logoDarkUrl}
            logoAlt={`${settings.brandName} logo`}
            links={navLinks.map((n) => ({
              id: n.id,
              name: n.name,
              href: n.href,
              openInNewTab: n.openInNewTab,
            }))}
            ctaLabel={settings.primaryCtaLabel}
            ctaHref={settings.primaryCtaHref}
          />
          <main id="main-content">{children}</main>
          <Footer settings={settings} />
          <WhatsAppButton
            number={settings.whatsappNumber}
            prefill={settings.whatsappPrefillMessage}
          />
        </MotionProvider>
      </body>
    </html>
  );
}
