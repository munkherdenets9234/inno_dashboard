"use server";

import { redirect } from "next/navigation";
import { login } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/client";

export interface LoginState {
  error?: string;
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    await login(email, password);
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.status === 401 ? "Invalid email or password." : err.message };
    }
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/tenants");
}
