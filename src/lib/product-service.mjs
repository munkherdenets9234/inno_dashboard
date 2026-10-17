// Pure helpers for choosing which product service owns a tenant's admin
// accounts, and for the "Add tenant admin" form's convenience validation.
// The server action re-validates; nothing here is a security boundary.

export const REALESTATE_MODULE = "realestate";

/** True when a plan's module list includes the real state module. */
export function isRealEstate(modules) {
  return Array.isArray(modules) && modules.includes(REALESTATE_MODULE);
}

function cleanUrl(raw) {
  const url = typeof raw === "string" ? raw.trim() : "";
  return url ? url.replace(/\/+$/, "") : null;
}

/**
 * Which product service a tenant's admin accounts live in.
 * Real state plans use REALSTATE_SERVICE_URL; every other tenant keeps
 * DIGITALSERVICE_URL. baseUrl is null when that product is not configured.
 */
export function productServiceFor(modules, env) {
  if (isRealEstate(modules)) {
    return { product: "realestate", baseUrl: cleanUrl(env.REALSTATE_SERVICE_URL) };
  }
  return { product: "digitalservice", baseUrl: cleanUrl(env.DIGITALSERVICE_URL) };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns { name, email } trimmed, or { error } with a written message. */
export function validateAdminInvite(input) {
  const name = String(input?.name ?? "").trim();
  const email = String(input?.email ?? "").trim();
  if (!name) return { error: "Enter the admin's name." };
  if (name.length > 100) return { error: "The name is too long." };
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return { error: "Enter a valid email address." };
  }
  return { name, email };
}
