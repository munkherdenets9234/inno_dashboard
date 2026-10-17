export const REALESTATE_MODULE: string;
export function isRealEstate(modules: unknown): boolean;
export function productServiceFor(
  modules: string[] | null | undefined,
  env: { DIGITALSERVICE_URL?: string; REALSTATE_SERVICE_URL?: string },
): { product: "realestate" | "digitalservice"; baseUrl: string | null };
export function validateAdminInvite(input: {
  name?: unknown;
  email?: unknown;
}): { name: string; email: string; error?: undefined } | { error: string };
