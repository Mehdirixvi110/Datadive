"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { hasAuthCreds } from "@/lib/utils";

/**
 * Sign the admin out and return to the login page (design §9). Guards on
 * `hasAuthCreds()` first so it never invokes Auth.js when sign-in is not
 * configured (the no-creds admin shell renders no SignOut, but the guard keeps
 * this safe regardless).
 */
export async function signOutAction(): Promise<void> {
  if (!hasAuthCreds()) redirect("/admin/login");
  await signOut({ redirectTo: "/admin/login" });
}

/**
 * Start the Google OAuth sign-in and return to `/admin` on success (design §9).
 * Guards on `hasAuthCreds()` first; the login page only renders the button when
 * sign-in is configured, so this is a defensive short-circuit.
 */
export async function signInWithGoogle(): Promise<void> {
  if (!hasAuthCreds()) redirect("/admin/login?error=Configuration");
  await signIn("google", { redirectTo: "/admin" });
}
