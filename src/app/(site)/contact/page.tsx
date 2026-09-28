import type { Metadata } from "next";
import ContactView from "@/components/site/views/ContactView";

export const metadata: Metadata = {
  title: "Contact — Inno Nomads",
  description: "Tell us what you need. We reply within one business day.",
};

export default function Page() {
  return <ContactView />;
}
