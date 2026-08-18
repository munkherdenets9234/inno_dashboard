"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Mark from "@/components/Mark";
import { logoutAction } from "@/app/(dashboard)/actions";

const LINKS = [
  { href: "/tenants", label: "Tenants" },
  { href: "/quotes", label: "Quotes" },
  { href: "/packages", label: "Packages" },
];

export default function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-ink text-paper">
      <aside className="w-56 shrink-0 border-r border-paper/10 flex flex-col gap-8 p-6">
        <Link href="/tenants" className="flex items-center gap-2.5">
          <Mark size={16} className="text-paper" />
          <span className="font-heading font-extrabold text-sm tracking-tight">ADMIN</span>
        </Link>

        <nav className="flex flex-col gap-1">
          {LINKS.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`label px-3 py-2.5 transition-colors ${
                  active ? "text-paper bg-paper/5" : "text-paper/55 hover:text-accent"
                }`}
              >
                {l.label.toUpperCase()}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between gap-4 px-6 py-3.5 border-b border-paper/10">
          <span className="label text-paper/55">{email}</span>
          <form action={logoutAction}>
            <button type="submit" className="label text-paper/55 hover:text-accent transition-colors">
              Log out
            </button>
          </form>
        </header>
        <main className="flex-1 p-6 md:p-8 min-w-0">{children}</main>
      </div>
    </div>
  );
}
