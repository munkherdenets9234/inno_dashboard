import test from "node:test";
import assert from "node:assert/strict";
import { isRealEstate, productServiceFor, validateAdminInvite } from "./product-service.mjs";

const env = { DIGITALSERVICE_URL: "http://ds/api/v1/", REALSTATE_SERVICE_URL: "http://rs/api/v1" };

test("realestate module selects the real state service", () => {
  assert.deepEqual(productServiceFor(["cms", "realestate"], env), {
    product: "realestate",
    baseUrl: "http://rs/api/v1",
  });
});

test("other or missing modules keep digitalservice", () => {
  assert.equal(productServiceFor(["cms"], env).product, "digitalservice");
  assert.equal(productServiceFor(null, env).baseUrl, "http://ds/api/v1");
  assert.equal(isRealEstate(undefined), false);
});

test("unset url means not configured", () => {
  assert.equal(productServiceFor(["realestate"], { DIGITALSERVICE_URL: "x" }).baseUrl, null);
  assert.equal(productServiceFor([], { REALSTATE_SERVICE_URL: "  " }).baseUrl, null);
});

test("invite validation", () => {
  assert.deepEqual(validateAdminInvite({ name: " Bat ", email: " a@b.mn " }), { name: "Bat", email: "a@b.mn" });
  assert.ok(validateAdminInvite({ name: "", email: "a@b.mn" }).error);
  assert.ok(validateAdminInvite({ name: "Bat", email: "nope" }).error);
  assert.ok(validateAdminInvite({ name: "Bat", email: "a b@c.mn" }).error);
});
