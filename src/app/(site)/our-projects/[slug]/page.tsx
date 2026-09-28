import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CaseStudyView from "@/components/site/views/CaseStudyView";
import { getProjectBySlug, listProjects } from "@/lib/projects";

// No generateStaticParams here on purpose: project slugs now come from a
// live API (digitalservice) that isn't guaranteed to be reachable at build
// time. This route renders dynamically per-request instead.

export async function generateMetadata(props: PageProps<"/our-projects/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};
  return {
    title: `${project.name} — Inno Nomads`,
    description: project.description.en,
  };
}

export default async function Page(props: PageProps<"/our-projects/[slug]">) {
  const { slug } = await props.params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const projects = await listProjects();
  const nextProject = projects.find((p) => p.slug !== project.slug) ?? project;

  return <CaseStudyView project={project} nextProject={nextProject} />;
}
