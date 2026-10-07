import test from "node:test";
import assert from "node:assert/strict";
import { promoteNotice, normalizeQuoteLink, enterOnce, leave } from "./promote.mjs";

test("linked gives no notice", () => {
  assert.equal(promoteNotice("linked", "Acme"), null);
});

test("taken names the tenant and says to suspend it", () => {
  const msg = promoteNotice("taken", "Acme Travel");
  assert.equal(
    msg,
    "Another admin promoted this quote at the same moment, so the quote stays linked to their tenant. " +
      "Tenant Acme Travel was created too: suspend it from the Tenants page if you do not need it.",
  );
  assert.ok(!/close the quote by hand/i.test(msg));
});

test("failed keeps the close-by-hand wording", () => {
  assert.equal(
    promoteNotice("failed", "Acme"),
    "The tenant was created but the quote could not be linked to it. Close the quote by hand.",
  );
});

test("an unknown value is treated as failed, never as success", () => {
  assert.match(promoteNotice("weird", "Acme"), /Close the quote by hand/);
  assert.match(promoteNotice(undefined, "Acme"), /Close the quote by hand/);
});

test("normalizeQuoteLink passes the three values through", () => {
  for (const v of ["linked", "taken", "failed"]) assert.equal(normalizeQuoteLink(v, false), v);
});

test("normalizeQuoteLink falls back to the boolean for an older backend", () => {
  assert.equal(normalizeQuoteLink(undefined, true), "linked");
  assert.equal(normalizeQuoteLink(undefined, false), "failed");
  assert.equal(normalizeQuoteLink("nonsense", true), "linked");
  assert.equal(normalizeQuoteLink(42, false), "failed");
});

test("enterOnce lets exactly one of two quick submits through", () => {
  const ref = { current: false };
  assert.equal(enterOnce(ref), true);
  assert.equal(enterOnce(ref), false);
  leave(ref);
  assert.equal(enterOnce(ref), true);
});
