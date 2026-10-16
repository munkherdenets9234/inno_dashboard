import { redirect } from "next/navigation";

export default async function LegacypackagesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/tenants/${id}?tab=packages`);
}
