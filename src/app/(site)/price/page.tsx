import type { Metadata } from "next";
import PriceView from "@/components/site/views/PriceView";
import { listPackages } from "@/lib/site-packages";

export const metadata: Metadata = {
  title: "Price — Inno Nomads",
  description: "Fixed packages covering design, build, hosting and support.",
};

export default async function Page() {
  const packages = await listPackages();
  return <PriceView packages={packages} />;
}
