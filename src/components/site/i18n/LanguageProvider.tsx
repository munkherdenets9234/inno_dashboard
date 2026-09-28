"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Lang = "en" | "mn";

const STORAGE_KEY = "inno-lang";

const LanguageContext = createContext<{
  lang: Lang;
  toggleLang: () => void;
} | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Server always renders "en" — matches on mount below to avoid a hydration
  // mismatch, then syncs to any stored preference right after.
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "mn") {
      setLang(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next: Lang = prev === "en" ? "mn" : "en";
      window.localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.lang = next;
      return next;
    });
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>{children}</LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
