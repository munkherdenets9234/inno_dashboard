// Date arithmetic for the Subscription page. Pure, and a deliberate mirror of
// tenantcore's service.renewedEnd and daysLeft: the page shows the end date a
// renewal or plan change WILL produce before the operator submits, so these
// must agree with the server. If either changes there, change it here.

export const DEFAULT_PERIOD_DAYS = 30;

const DAY_MS = 86_400_000;

/**
 * Whole days until `end`, rounded UP and never negative.
 *
 * Rounding up matches the server: a subscription with hours left must not read
 * "0 days", and 6 days 23 hours reads 7.
 */
export function daysRemaining(now: Date, end: Date): number {
  const ms = end.getTime() - now.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / DAY_MS);
}

/**
 * The period end an action will produce.
 *
 * "renew" extends from the later of today and the current end, so a live
 * subscription keeps the days already paid for. "change" restarts the period
 * from today, which DISCARDS the days remaining. That difference is the reason
 * the page shows this before submit.
 */
export function projectedEnd(
  mode: "change" | "renew",
  now: Date,
  currentEnd: Date,
  periodDays: number,
): Date {
  const base = mode === "renew" && currentEnd.getTime() > now.getTime() ? currentEnd : now;
  const out = new Date(base.getTime());
  out.setUTCDate(out.getUTCDate() + periodDays);
  return out;
}

/** YYYY-MM-DD in UTC, the same form the expiry email uses for `ends_on`. */
export function formatDay(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 10);
}
