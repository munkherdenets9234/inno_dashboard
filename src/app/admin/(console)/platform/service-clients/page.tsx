import { safeLoad } from "@/lib/api/safe";
import { requireToken } from "@/lib/auth/session";
import { listServiceClients } from "@/lib/data/platform";
import ConfirmAction from "@/components/ConfirmAction";
import NewServiceClientForm from "@/components/NewServiceClientForm";
import { createServiceClientAction, revokeServiceClientAction } from "../actions";

function formatDate(iso?: string) {
  if (!iso) return "never";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ServiceClientsPage() {  const token = await requireToken();

  const result = await safeLoad(() => listServiceClients(token));
  const clients = result.ok ? result.data.data : [];

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-2xl">Service clients</h1>
        <p className="label text-paper/35 mt-1">
          The product services allowed to ask tenantcore what a tenant may run. One key each, so revoking a
          leaked one does not take the others down with it.
        </p>
      </div>

      <NewServiceClientForm action={createServiceClientAction} />

      {!result.ok ? (
        <p className="label text-accent">{result.message}</p>
      ) : clients.length === 0 ? (
        <p className="label text-paper/35 py-16 text-center border border-paper/10">
          No services registered yet.
        </p>
      ) : (
        <div className="border border-paper/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper/10 text-left">
                <th className="label text-paper/35 font-normal px-4 py-3">Service</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Key</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Status</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Last seen</th>
                <th className="label text-paper/35 font-normal px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-paper/10 last:border-b-0">
                  <td className="px-4 py-3 align-top">{c.name}</td>
                  <td className="px-4 py-3 align-top text-paper/70">…{c.key_last4}</td>
                  <td className="px-4 py-3 align-top">
                    <span className={`label ${c.status === "active" ? "text-paper" : "text-paper/35"}`}>
                      {c.status}
                    </span>
                  </td>
                  {/* Stamped on each successful authentication. This column is
                      how you find out a service you thought was retired is
                      still calling, or that a live one stopped a week ago. */}
                  <td className="px-4 py-3 align-top text-paper/70">{formatDate(c.last_seen_at)}</td>
                  <td className="px-4 py-3 align-top">
                    {c.status === "active" && (
                      <ConfirmAction
                        action={revokeServiceClientAction.bind(null, c.id)}
                        confirm={`Revoke ${c.name}'s key? That service stops getting entitlement answers immediately and will need a new key deployed.`}
                        label="Revoke"
                        className="label text-paper/35 hover:text-accent transition-colors"
                      />
                    )}
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
