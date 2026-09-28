import { apiGet } from "@/lib/api/public";
import type { Lang } from "@/components/site/i18n/LanguageProvider";

// Editable copy, fetched from tenantcore and merged over the dictionaries in
// lib/i18n.
//
// Those dictionaries stay the source of truth for what the site CAN say;
// tenantcore holds only what an operator has changed. That ordering is the
// whole design, and it buys three things:
//
//   - A key nobody has edited renders its compiled-in default, so adding
//     copy in code needs no content migration and shows up immediately.
//   - tenantcore being down, slow, or empty degrades to the wording that
//     shipped with the build — never to a blank page.
//   - Reverting a headline is deleting an override, not retyping the
//     original from memory.
//
// Both languages are fetched, because the language toggle is client-side and
// instant (see LanguageProvider). Resolving server-side per request would
// mean a round trip on every toggle, which is the one thing that design
// exists to avoid.

/** Overrides for one language: {page: {"dotted.path": value}}. */
export type Overrides = Record<string, Record<string, unknown>>;

export type OverridesByLang = Record<Lang, Overrides>;

export const EMPTY_OVERRIDES: OverridesByLang = { en: {}, mn: {} };

/**
 * GET /public/content for both languages — no credential.
 *
 * Returns empty overrides (rather than throwing) on any failure, which the
 * merge below treats as "use every default". A marketing site must not 500
 * because a CMS is unreachable.
 */
export async function fetchOverrides(): Promise<OverridesByLang> {
  try {
    const [en, mn] = await Promise.all([
      apiGet<Overrides>("/public/content", { lang: "en" }),
      apiGet<Overrides>("/public/content", { lang: "mn" }),
    ]);
    return { en: en.data ?? {}, mn: mn.data ?? {} };
  } catch (err) {
    console.error("fetchOverrides failed, using built-in copy:", err);
    return EMPTY_OVERRIDES;
  }
}

/**
 * Applies a page's flat overrides onto a copy of its dictionary.
 *
 * Arrays are replaced wholesale rather than merged element-wise: an override
 * for `faq.items` is the new list, and merging index-by-index would make
 * removing an item impossible.
 */
export function applyOverrides<T>(defaults: T, overrides: Record<string, unknown> | undefined): T {
  if (!overrides || Object.keys(overrides).length === 0) return defaults;

  // Structured clone so a write never mutates the imported module object —
  // that object is shared across every request this server handles, and
  // mutating it would leak one visitor's language into another's page.
  const out = structuredClone(defaults) as Record<string, unknown>;

  for (const [path, value] of Object.entries(overrides)) {
    const keys = path.split(".");
    let node: Record<string, unknown> = out;
    let ok = true;

    for (const key of keys.slice(0, -1)) {
      const next = node[key];
      if (next === null || typeof next !== "object" || Array.isArray(next)) {
        // The override names a path this dictionary does not have — copy
        // removed or restructured in code since it was written. Skipping is
        // right: the alternative is inventing a branch the views never read,
        // and silently keeping stale content alive.
        ok = false;
        break;
      }
      node = next as Record<string, unknown>;
    }
    if (ok) node[keys[keys.length - 1]] = value;
  }

  return out as T;
}
