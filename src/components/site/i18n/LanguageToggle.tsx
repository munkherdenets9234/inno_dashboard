"use client";

import { useLang } from "./LanguageProvider";

export default function LanguageToggle() {
  const { lang, toggleLang } = useLang();

  return (
    <button
      type="button"
      onClick={toggleLang}
      suppressHydrationWarning
      aria-label={lang === "en" ? "Switch to Mongolian" : "Switch to English"}
      className="label flex items-center gap-1"
    >
      <span suppressHydrationWarning className={lang === "mn" ? "text-paper" : "text-paper/35"}>
        MN
      </span>
      <span className="text-paper/35">/</span>
      <span suppressHydrationWarning className={lang === "en" ? "text-paper" : "text-paper/35"}>
        EN
      </span>
    </button>
  );
}
