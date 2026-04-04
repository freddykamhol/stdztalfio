"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isSitePasswordValid, isStundenFormPasswordValid, SITE_ACCESS_COOKIE } from "../lib/site-auth";

export type AuthState = {
  error: string | null;
  unlocked?: boolean;
};

export async function unlockSite(_: AuthState, formData: FormData): Promise<AuthState> {
  const password = formData.get("password");

  if (typeof password !== "string" || !isSitePasswordValid(password)) {
    return { error: "Das Passwort ist nicht korrekt." };
  }

  const cookieStore = await cookies();
  cookieStore.set(SITE_ACCESS_COOKIE, "granted", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/");
}

export async function verifyStundenFormPassword(
  _: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = formData.get("password");

  if (typeof password !== "string" || !isStundenFormPasswordValid(password)) {
    return { error: "Das Passwort ist nicht korrekt.", unlocked: false };
  }

  return { error: null, unlocked: true };
}

export async function lockSite() {
  const cookieStore = await cookies();
  cookieStore.delete(SITE_ACCESS_COOKIE);
  redirect("/");
}
