"use client";

import { createContext, useContext, useMemo } from "react";
import { useLang, type Lang } from "@/components/site/i18n/LanguageProvider";
import { applyOverrides, EMPTY_OVERRIDES, type OverridesByLang } from "@/lib/content";

// Carries the editable copy fetched in the root layout down to the views.
//
// Holding BOTH languages is the point: the language toggle stays a client
// state change with no network round trip, exactly as it was when every
// string was compiled in.

const ContentContext = createContext<OverridesByLang>(EMPTY_OVERRIDES);

export function ContentProvider({
  overrides,
  children,
}: {
  overrides: OverridesByLang;
  children: React.ReactNode;
}) {
  return <ContentContext.Provider value={overrides}>{children}</ContentContext.Provider>;
}

/**
 * Returns a page's dictionary for the current language, with any overrides
 * applied.
 *
 * Replaces `dict[lang]` at every call site. Keeping the same return shape is
 * deliberate — the views index into it in a hundred places, and a hook that
 * changed the shape would have turned a content feature into a rewrite.
 *
 * Works without a provider, returning the plain defaults. That is what makes
 * a view renderable in isolation, and what keeps this from being a new way
 * for the site to break.
 */
export function useCopy<T>(defaults: Record<Lang, T>, page: string): T {
  const { lang } = useLang();
  const overrides = useContext(ContentContext);

  return useMemo(
    () => applyOverrides(defaults[lang], overrides[lang]?.[page]),
    [defaults, lang, overrides, page],
  );
}
