import { updateTenantProjectAction } from "@/app/admin/(console)/tenants/actions";
import TenantProjectForm from "@/components/TenantProjectForm";
import type { Tenant } from "@/lib/types";

export default function ProjectTab({ tenant }: { tenant: Tenant }) {
  return <TenantProjectForm tenant={tenant} action={updateTenantProjectAction.bind(null, tenant.id)} />;
}
