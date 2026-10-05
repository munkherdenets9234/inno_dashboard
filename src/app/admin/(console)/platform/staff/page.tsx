import { safeLoad } from "@/lib/api/safe";
import { getSession, requireToken } from "@/lib/auth/session";
import { listStaff } from "@/lib/data/platform";
import ConfirmAction from "@/components/ConfirmAction";
import NewStaffForm from "@/components/NewStaffForm";
import Pagination from "@/components/Pagination";
import ResetStaffPasswordButton from "@/components/ResetStaffPasswordButton";
import { createStaffAction, resetStaffPasswordAction, updateStaffStatusAction } from "../actions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; error?: string }>;
}) {
  const { page: rawPage, error } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);
  const limit = 50;
  const token = await requireToken();
  const session = await getSession();

  const result = await safeLoad(() => listStaff(token, page, limit));
  const staff = result.ok ? result.data.data : [];
  const meta = result.ok ? result.data.meta : undefined;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-2xl">Platform staff</h1>
        <p className="label text-paper/35 mt-1">
          The operator&apos;s own accounts. Every one of them is a superadmin — there is one role at this
          level, unlike a tenant&apos;s own users.
        </p>
      </div>

      {error && <p className="label text-accent border border-accent px-4 py-3">{error}</p>}

      <NewStaffForm action={createStaffAction} />

      <p className="label text-paper/35">
        Suspending an account does not take effect until its current token expires — every product verifies
        tokens offline, so there is nothing to revoke. That window is tenantcore&apos;s TOKEN_TTL.
      </p>

      {!result.ok ? (
        <p className="label text-accent">{result.message}</p>
      ) : staff.length === 0 ? (
        <p className="label text-paper/35 py-16 text-center border border-paper/10">No staff accounts.</p>
      ) : (
        <div className="border border-paper/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper/10 text-left">
                <th className="label text-paper/35 font-normal px-4 py-3">Name</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Email</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Status</th>
                <th className="label text-paper/35 font-normal px-4 py-3">Added</th>
                <th className="label text-paper/35 font-normal px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((u) => {
                const isSelf = session?.email?.toLowerCase() === u.email.toLowerCase();
                const suspended = u.status === "suspended";
                return (
                  <tr key={u.id} className="border-b border-paper/10 last:border-b-0">
                    <td className="px-4 py-3 align-top">
                      {u.name || "—"}
                      {isSelf && <span className="label text-paper/35"> (you)</span>}
                    </td>
                    <td className="px-4 py-3 align-top text-paper/70">{u.email}</td>
                    <td className="px-4 py-3 align-top">
                      <span className={`label ${suspended ? "text-paper/35" : "text-paper"}`}>{u.status}</span>
                    </td>
                    <td className="px-4 py-3 align-top text-paper/70">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-3">
                        <ResetStaffPasswordButton
                          action={resetStaffPasswordAction.bind(null, u.id)}
                          email={u.email}
                        />
                        {/* Suspending yourself is allowed by the API as long
                            as someone else is active, and it would sign you
                            out at your token's expiry — worth naming rather
                            than hiding the button. */}
                        <ConfirmAction
                          action={updateStaffStatusAction.bind(null, u.id, suspended ? "active" : "suspended")}
                          confirm={
                            suspended
                              ? `Reactivate ${u.email}?`
                              : isSelf
                                ? "Suspend your OWN account? You will keep working until your token expires, then be locked out."
                                : `Suspend ${u.email}?`
                          }
                          label={suspended ? "Reactivate" : "Suspend"}
                          className="label text-paper/35 hover:text-accent transition-colors"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {meta && <Pagination page={meta.page} limit={meta.limit} total={meta.total} />}
        </div>
      )}
    </div>
  );
}
