import { redirect } from "next/navigation";

export default async function LegacyLeadsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page } = await searchParams;
  const p = Math.max(1, Number(page) || 1);
  redirect(`/admin/tenants/${id}?tab=leads${p > 1 ? `&page=${p}` : ""}`);
}
