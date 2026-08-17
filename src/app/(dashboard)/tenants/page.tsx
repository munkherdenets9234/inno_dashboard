import Link from "next/link";
import { safeLoad } from "@/lib/api/safe";
import { listTenants } from "@/lib/data/tenants";
import Pagination from "@/components/Pagination";

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: rawPage } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);
  const limit = 50;

  const result = await safeLoad(() => listTenants(page, limit));
  const tenants = result.ok ? result.data.data : [];
  const meta = result.ok ? result.data.meta : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Tenants</h1>
        <p className="label text-paper/35 mt-1">Manage each tenant&apos;s &quot;Our Projects&quot; showcase content.</p>
      </div>

      {!result.ok ? (
        <p className="label text-accent">{result.message}</p>
      ) : tenants.length === 0 ? (
        <p className="label text-paper/35 py-16 text-center border border-paper/10">No tenants yet.</p>
      ) : (
        <div className="border border-paper/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper/10 text-left">
                <th className="label text-paper/35 font-normal px-4 py-3">Name</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Slug</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Status</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Showcase</th>
                <th className="label text-paper/35 font-normal px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b border-paper/10 last:border-b-0">
                  <td className="px-4 py-3 align-top">{t.name}</td>
                  <td className="px-4 py-3 align-top text-paper/70">{t.slug}</td>
                  <td className="px-4 py-3 align-top">
                    <span className={`label ${t.status === "active" ? "text-paper" : "text-paper/35"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className={`label ${t.project?.showcase ? "text-accent" : "text-paper/35"}`}>
                      {t.project?.showcase ? "shown" : "hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Link
                      href={`/tenants/${t.id}/project`}
                      className="label text-paper/55 hover:text-accent transition-colors"
                    >
                      Edit showcase
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {meta && <Pagination page={meta.page} limit={meta.limit} total={meta.total} />}
        </div>
      )}
    </div>
  );
}
