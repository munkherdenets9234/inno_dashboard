import type { Metadata } from "next";
import OurProjectsView from "@/components/site/views/OurProjectsView";
import { listProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Our Projects — Inno Nomads",
  description: "What we've shipped — case studies from projects we designed, built and still host.",
};

export default async function Page() {
  const projects = await listProjects();
  return <OurProjectsView projects={projects} />;
}
