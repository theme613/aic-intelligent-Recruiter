"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";

type Props = {
  showLogin?: boolean;
  rightSlot?: React.ReactNode;
};

const navLinks = [
  { href: "/recruit", label: "RECRUIT" },
  { href: "/recruit?demo=1", label: "DEMO" },
  { href: "/#features", label: "ABOUT" },
] as const;

function LogoMark() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden
    >
      <rect
        x="1"
        y="1"
        width="18"
        height="18"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M6 5h4.5a2.5 2.5 0 0 1 0 5H6v5M6 10h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function SiteHeader({ showLogin = true, rightSlot }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="border-b border-black bg-white text-black">
      {/* Mobile: logo + hamburger */}
      <div className="flex items-center justify-between px-4 py-4 sm:hidden sm:px-6 sm:py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-lg font-bold tracking-tight"
          onClick={closeMenu}
        >
          <LogoMark />
          RecruitAI
        </Link>
        <button
          type="button"
          className="inline-flex size-10 items-center justify-center border border-black bg-white text-black transition-colors hover:bg-black hover:text-white"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? (
            <X className="size-5" strokeWidth={2} />
          ) : (
            <Menu className="size-5" strokeWidth={2} />
          )}
        </button>
      </div>

      {/* Mobile: dropdown */}
      {menuOpen && (
        <div id="mobile-nav" className="border-t border-black sm:hidden">
          <nav className="flex flex-col">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="border-b border-black px-4 py-4 text-xs font-medium tracking-[0.2em] hover:bg-[#f4f4f4]"
                onClick={closeMenu}
              >
                {label}
              </Link>
            ))}
          </nav>

          {rightSlot && (
            <div className="border-b border-black px-4 py-4">{rightSlot}</div>
          )}

          {showLogin && (
            <div className="px-4 py-4">
              <Link
                href="/recruit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-xs font-medium tracking-wide text-white transition-opacity hover:opacity-90"
                onClick={closeMenu}
              >
                LOG IN
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Desktop: 3-column grid */}
      <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto]">
        <div className="flex items-center border-r border-black px-6 py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-lg font-bold tracking-tight"
          >
            <LogoMark />
            RecruitAI
          </Link>
        </div>

        <nav className="flex items-center justify-center gap-8 border-r border-black px-6 py-5 text-xs font-medium tracking-[0.2em]">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} className="hover:underline">
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-3 px-6 py-4">
          {rightSlot}
          {showLogin && (
            <Link
              href="/recruit"
              className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-xs font-medium tracking-wide text-white transition-opacity hover:opacity-90"
            >
              LOG IN
              <ArrowUpRight className="size-3.5" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
