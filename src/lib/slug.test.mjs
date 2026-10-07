import test from "node:test";
import assert from "node:assert/strict";
import { suggestSlug } from "./slug.mjs";

test("plain company name", () => {
  assert.equal(suggestSlug("Acme Travel LLC"), "acme-travel-llc");
});

test("punctuation runs collapse and edges trim", () => {
  assert.equal(suggestSlug("  --Hello__World!! "), "hello-world");
});

test("non-ASCII only input gives empty", () => {
  assert.equal(suggestSlug("\u041c\u043e\u043d\u0433\u043e\u043b \u0410\u044f\u043b\u0430\u043b"), "");
  assert.equal(suggestSlug("\uc11c\uc6b8 \ud22c\uc5b4"), "");
});

test("accents leave ASCII-only output with single hyphens", () => {
  const out = suggestSlug("Caf\u00e9 M\u00fcnch");
  assert.match(out, /^[a-z0-9-]+$/);
  assert.ok(!out.includes("--"));
  assert.ok(!out.startsWith("-") && !out.endsWith("-"));
});

test("empty and symbol-only input give empty", () => {
  assert.equal(suggestSlug(""), "");
  assert.equal(suggestSlug("!!!"), "");
});

test("long input is cut to 40 without trailing hyphen", () => {
  const out = suggestSlug("abcdefghi ".repeat(20));
  assert.ok(out.length <= 40);
  assert.ok(!out.endsWith("-"));
  assert.ok(out.length > 0);
  assert.equal(suggestSlug("a".repeat(39) + " bbbbb"), "a".repeat(39));
});

test("never throws for non-string input", () => {
  for (const v of [undefined, null, 42, {}, [], NaN]) {
    assert.equal(suggestSlug(v), "");
  }
});
