import { safeLoad } from "@/lib/api/safe";
import { listTenantQuotes } from "@/lib/data/quotes";
import Pagination from "@/components/Pagination";
import StatusBadge from "@/components/StatusBadge";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default async function LeadsTab({ id, searchParams }: { id: string; searchParams: { page?: string } }) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 20;

  const result = await safeLoad(() => listTenantQuotes(id, page, limit));
  const quotes = result.ok ? result.data.data : [];
  const meta = result.ok ? result.data.meta : undefined;

  return (
    <>
      {!result.ok ? (
        <p className="label text-accent">{result.message}</p>
      ) : quotes.length === 0 ? (
        <p className="label text-paper/35 py-16 text-center border border-paper/10">No leads yet.</p>
      ) : (
        <div className="border border-paper/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper/10 text-left">
                <th className="label text-paper/35 font-normal px-4 py-3">Submitted</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Name</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Company</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Budget</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Timeline</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id} className="border-b border-paper/10 last:border-b-0">
                  <td className="px-4 py-3 align-top text-paper/55 text-xs whitespace-nowrap">
                    {formatDate(q.created_at)}
                  </td>
                  <td className="px-4 py-3 align-top">{q.name}</td>
                  <td className="px-4 py-3 align-top text-paper/70">{q.company_name || "—"}</td>
                  <td className="px-4 py-3 align-top text-paper/70">{q.budget || "—"}</td>
                  <td className="px-4 py-3 align-top text-paper/70">{q.timeline || "—"}</td>
                  <td className="px-4 py-3 align-top">
                    <StatusBadge status={q.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {meta && <Pagination page={meta.page} limit={meta.limit} total={meta.total} />}
        </div>
      )}
    </>
  );
}
