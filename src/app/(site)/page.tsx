import type { Metadata } from "next";
import HomeView from "@/components/site/views/HomeView";
import { listProjects } from "@/lib/projects";
import { listPackages } from "@/lib/site-packages";

export const metadata: Metadata = {
  title: "Inno Nomads — We build, host and support your website",
};

export default async function Page() {
  const [projects, packages] = await Promise.all([listProjects(), listPackages()]);
  return <HomeView projects={projects} packages={packages} />;
}
