"use client";

import { MessageCircle } from "lucide-react";
import { buildWaMeUrl } from "@/lib/utils/whatsapp";

/**
 * Floating WhatsApp button (design §11, FR-13). Builds
 * `https://wa.me/<digits>?text=<encoded>` from the normalized Settings number
 * + prefill. When no usable number is configured, `buildWaMeUrl` returns null
 * and the button is hidden ENTIRELY (FR-13.4) rather than linking nowhere.
 * Keyboard-focusable with an aria-label; the entrance fade respects reduced
 * motion via the globals.css guard.
 */
export interface WhatsAppButtonProps {
  number: string;
  prefill?: string;
}

export function WhatsAppButton({ number, prefill }: WhatsAppButtonProps) {
  const href = buildWaMeUrl(number, prefill);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent-green text-white shadow-lg shadow-black/30 transition-transform duration-200 hover:scale-105 motion-safe:animate-[fade-in_0.4s_ease-out]"
    >
      <MessageCircle aria-hidden="true" className="h-7 w-7" />
    </a>
  );
}
