import { safeLoad } from "@/lib/api/safe";
import { listPackages, listTenantPackages } from "@/lib/data/packages";
import { assignPackageAction } from "@/app/admin/(console)/tenants/actions";
import AssignPackageForm from "@/components/AssignPackageForm";
import UnassignPackageButton from "@/components/UnassignPackageButton";

export default async function PackagesTab({ id }: { id: string }) {
  const [assignedRes, catalogRes] = await Promise.all([
    safeLoad(() => listTenantPackages(id)),
    safeLoad(() => listPackages()),
  ]);
  const assigned = assignedRes.ok ? assignedRes.data.data : [];
  const catalog = catalogRes.ok ? catalogRes.data.data : [];
  const assignedIds = new Set(assigned.map((p) => p.id));
  const unassignedOptions = catalog.filter((p) => !assignedIds.has(p.id));

  return (
    <div className="flex flex-col gap-6">
      {!assignedRes.ok ? (
        <p className="label text-accent">{assignedRes.message}</p>
      ) : assigned.length === 0 ? (
        <p className="label text-paper/35 py-16 text-center border border-paper/10">No packages assigned yet.</p>
      ) : (
        <div className="border border-paper/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper/10 text-left">
                <th className="label text-paper/35 font-normal px-4 py-3">Name</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Slug</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Price</th>
                <th className="label text-paper/35 font-normal px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {assigned.map((pkg) => (
                <tr key={pkg.id} className="border-b border-paper/10 last:border-b-0">
                  <td className="px-4 py-3 align-top">{pkg.name.en || pkg.slug}</td>
                  <td className="px-4 py-3 align-top text-paper/70">{pkg.slug}</td>
                  <td className="px-4 py-3 align-top text-paper/70">
                    {pkg.price ? `${pkg.price} ${pkg.currency}` : "—"}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <UnassignPackageButton tenantId={id} packageId={pkg.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!catalogRes.ok ? (
        <p className="label text-accent">{catalogRes.message}</p>
      ) : (
        <AssignPackageForm options={unassignedOptions} action={assignPackageAction.bind(null, id)} />
      )}
    </div>
  );
}
