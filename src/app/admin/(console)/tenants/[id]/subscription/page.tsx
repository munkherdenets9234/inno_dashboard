import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { safeLoad } from "@/lib/api/safe";
import { getTenantById } from "@/lib/data/tenants";
import { getTenantSubscription, listPlanOptions } from "@/lib/data/subscription";
import SubscriptionPanel from "@/components/SubscriptionPanel";
import {
  subscribeAction,
  changePlanAction,
  renewSubscriptionAction,
  cancelSubscriptionAction,
  setBillingDayAction,
} from "../../actions";

export default async function TenantSubscriptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let tenant;
  try {
    tenant = (await getTenantById(id)).data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const [subscription, plansRes] = await Promise.all([
    getTenantSubscription(id),
    safeLoad(() => listPlanOptions()),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">{tenant.name}</h1>
        <p className="label text-paper/35 mt-1">{tenant.slug} · Subscription</p>
      </div>

      {!plansRes.ok ? (
        <p className="label text-accent">{plansRes.message}</p>
      ) : (
        <SubscriptionPanel
          subscription={subscription}
          plans={plansRes.data}
          // Computed once on the server and passed down. Calling new Date() in
          // the client component would give the server render and the browser
          // two different "now"s, and the days-remaining text would mismatch
          // on hydration whenever a boundary fell between them.
          nowIso={new Date().toISOString()}
          actions={{
            subscribe: subscribeAction.bind(null, id),
            changePlan: changePlanAction.bind(null, id),
            renew: renewSubscriptionAction.bind(null, id),
            cancel: cancelSubscriptionAction.bind(null, id),
            setBillingDay: setBillingDayAction.bind(null, id),
          }}
        />
      )}
    </div>
  );
}
