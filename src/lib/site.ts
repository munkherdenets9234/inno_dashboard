// Where the public site lives, and which of its URLs each dictionary
// actually affects.
//
// The console edits copy by dictionary name ("home", "common"), which is a
// code concept. An operator wants to see the PAGE. This is the one place
// that translates between the two, so the preview and the "open in new tab"
// link cannot disagree about it.

export function siteUrl() {
  // No default. A wrong guess here shows a preview pane pointing at
  // something that is not the site — an empty pane that says "not
  // configured" is a better answer than a broken one that looks live.
  return process.env.SITE_URL?.trim() ?? "";
}

// Which public route shows a given dictionary's copy.
//
// Two of these are approximations and are labelled as such in the UI:
// `common` is the nav and footer, which appear on every page, so it previews
// the home page; `caseStudy` is the per-project template, which needs a slug
// this page does not have, so it previews the listing that links to them.
const PAGE_PATHS: Record<string, string> = {
  common: "/",
  home: "/",
  price: "/price",
  ourProjects: "/our-projects",
  caseStudy: "/our-projects",
  review: "/review",
  contact: "/contact",
};

/** True when the previewed URL is only where that copy is *visible*, not a page of its own. */
export const APPROXIMATE_PREVIEW: Record<string, string> = {
  common: "Shown on every page — previewing the home page.",
  caseStudy: "Used on each project's own page — previewing the listing that links to them.",
};

export function sitePath(page: string) {
  return PAGE_PATHS[page] ?? "/";
}

/** Absolute URL to preview a dictionary, or "" when SITE_URL is unset. */
export function previewUrl(page: string) {
  const base = siteUrl();
  return base ? `${base.replace(/\/$/, "")}${sitePath(page)}` : "";
}
