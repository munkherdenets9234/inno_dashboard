import { safeLoad } from "@/lib/api/safe";
import { listMailLog, MAIL_STATUSES, MAIL_TEMPLATES } from "@/lib/data/mail-log";
import { fieldInputClass } from "@/components/AdminField";
import Pagination from "@/components/Pagination";

function pick<T extends string>(allowed: readonly T[], raw: string | undefined): T | undefined {
  return allowed.find((v) => v === raw);
}

export default async function MailLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; template?: string }>;
}) {
  const { page: rawPage, status: rawStatus, template: rawTemplate } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);
  const limit = 20;
  const status = pick(MAIL_STATUSES, rawStatus);
  const template = pick(MAIL_TEMPLATES, rawTemplate);

  const result = await safeLoad(() => listMailLog({ status, template }, page, limit));
  const rows = result.ok ? result.data.data : [];
  const meta = result.ok ? result.data.meta : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Mail log</h1>
        <p className="label text-paper/35 mt-1">
          Every email tenantcore tried to send, newest first. Message content is never kept; rows
          are deleted after 30 days.
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="label text-paper/70" htmlFor="status">
            Status
          </label>
          <select id="status" name="status" defaultValue={status ?? ""} className={fieldInputClass}>
            <option value="">All</option>
            {MAIL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label text-paper/70" htmlFor="template">
            Template
          </label>
          <select
            id="template"
            name="template"
            defaultValue={template ?? ""}
            className={fieldInputClass}
          >
            <option value="">All</option>
            {MAIL_TEMPLATES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="label h-10 px-4 border border-paper/20 text-paper/70 hover:border-paper/40 transition-colors"
        >
          Filter
        </button>
      </form>

      {!result.ok ? (
        <p className="label text-accent">{result.message}</p>
      ) : rows.length === 0 ? (
        <p className="label text-paper/35 py-16 text-center border border-paper/10">
          No mail logged{status || template ? " for these filters" : " yet"}.
        </p>
      ) : (
        <div className="border border-paper/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper/10 text-left">
                <th className="label text-paper/35 font-normal px-4 py-3">Time</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Template</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Recipient</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Status</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Source</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Error</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-paper/10 last:border-b-0 align-top">
                  <td className="px-4 py-3 whitespace-nowrap text-paper/55">
                    {new Date(r.created_at).toLocaleString("en-GB", { timeZone: "UTC" })} UTC
                  </td>
                  <td className="px-4 py-3">{r.template}</td>
                  <td className="px-4 py-3 break-all">{r.to}</td>
                  <td className="px-4 py-3">
                    <span className={`label ${r.status === "failed" ? "text-accent" : "text-paper/55"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.source}
                    {r.tenant_id && (
                      <span className="label text-paper/35 block break-all">{r.tenant_id}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-paper/55 break-words">{r.error ?? ""}</td>
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
