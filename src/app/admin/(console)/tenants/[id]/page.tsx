import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { safeLoad } from "@/lib/api/safe";
import { getTenantById } from "@/lib/data/tenants";
import { listServiceClients, listTenantAdminUsers } from "@/lib/data/tenant-detail";
import { ResetPasswordControl, ServiceKeyRotate, TenantKeyPanel } from "@/components/TenantDetailPanels";
import { resetAdminPasswordAction, rotateServiceKeyAction, rotateTenantKeyAction } from "../actions";

const th = "label text-paper/35 font-normal px-4 py-3";
const td = "px-4 py-3 align-top";

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let tenant;
  try {
    tenant = (await getTenantById(id)).data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  // Each source has its own safeLoad so one failing source degrades only its section.
  const [adminsRes, clientsRes] = await Promise.all([
    safeLoad(() => listTenantAdminUsers(id)),
    safeLoad(() => listServiceClients()),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl">{tenant.name}</h1>
        <p className="label text-paper/35 mt-1">
          {tenant.slug} ·{" "}
          <span className={tenant.status === "active" ? "text-paper" : "text-paper/35"}>{tenant.status}</span> ·{" "}
          {tenant.contact_email || "no contact email"}
        </p>
      </div>

      <TenantKeyPanel last4={tenant.api_key_last4} action={rotateTenantKeyAction.bind(null, id)} />

      <section className="flex flex-col gap-3">
        <h2 className="label text-paper/70">Admin accounts</h2>
        {!adminsRes.ok ? (
          <p className="label text-accent">{adminsRes.message}</p>
        ) : adminsRes.data === null ? (
          <p className="label text-paper/35 border border-paper/10 px-4 py-3">Not configured</p>
        ) : adminsRes.data.length === 0 ? (
          <p className="label text-paper/35 border border-paper/10 px-4 py-3">No admin account in this product</p>
        ) : (
          <div className="border border-paper/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper/10 text-left">
                  <th className={th}>Email</th>
                  <th className={th}>Name</th>
                  <th className={th}>Status</th>
                  <th className={th}></th>
                </tr>
              </thead>
              <tbody>
                {adminsRes.data.map((u) => (
                  <tr key={u.id} className="border-b border-paper/10 last:border-b-0">
                    <td className={td}>{u.email}</td>
                    <td className={`${td} text-paper/70`}>{u.name}</td>
                    <td className={td}>
                      <span className={`label ${u.status === "active" ? "text-paper" : "text-paper/35"}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className={td}>
                      {u.status === "active" && (
                        <ResetPasswordControl email={u.email} action={resetAdminPasswordAction.bind(null, id, u.id)} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="label text-paper/70">Product service keys (shared by all tenants)</h2>
        {!clientsRes.ok ? (
          <p className="label text-accent">{clientsRes.message}</p>
        ) : clientsRes.data.length === 0 ? (
          <p className="label text-paper/35 border border-paper/10 px-4 py-3">No product service keys.</p>
        ) : (
          <div className="border border-paper/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper/10 text-left">
                  <th className={th}>Name</th>
                  <th className={th}>Status</th>
                  <th className={th}>Key</th>
                  <th className={th}>Created</th>
                  <th className={th}></th>
                </tr>
              </thead>
              <tbody>
                {clientsRes.data.map((c) => (
                  <tr key={c.id} className="border-b border-paper/10 last:border-b-0">
                    <td className={td}>{c.name}</td>
                    <td className={td}>
                      <span className={`label ${c.status === "active" ? "text-paper" : "text-paper/35"}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className={`${td} font-mono text-paper/70`}>•••• {c.key_last4}</td>
                    <td className={`${td} text-paper/70`}>{c.created_at.slice(0, 10)}</td>
                    <td className={td}>
                      {c.status === "active" && (
                        <ServiceKeyRotate productName={c.name} action={rotateServiceKeyAction.bind(null, c.id, id)} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
