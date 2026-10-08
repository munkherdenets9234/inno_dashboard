import Link from "next/link";
import { safeLoad } from "@/lib/api/safe";
import { requireToken } from "@/lib/auth/session";
import { listPlans } from "@/lib/data/plans";
import { LinkButton } from "@/components/Button";
import ConfirmAction from "@/components/ConfirmAction";
import Pagination from "@/components/Pagination";
import { deletePlanAction } from "./actions";

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: rawPage } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);
  const limit = 50;
  const token = await requireToken();

  const result = await safeLoad(() => listPlans(token, page, limit));
  const plans = result.ok ? result.data.data : [];
  const meta = result.ok ? result.data.meta : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl">Plans</h1>
          <p className="label text-paper/35 mt-1">
            What a tenant is billed for, and what subscribing grants. Not the pricing cards under Packages —
            those are a tenant&apos;s own marketing copy.
          </p>
        </div>
        <LinkButton href="/admin/plans/new">New plan</LinkButton>
      </div>

      {!result.ok ? (
        <p className="label text-accent">{result.message}</p>
      ) : plans.length === 0 ? (
        <p className="label text-paper/35 py-16 text-center border border-paper/10">No plans yet.</p>
      ) : (
        <div className="border border-paper/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper/10 text-left">
                <th className="label text-paper/35 font-normal px-4 py-3">Name</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Price</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Period</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Modules</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Limits</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Active</th>
                <th className="label text-paper/35 font-normal px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id} className="border-b border-paper/10 last:border-b-0">
                  <td className="px-4 py-3 align-top">
                    <Link href={`/admin/plans/${p.id}/edit`} className="hover:text-accent transition-colors">
                      {p.name}
                    </Link>
                    <span className="label text-paper/35 block">{p.slug}</span>
                  </td>
                  <td className="px-4 py-3 align-top text-paper/70">
                    {p.price.toLocaleString()} {p.currency}
                  </td>
                  <td className="px-4 py-3 align-top text-paper/70">{p.period_days}d</td>
                  <td className="px-4 py-3 align-top text-paper/70">
                    {p.modules.length === 0 ? (
                      // Not "none" — an empty list turns the module gate OFF
                      // for everyone on this plan, which is the opposite of
                      // what "none" reads as.
                      <span className="label text-accent">ungated</span>
                    ) : (
                      p.modules.join(", ")
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-paper/70">
                    {Object.keys(p.limits).length === 0 ? (
                      <span className="label text-paper/35">unlimited</span>
                    ) : (
                      Object.entries(p.limits)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className={`label ${p.is_active ? "text-paper" : "text-paper/35"}`}>
                      {p.is_active ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/plans/${p.id}/edit`}
                        className="label text-paper/55 hover:text-accent transition-colors"
                      >
                        Edit
                      </Link>
                      <ConfirmAction
                        action={deletePlanAction.bind(null, p.id)}
                        confirm={
                          `Delete "${p.name}"? Tenants subscribed to it keep their subscription, but their ` +
                          `entitlement loses this plan's modules and limits — which means the module gate stops ` +
                          `being enforced and every limit becomes unlimited for them. Deactivate it instead if you ` +
                          `only want to stop new subscriptions.`
                        }
                        label="Delete"
                        className="label text-paper/35 hover:text-accent transition-colors"
                      />
                    </div>
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
