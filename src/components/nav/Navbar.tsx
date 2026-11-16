"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { buttonVariants } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

/**
 * Sticky top navigation (design §11/§18, FR-1.2/FR-1.3). Data-driven links +
 * CTA from Settings/NavLinks. The mobile menu is keyboard-operable:
 * `aria-expanded` on the toggle, focus trapped while open, and Esc closes it
 * and returns focus to the toggle.
 */
export interface NavbarLink {
  id: string;
  name: string;
  href: string;
  openInNewTab: boolean;
}

export interface NavbarProps {
  brandName: string;
  logoUrl: string;
  logoAlt: string;
  links: NavbarLink[];
  ctaLabel: string;
  ctaHref: string;
}

export function Navbar({
  brandName,
  logoUrl,
  logoAlt,
  links,
  ctaLabel,
  ctaHref,
}: NavbarProps) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);

  // Esc closes; focus-trap Tab within the open mobile menu.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const menu = menuRef.current;
      if (!menu) return;
      const focusable = menu.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    // Move focus into the panel.
    const firstLink = menuRef.current?.querySelector<HTMLElement>("a[href]");
    firstLink?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  const renderLink = (link: NavbarLink, onClick?: () => void) => (
    <Link
      key={link.id}
      href={link.href}
      onClick={onClick}
      target={link.openInNewTab ? "_blank" : undefined}
      rel={link.openInNewTab ? "noopener noreferrer" : undefined}
      className="rounded text-body text-muted transition-colors hover:text-text"
    >
      {link.name}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6"
      >
        <Link href="/" className="flex items-center gap-2" aria-label={`${brandName} home`}>
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={logoAlt || brandName}
              width={150}
              height={36}
              priority
              className="h-8 w-auto"
            />
          ) : (
            <span className="font-display text-h4 font-bold text-text">
              {brandName}
            </span>
          )}
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => renderLink(link))}
        </div>

        <div className="hidden md:block">
          {ctaLabel ? (
            <Link href={ctaHref || "#contact"} className={buttonVariants({ size: "sm" })}>
              {ctaLabel}
            </Link>
          ) : null}
        </div>

        {/* Mobile toggle */}
        <button
          ref={toggleRef}
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-text md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <X aria-hidden="true" className="h-6 w-6" />
          ) : (
            <Menu aria-hidden="true" className="h-6 w-6" />
          )}
        </button>
      </nav>

      {/* Mobile menu panel */}
      {open ? (
        <div
          id="mobile-menu"
          ref={menuRef}
          className="border-t border-border bg-bg md:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6">
            {links.map((link) => renderLink(link, close))}
            {ctaLabel ? (
              <Link
                href={ctaHref || "#contact"}
                onClick={close}
                className={cn(buttonVariants({ size: "md" }), "w-full")}
              >
                {ctaLabel}
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
