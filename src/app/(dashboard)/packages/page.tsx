import Link from "next/link";
import { safeLoad } from "@/lib/api/safe";
import { listPackages } from "@/lib/data/packages";
import { LinkButton } from "@/components/Button";
import DeletePackageButton from "@/components/DeletePackageButton";

export default async function PackagesPage() {
  const result = await safeLoad(() => listPackages());
  const packages = result.ok ? [...result.data.data].sort((a, b) => a.sort_order - b.sort_order) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl">Packages</h1>
          <p className="label text-paper/35 mt-1">The platform&apos;s global price-list catalog.</p>
        </div>
        <LinkButton href="/packages/new">New package</LinkButton>
      </div>

      {!result.ok ? (
        <p className="label text-accent">{result.message}</p>
      ) : packages.length === 0 ? (
        <p className="label text-paper/35 py-16 text-center border border-paper/10">No packages yet.</p>
      ) : (
        <div className="border border-paper/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper/10 text-left">
                <th className="label text-paper/35 font-normal px-4 py-3">Name</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Slug</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Price</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Status</th>
                <th className="label text-paper/35 font-normal px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr key={pkg.id} className="border-b border-paper/10 last:border-b-0">
                  <td className="px-4 py-3 align-top">
                    {pkg.name.en || pkg.slug}
                    {pkg.highlighted && <span className="label text-accent ml-2">★</span>}
                  </td>
                  <td className="px-4 py-3 align-top text-paper/70">{pkg.slug}</td>
                  <td className="px-4 py-3 align-top text-paper/70">
                    {pkg.price ? `${pkg.price} ${pkg.currency}` : "—"}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className={`label ${pkg.is_active ? "text-paper" : "text-paper/35"}`}>
                      {pkg.is_active ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/packages/${pkg.id}/edit`}
                        className="label text-paper/55 hover:text-accent transition-colors"
                      >
                        Edit
                      </Link>
                      <DeletePackageButton id={pkg.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
