import { safeLoad } from "@/lib/api/safe";
import { listTenantDomains } from "@/lib/data/domains";
import DomainsPanel from "@/components/DomainsPanel";
import { deleteDomainAction, saveDomainAction } from "@/app/admin/(console)/tenants/actions";

export default async function DomainsTab({ id }: { id: string }) {
  const domainsRes = await safeLoad(() => listTenantDomains(id));

  return !domainsRes.ok ? (
    <p className="label text-accent">{domainsRes.message}</p>
  ) : (
    <DomainsPanel
      domains={domainsRes.data}
      save={saveDomainAction.bind(null, id)}
      remove={deleteDomainAction.bind(null, id)}
    />
  );
}
