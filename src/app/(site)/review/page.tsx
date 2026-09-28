import type { Metadata } from "next";
import ReviewView from "@/components/site/views/ReviewView";

export const metadata: Metadata = {
  title: "Review — Inno Nomads",
  description: "What clients say after launch, and how to leave your own review.",
};

export default function Page() {
  return <ReviewView />;
}
