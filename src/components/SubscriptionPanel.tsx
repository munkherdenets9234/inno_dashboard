"use client";

import { useActionState, useState } from "react";
import { ActionButton } from "@/components/Button";
import { fieldInputClass } from "@/components/AdminField";
import {
  DEFAULT_BILLING_DAY,
  DEFAULT_PERIOD_DAYS,
  daysRemaining,
  formatDay,
  projectedEnd,
  validBillingDay,
} from "@/lib/subscription";
import type { PlanOption } from "@/lib/data/subscription";
import type { SubscriptionFormState } from "@/app/admin/(console)/tenants/actions";
import type { Subscription } from "@/lib/types";

type Action = (prev: SubscriptionFormState, formData: FormData) => Promise<SubscriptionFormState>;

export interface SubscriptionActions {
  subscribe: Action;
  changePlan: Action;
  renew: Action;
  cancel: Action;
  setBillingDay: Action;
}

const STATUS_TONE: Record<Subscription["status"], string> = {
  active: "text-paper",
  trialing: "text-paper",
  past_due: "text-accent",
  canceled: "text-paper/35 line-through",
};

export default function SubscriptionPanel({
  subscription,
  plans,
  nowIso,
  actions,
}: {
  subscription: Subscription | null;
  plans: PlanOption[];
  nowIso: string;
  actions: SubscriptionActions;
}) {
  const now = new Date(nowIso);

  if (!subscription) {
    return (
      <div className="flex flex-col gap-4">
        <p className="label text-paper/55 border border-paper/10 px-4 py-3">
          This tenant has no subscription. Until one exists it is not held to any subscription state, so its writes are
          not blocked.
        </p>
        <PlanForm
          title="Subscribe"
          submitLabel="Subscribe"
          plans={plans}
          initialPlanId={plans[0]?.id ?? ""}
          now={now}
          currentEnd={now}
          remainingDays={0}
          billingDay={DEFAULT_BILLING_DAY}
          askBillingDay
          action={actions.subscribe}
        />
      </div>
    );
  }

  const end = new Date(subscription.current_period_end);
  const canceled = subscription.status === "canceled";
  const lapsed = !canceled && end.getTime() <= now.getTime();
  const remaining = daysRemaining(now, end);
  // The plan can be null: it may have been deleted out from under a live
  // subscription. The billing state is still true and still has to render.
  const periodDays = subscription.plan?.period_days || DEFAULT_PERIOD_DAYS;
  const billingDay = subscription.billing_day || DEFAULT_BILLING_DAY;

  return (
    <div className="flex flex-col gap-8">
      {/* ── Current subscription ── */}
      <div className="border border-paper/10 p-5 grid gap-4 sm:grid-cols-5">
        <Fact label="Plan">
          {subscription.plan ? (
            <>
              {subscription.plan.name}
              <span className="label text-paper/35 block mt-1">
                {subscription.plan.price} {subscription.plan.currency} / {subscription.plan.period_days} days
              </span>
            </>
          ) : (
            <span className="text-paper/55">Plan removed</span>
          )}
        </Fact>
        <Fact label="Status">
          <span className={`label ${STATUS_TONE[subscription.status]}`}>{subscription.status}</span>
        </Fact>
        <Fact label="Period">
          {formatDay(subscription.current_period_start)} → {formatDay(end)}
        </Fact>
        <Fact label="Time left">
          {canceled
            ? subscription.canceled_at
              ? `Cancelled ${formatDay(subscription.canceled_at)}`
              : "Cancelled"
            : lapsed
              ? "Lapsed"
              : `${remaining} ${remaining === 1 ? "day" : "days"}`}
        </Fact>
        <Fact label="Billing day">Day {billingDay} of the month</Fact>
      </div>

      {lapsed && (
        <p className="label text-accent">
          This subscription has lapsed, so the tenant&apos;s writes return 402 until it is renewed.
        </p>
      )}

      {/* ── Renew ── */}
      {canceled ? (
        <p className="label text-paper/55">
          A cancelled subscription cannot be renewed. Change the plan below to reactivate it.
        </p>
      ) : (
        <RenewForm now={now} currentEnd={end} periodDays={periodDays} billingDay={billingDay} action={actions.renew} />
      )}

      {/* ── Billing day ── */}
      <BillingDayForm
        now={now}
        currentEnd={end}
        periodDays={periodDays}
        billingDay={billingDay}
        canceled={canceled}
        action={actions.setBillingDay}
      />

      {/* ── Change plan ── */}
      <PlanForm
        title={canceled ? "Reactivate with a plan" : "Change plan"}
        submitLabel={canceled ? "Reactivate" : "Change plan"}
        plans={plans}
        initialPlanId={subscription.plan_id}
        now={now}
        currentEnd={end}
        remainingDays={canceled ? 0 : remaining}
        billingDay={billingDay}
        action={actions.changePlan}
      />

      {/* ── Cancel ── */}
      {!canceled && <CancelForm action={actions.cancel} />}
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="label text-paper/35">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  );
}

function RenewForm({
  now,
  currentEnd,
  periodDays,
  billingDay,
  action,
}: {
  now: Date;
  currentEnd: Date;
  periodDays: number;
  billingDay: number;
  action: Action;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const next = projectedEnd("renew", now, currentEnd, periodDays, billingDay);

  return (
    <form action={formAction} className="flex flex-col gap-2 border border-paper/10 p-5">
      <span className="label text-paper/70">Renew</span>
      <p className="text-sm text-paper/70">
        Extends the subscription to <strong>{formatDay(next)}</strong>, the next billing day (the {billingDay}th). Days
        already paid for are kept.
      </p>
      <div>
        <ActionButton type="submit" variant="outline" disabled={pending}>
          {pending ? "Renewing…" : "Renew"}
        </ActionButton>
      </div>
      {state.error && <p className="label text-accent">{state.error}</p>}
    </form>
  );
}

function BillingDayForm({
  now,
  currentEnd,
  periodDays,
  billingDay,
  canceled,
  action,
}: {
  now: Date;
  currentEnd: Date;
  periodDays: number;
  billingDay: number;
  canceled: boolean;
  action: Action;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [raw, setRaw] = useState(String(billingDay));
  const day = Number(raw);
  const valid = validBillingDay(day);
  const changed = valid && day !== billingDay;

  return (
    <form action={formAction} className="flex flex-col gap-3 border border-paper/10 p-5">
      <span className="label text-paper/70">Billing day</span>
      <div className="flex items-end gap-3 flex-wrap">
        <input
          name="billing_day"
          type="number"
          min={1}
          max={28}
          step={1}
          aria-label="Billing day"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          className={`${fieldInputClass} max-w-24`}
        />
        <ActionButton type="submit" variant="outline" disabled={pending || !changed}>
          {pending ? "Saving…" : "Save"}
        </ActionButton>
      </div>
      <p className="text-sm text-paper/70">
        This changes <strong>future periods only</strong>. The current period still ends{" "}
        <strong>{formatDay(currentEnd)}</strong>.
        {changed && !canceled && (
          <>
            {" "}
            The next renewal would then end on{" "}
            <strong>{formatDay(projectedEnd("renew", now, currentEnd, periodDays, day))}</strong>.
          </>
        )}
      </p>
      {!valid && raw !== "" && <p className="label text-accent">Use a whole number from 1 to 28.</p>}
      {state.error && <p className="label text-accent">{state.error}</p>}
    </form>
  );
}

function PlanForm({
  title,
  submitLabel,
  plans,
  initialPlanId,
  now,
  currentEnd,
  remainingDays,
  billingDay,
  askBillingDay = false,
  action,
}: {
  title: string;
  submitLabel: string;
  plans: PlanOption[];
  initialPlanId: string;
  now: Date;
  currentEnd: Date;
  remainingDays: number;
  billingDay: number;
  /** Subscribe asks for a billing day; Change plan keeps the subscription's own. */
  askBillingDay?: boolean;
  action: Action;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [planId, setPlanId] = useState(initialPlanId);
  const [rawDay, setRawDay] = useState(String(billingDay));
  const chosen = plans.find((p) => p.id === planId);

  const dayInUse = askBillingDay ? Number(rawDay) : billingDay;
  const dayOk = validBillingDay(dayInUse);
  const next = chosen && dayOk ? projectedEnd("change", now, currentEnd, chosen.period_days, dayInUse) : null;

  if (plans.length === 0) {
    return <p className="label text-paper/35">There are no active plans to choose from.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 border border-paper/10 p-5">
      <span className="label text-paper/70">{title}</span>
      <div className="flex items-end gap-3 flex-wrap">
        <select
          name="plan_id"
          aria-label="Plan"
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          className={fieldInputClass}
        >
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.price} {p.currency}
            </option>
          ))}
        </select>
        {askBillingDay && (
          <label className="flex items-center gap-2 label text-paper/55">
            Billing day
            <input
              name="billing_day"
              type="number"
              min={1}
              max={28}
              step={1}
              value={rawDay}
              onChange={(e) => setRawDay(e.target.value)}
              className={`${fieldInputClass} max-w-20`}
            />
          </label>
        )}
        <ActionButton type="submit" variant="outline" disabled={pending || !chosen || !dayOk}>
          {pending ? "Saving…" : submitLabel}
        </ActionButton>
      </div>
      {next && (
        <p className="text-sm text-paper/70">
          The new period starts today and ends <strong>{formatDay(next)}</strong>, on billing day {dayInUse}.
          {remainingDays > 0 && (
            <>
              {" "}
              <span className="text-accent">
                This replaces the current period, so the {remainingDays} {remainingDays === 1 ? "day" : "days"}{" "}
                remaining are discarded. Use Renew to keep them.
              </span>
            </>
          )}
        </p>
      )}
      {askBillingDay && !dayOk && <p className="label text-accent">Billing day must be a whole number from 1 to 28.</p>}
      {state.error && <p className="label text-accent">{state.error}</p>}
    </form>
  );
}

function CancelForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, {});
  const [confirming, setConfirming] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-2 border border-paper/10 p-5">
      <span className="label text-paper/70">Cancel</span>
      {!confirming ? (
        <div>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="label text-paper/55 hover:text-accent transition-colors"
          >
            Cancel subscription…
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-paper/70">
            Cancel this subscription? The tenant&apos;s writes will return 402. You can undo this by changing the plan,
            which reactivates it with a fresh period.
          </p>
          <div className="flex items-center gap-3">
            <ActionButton type="submit" variant="outline" disabled={pending}>
              {pending ? "Cancelling…" : "Yes, cancel it"}
            </ActionButton>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="label text-paper/55 hover:text-paper transition-colors"
            >
              Keep it
            </button>
          </div>
        </>
      )}
      {state.error && <p className="label text-accent">{state.error}</p>}
    </form>
  );
}
