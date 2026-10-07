// Pure helpers for the promote-quote form, kept out of the component so they
// run under node:test.

const LINK_VALUES = ["linked", "taken", "failed"];

// The backend's `quote_link` is one of linked / taken / failed. A backend that
// predates it only sends the boolean `quote_linked`, so fall back to that.
// Anything unrecognised counts as "failed", never as success.
export function normalizeQuoteLink(quoteLink, quoteLinked) {
  if (typeof quoteLink === "string" && LINK_VALUES.includes(quoteLink)) return quoteLink;
  return quoteLinked === true ? "linked" : "failed";
}

// The notice to show once the tenant exists, or null when the quote is linked.
// "taken": a concurrent promote linked and closed the quote, so the admin has
// a duplicate tenant to suspend, not a quote to close.
export function promoteNotice(quoteLink, tenantName) {
  if (quoteLink === "linked") return null;
  if (quoteLink === "taken") {
    return (
      "Another admin promoted this quote at the same moment, so the quote stays linked to their tenant. " +
      `Tenant ${tenantName} was created too: suspend it from the Tenants page if you do not need it.`
    );
  }
  return "The tenant was created but the quote could not be linked to it. Close the quote by hand.";
}

// Synchronous in-flight guard over a React ref ({ current: boolean }). State
// read from a closure can be stale when two submits land in the same render;
// a ref is not. enterOnce returns false when a request is already running.
export function enterOnce(ref) {
  if (ref.current) return false;
  ref.current = true;
  return true;
}

export function leave(ref) {
  ref.current = false;
}
