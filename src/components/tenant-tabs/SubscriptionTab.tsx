import { safeLoad } from "@/lib/api/safe";
import { getTenantSubscription, listPlanOptions } from "@/lib/data/subscription";
import SubscriptionPanel from "@/components/SubscriptionPanel";
import {
  subscribeAction,
  changePlanAction,
  renewSubscriptionAction,
  cancelSubscriptionAction,
  setBillingDayAction,
} from "@/app/admin/(console)/tenants/actions";

export default async function SubscriptionTab({ id }: { id: string }) {
  const [subscription, plansRes] = await Promise.all([
    getTenantSubscription(id),
    safeLoad(() => listPlanOptions()),
  ]);

  return !plansRes.ok ? (
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
  );
}
