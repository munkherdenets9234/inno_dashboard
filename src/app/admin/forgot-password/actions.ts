"use server";

import { redirect } from "next/navigation";
import { ApiError, apiPost } from "@/lib/api/client";

// Both routes are public on tenantcore (someone who has forgotten their
// password has nothing to present), so neither call carries a token. That also
// means the client's "401 with a token means the session died" redirect cannot
// fire here, which is what we want: a wrong code must stay on this page.

export interface RequestResetState {
  error?: string;
  // Set once a code has been requested. Deliberately says nothing about whether
  // the address has an account: tenantcore answers the same either way, and
  // this page must not undo that by hinting at the difference.
  sentTo?: string;
}

export interface ConfirmResetState {
  error?: string;
}

// Messages the server writes for the operator are safe to show as they are; the
// ones below are the cases the page has something more useful to say about.
function explain(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) return fallback;
  switch (err.status) {
    case 503:
      return "Email isn't set up on this server, so a code can't be sent. Ask whoever runs the platform to configure the mail credentials.";
    case 429:
      return "Too many attempts. Wait a minute and try again.";
    default:
      return err.message || fallback;
  }
}

export async function requestResetAction(
  _prev: RequestResetState,
  formData: FormData,
): Promise<RequestResetState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter the email address of your account." };

  try {
    await apiPost("/admin/password-reset/request", { email });
  } catch (err) {
    return { error: explain(err, "Something went wrong. Please try again.") };
  }
  return { sentTo: email };
}

export async function confirmResetAction(
  _prev: ConfirmResetState,
  formData: FormData,
): Promise<ConfirmResetState> {
  const email = String(formData.get("email") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const password = String(formData.get("new_password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  // Checked here as well as on the server so the common typos do not spend one
  // of the code's five attempts: tenantcore burns the whole code after five
  // wrong guesses, and a mistyped confirmation is not a guess.
  if (!/^\d{6}$/.test(code)) return { error: "Enter the 6-digit code from the email." };
  if (password.length < 8) return { error: "The new password must be at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords do not match." };

  try {
    await apiPost("/admin/password-reset/confirm", { email, code, new_password: password });
  } catch (err) {
    return { error: explain(err, "Something went wrong. Please try again.") };
  }

  // redirect() works by throwing, so it sits outside the try above or the catch
  // would swallow it. tenantcore issues no session on a reset, so this goes to
  // the sign-in page rather than into the console.
  redirect("/admin/login?reset=1");
}
