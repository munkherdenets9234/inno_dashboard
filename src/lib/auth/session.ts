// Session handling for the platform superadmin login (POST /platform/login).
// The backend's Bearer token is a JWT it verifies on every request — we
// don't re-verify it here, we just carry it in an httpOnly cookie so the
// browser never sees it directly. A 401 from the API means the token is
// gone/expired; callers should treat that as "not logged in" and send the
// user to /login.
import { cookies } from "next/headers";
import { apiPost } from "@/lib/api/client";

// Deliberately not "admin_session" — that name is already used by the
// tenant-scoped admin apps (innonomads/site, digitalbrochure/admin). Cookies
// aren't port-scoped, so on localhost during side-by-side local dev, two
// apps sharing a cookie name on the same host would silently read each
// other's session.
const COOKIE_NAME = "digitalservice_platform_session";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24h, matches the backend's default TOKEN_EXPIRY_HOURS

interface LoginResponse {
  token: string;
}

interface SessionCookie {
  token: string;
  email: string;
}

export class UnauthenticatedError extends Error {
  constructor() {
    super("Not signed in");
    this.name = "UnauthenticatedError";
  }
}

export async function login(email: string, password: string) {
  const { data } = await apiPost<LoginResponse>("/platform/login", { email, password });
  const jar = await cookies();
  const value: SessionCookie = { token: data.token, email };
  jar.set(COOKIE_NAME, JSON.stringify(value), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionCookie | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionCookie;
  } catch {
    return null;
  }
}

export async function requireToken(): Promise<string> {
  const session = await getSession();
  if (!session) throw new UnauthenticatedError();
  return session.token;
}
