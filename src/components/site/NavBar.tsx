"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Mark from "./Mark";
import ThemeToggle from "./theme/ThemeToggle";
import LanguageToggle from "./i18n/LanguageToggle";
import { useCopy } from "./i18n/ContentProvider";
import { common } from "@/lib/i18n/common";

export default function NavBar() {
  const pathname = usePathname();
  const t = useCopy(common, "common").nav;

  const links = [
    { href: "/", label: t.home },
    { href: "/price", label: t.price },
    { href: "/our-projects", label: t.ourProjects },
    { href: "/review", label: t.review },
    { href: "/contact", label: t.contact },
  ];

  return (
    <header className="flex items-center justify-between gap-6 px-6 py-3.5 border-b border-paper/10">
      <Link href="/" className="flex items-center gap-3 shrink-0">
        <Mark size={18} className="text-paper" />
        <span className="font-heading font-extrabold text-sm tracking-tight">
          INNO NOMADS
        </span>
      </Link>

      <nav className="hidden md:flex items-center gap-6">
        {links.map((l) => {
          const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`label transition-colors ${
                active ? "text-paper" : "text-paper/55 hover:text-accent"
              }`}
            >
              {l.label.toUpperCase()}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-4 shrink-0">
        <ThemeToggle />
        <LanguageToggle />
        <Link
          href="/contact"
          className="label bg-accent text-on-accent px-4.5 py-2.5 hover:bg-accent-dark transition-colors"
        >
          {t.quote}
        </Link>
      </div>
    </header>
  );
}
