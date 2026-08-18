import { safeLoad } from "@/lib/api/safe";
import { listAllQuotes } from "@/lib/data/quotes";
import { listTenants } from "@/lib/data/tenants";
import Pagination from "@/components/Pagination";
import QuoteRow from "@/components/QuoteRow";

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: rawPage } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);
  const limit = 20;

  const [result, tenantsRes] = await Promise.all([
    safeLoad(() => listAllQuotes(page, limit)),
    safeLoad(() => listTenants(1, 100)),
  ]);
  const quotes = result.ok ? result.data.data : [];
  const meta = result.ok ? result.data.meta : undefined;
  const tenantsById = new Map((tenantsRes.ok ? tenantsRes.data.data : []).map((t) => [t.id, t.name]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Quotes</h1>
        <p className="label text-paper/35 mt-1">
          Every lead across the platform — prospects and existing tenants alike.
        </p>
      </div>

      {!result.ok ? (
        <p className="label text-accent">{result.message}</p>
      ) : quotes.length === 0 ? (
        <p className="label text-paper/35 py-16 text-center border border-paper/10">No quotes yet.</p>
      ) : (
        <div className="border border-paper/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper/10 text-left">
                <th className="label text-paper/35 font-normal px-4 py-3">Submitted</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Name</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Tenant</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Company</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <QuoteRow key={q.id} quote={q} tenantName={q.tenant_id ? tenantsById.get(q.tenant_id) : undefined} />
              ))}
            </tbody>
          </table>
          {meta && <Pagination page={meta.page} limit={meta.limit} total={meta.total} />}
        </div>
      )}
    </div>
  );
}
