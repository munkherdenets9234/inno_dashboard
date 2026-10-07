import { safeLoad } from "@/lib/api/safe";
import { listServiceClients } from "@/lib/data/tenant-detail";
import { CreateServiceKeyForm, ServiceKeyRowActions } from "@/components/ServiceKeyPanels";
import {
  createServiceClientAction,
  revokeServiceClientAction,
  rotateServiceClientAction,
} from "./actions";

function formatDate(iso?: string | null) {
  if (!iso) return "never";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toISOString().slice(0, 16).replace("T", " ");
}

export default async function ServiceKeysPage() {
  const result = await safeLoad(() => listServiceClients());
  const clients = result.ok ? result.data : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Service keys</h1>
        <p className="label text-paper/35 mt-1">
          Keys the platform&apos;s product services use to call tenantcore. A raw key is shown once, when created or
          rotated.
        </p>
      </div>

      <CreateServiceKeyForm action={createServiceClientAction} />

      {!result.ok ? (
        <p className="label text-accent">{result.message}</p>
      ) : clients.length === 0 ? (
        <p className="label text-paper/35 py-16 text-center border border-paper/10">No service keys yet.</p>
      ) : (
        <div className="border border-paper/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper/10 text-left">
                <th className="label text-paper/35 font-normal px-4 py-3">Service</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Key</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Status</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Created (UTC)</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Last seen (UTC)</th>
                <th className="label text-paper/35 font-normal px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-paper/10 last:border-b-0">
                  <td className="px-4 py-3 align-top">{c.name}</td>
                  <td className="px-4 py-3 align-top font-mono text-paper/70">•••• {c.key_last4}</td>
                  <td className="px-4 py-3 align-top">
                    <span className={`label ${c.status === "active" ? "text-paper" : "text-paper/35"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top text-paper/70">{formatDate(c.created_at)}</td>
                  <td className="px-4 py-3 align-top text-paper/70">{formatDate(c.last_seen_at)}</td>
                  <td className="px-4 py-3 align-top">
                    {c.status === "active" && (
                      <ServiceKeyRowActions
                        name={c.name}
                        rotate={rotateServiceClientAction.bind(null, c.id)}
                        revoke={revokeServiceClientAction.bind(null, c.id)}
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
