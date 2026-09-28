"use client";

import LanguageToggle from "./i18n/LanguageToggle";
import { useCopy } from "./i18n/ContentProvider";
import { common } from "@/lib/i18n/common";

export default function SiteFooter() {
  const t = useCopy(common, "common");

  return (
    <footer className="flex items-center justify-between px-6 py-5 border-t border-paper/10">
      <span className="label text-paper/35">{t.footer.copyright}</span>
      <LanguageToggle />
    </footer>
  );
}
