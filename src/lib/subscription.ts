// Date arithmetic for the Subscription page. Pure, and a deliberate mirror of
// tenantcore's billingAlignedEnd, renewedEnd and daysLeft: the page shows the
// end date an action WILL produce before the operator submits, so these must
// agree with the server. If either changes there, change it here.

export const DEFAULT_PERIOD_DAYS = 30;
export const DEFAULT_BILLING_DAY = 20;

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/** The 29th to 31st do not exist in every month, so a billing day is 1 to 28. */
export function validBillingDay(d: number): boolean {
  return Number.isInteger(d) && d >= 1 && d <= 28;
}

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
 * The first billing-day date, at 00:00 UTC, that leaves a full enough period
 * after `base`.
 *
 * The business bills on the 20th, so a subscription should end on the 20th and
 * stay there. The floor, at most 15 days, stops a renewal made just before the
 * billing day producing a 5-day period; it is capped because for a long plan the
 * extra length comes from whole months added afterwards, not from the floor.
 */
export function billingAlignedEnd(base: Date, periodDays: number, billingDay: number): Date {
  const floor = Math.min(Math.max(periodDays * 12 * HOUR_MS, DAY_MS), 15 * DAY_MS);
  const earliest = new Date(base.getTime() + floor);

  let end = Date.UTC(earliest.getUTCFullYear(), earliest.getUTCMonth(), billingDay);
  if (end < earliest.getTime()) {
    end = Date.UTC(earliest.getUTCFullYear(), earliest.getUTCMonth() + 1, billingDay);
  }

  const months = Math.max(1, Math.floor((periodDays + 15) / 30)); // 90 days is three months
  const first = new Date(end);
  // billingDay is at most 28, so the date exists in every month and Date.UTC's
  // month overflow never has to roll a day over.
  return new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + months - 1, billingDay));
}

/**
 * The period end an action will produce.
 *
 * "renew" starts from the later of today and the current end, so a live
 * subscription keeps the days already paid for. "change" starts from today,
 * which DISCARDS the days remaining. That difference is the reason the page
 * shows this before submit.
 */
export function projectedEnd(
  mode: "change" | "renew",
  now: Date,
  currentEnd: Date,
  periodDays: number,
  billingDay: number,
): Date {
  const base = mode === "renew" && currentEnd.getTime() > now.getTime() ? currentEnd : now;
  return billingAlignedEnd(base, periodDays, billingDay);
}

/** YYYY-MM-DD in UTC, the same form the expiry email uses for `ends_on`. */
export function formatDay(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 10);
}
