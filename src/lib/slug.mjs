// Suggests a tenant slug from free text: lowercase ASCII letters and digits,
// any run of other characters becomes one hyphen, no leading or trailing
// hyphen, at most 40 characters. Returns "" when nothing usable remains
// (empty, symbol-only or non-Latin input) and never throws. The backend
// validates the slug (lowercase letters, digits, hyphens; 1 to 63 characters); this is only a convenience.
export const MAX_SLUG_LENGTH = 40;

export function suggestSlug(text) {
  if (typeof text !== "string") return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/, "");
}
