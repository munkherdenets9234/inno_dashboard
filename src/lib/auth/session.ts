// Session handling for the platform superadmin login (POST /admin/login).
// The backend's Bearer token is Ed25519-signed and verified on every
// request — we don't re-verify it here, we just carry it in an httpOnly
// cookie so the browser never sees it directly. A 401 from the API means the
// token is gone/expired; callers should treat that as "not logged in" and
// send the user to /login.
import { cookies } from "next/headers";
import { apiPost } from "@/lib/api/client";

// Deliberately not "admin_session" — that name is already used by the
// tenant-scoped admin apps (innonomads/site, digitalbrochure/admin). Cookies
// aren't port-scoped, so on localhost during side-by-side local dev, two
// apps sharing a cookie name on the same host would silently read each
// other's session.
const COOKIE_NAME = "digitalservice_platform_session";
// Deliberately LONGER than tenantcore's TOKEN_TTL (1h in this deployment,
// capped at 24h). The cookie is not the authority on whether the session is
// alive — the token inside it is, and tenantcore decides that. When the
// token expires first, the next API call 401s and lib/api/client.ts clears
// this cookie and sends the user to /login, so the mismatch is self-healing
// rather than something these two numbers have to be kept in step about.
const COOKIE_MAX_AGE = 60 * 60 * 24;

interface LoginResponse {
  token: string;
  // tenantcore also returns `user`, unused here — this app only needs the
  // token to carry as a Bearer credential.
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
  const { data } = await apiPost<LoginResponse>("/admin/login", { email, password });
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
