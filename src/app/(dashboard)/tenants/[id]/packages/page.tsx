import { notFound } from "next/navigation";
import { getTenantById } from "@/lib/data/tenants";
import { listPackages, listTenantPackages } from "@/lib/data/packages";
import { assignPackageAction } from "../../actions";
import AssignPackageForm from "@/components/AssignPackageForm";
import UnassignPackageButton from "@/components/UnassignPackageButton";
import { ApiError } from "@/lib/api/client";

export default async function TenantPackagesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let tenant;
  try {
    tenant = (await getTenantById(id)).data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const [assignedRes, catalogRes] = await Promise.all([listTenantPackages(id), listPackages()]);
  const assigned = assignedRes.data;
  const catalog = catalogRes.data;
  const assignedIds = new Set(assigned.map((p) => p.id));
  const unassignedOptions = catalog.filter((p) => !assignedIds.has(p.id));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">{tenant.name}</h1>
        <p className="label text-paper/35 mt-1">{tenant.slug} · Assigned packages</p>
      </div>

      {assigned.length === 0 ? (
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

      <AssignPackageForm options={unassignedOptions} action={assignPackageAction.bind(null, id)} />
    </div>
  );
}
