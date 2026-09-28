import { notFound } from "next/navigation";
import { getTenantById } from "@/lib/data/tenants";
import { updateTenantProjectAction } from "../../actions";
import TenantProjectForm from "@/components/TenantProjectForm";
import { ApiError } from "@/lib/api/client";

export default async function TenantProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let tenant;
  try {
    tenant = (await getTenantById(id)).data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">{tenant.name}</h1>
        <p className="label text-paper/35 mt-1">{tenant.slug} · &quot;Our Projects&quot; showcase content</p>
      </div>
      <TenantProjectForm tenant={tenant} action={updateTenantProjectAction.bind(null, tenant.id)} />
    </div>
  );
}
