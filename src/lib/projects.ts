import type { Lang } from "@/components/site/i18n/LanguageProvider";
import { apiGet, ApiError } from "@/lib/api/public";

export interface ProjectImage {
  url: string;
  caption: string;
}

export interface ProjectMetric {
  label: string;
  value: string;
}

// Shape of one item exactly as GET /public/projects[/{slug}] returns it for
// a single `lang` — see core_backend's internal/api/view.PublicProject.
// This is a showcased *tenant* of the platform (Inno Nomads' own onboarded
// clients), not a bespoke "project" model — field names follow the API's
// JSON tags (snake_case) rather than being remapped to JS convention.
interface ProjectResponse {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  category: string;
  live_url?: string;
  cover_image?: ProjectImage;
  images?: ProjectImage[];
  metrics?: ProjectMetric[];
  featured: boolean;
  sort_order: number;
  created_at: string;
}

// Bilingual shape the views consume — built by fetching both locales and
// zipping them together by id, since the API only ever resolves
// tagline/description/metric labels to one language per request.
export interface Project {
  id: string;
  slug: string;
  name: string;
  category: string;
  liveUrl?: string;
  coverImage?: ProjectImage;
  images: ProjectImage[];
  createdAt: string;
  tagline: { en: string; mn: string };
  description: { en: string; mn: string };
  metrics: { en: ProjectMetric[]; mn: ProjectMetric[] };
}

function zip(en: ProjectResponse, mn: ProjectResponse): Project {
  return {
    id: en.id,
    slug: en.slug,
    name: en.name,
    category: en.category,
    liveUrl: en.live_url,
    coverImage: en.cover_image,
    images: en.images ?? [],
    createdAt: en.created_at,
    tagline: { en: en.tagline, mn: mn.tagline },
    description: { en: en.description, mn: mn.description },
    metrics: { en: en.metrics ?? [], mn: mn.metrics ?? [] },
  };
}

/**
 * GET /public/projects — no credential of any kind. Already sorted by sort_order.
 * Returns [] (rather than throwing) if the API is unreachable or errors, so a
 * backend hiccup degrades to the "coming soon" empty state instead of a 500.
 */
export async function listProjects(limit = 50): Promise<Project[]> {
  try {
    const [en, mn] = await Promise.all([
      apiGet<ProjectResponse[]>("/public/projects", { lang: "en", limit }),
      apiGet<ProjectResponse[]>("/public/projects", { lang: "mn", limit }),
    ]);
    const mnById = new Map(mn.data.map((p) => [p.id, p]));
    return en.data.map((p) => zip(p, mnById.get(p.id) ?? p));
  } catch (err) {
    console.error("listProjects failed, showing empty state:", err);
    return [];
  }
}

/** GET /public/projects/{slug} — no credential of any kind. Null on 404 (not found / not showcased). */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    const [en, mn] = await Promise.all([
      apiGet<ProjectResponse>(`/public/projects/${slug}`, { lang: "en" }),
      apiGet<ProjectResponse>(`/public/projects/${slug}`, { lang: "mn" }),
    ]);
    return zip(en.data, mn.data);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** Flattens a Project's bilingual fields down to plain values for one language. */
export function localizeProject(project: Project, lang: Lang) {
  return {
    id: project.id,
    slug: project.slug,
    name: project.name,
    category: project.category,
    liveUrl: project.liveUrl,
    coverImage: project.coverImage,
    images: project.images,
    year: new Date(project.createdAt).getFullYear(),
    tagline: project.tagline[lang],
    description: project.description[lang],
    metrics: project.metrics[lang],
  };
}
