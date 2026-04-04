import "server-only";
import { cookies } from "next/headers";

export const SITE_ACCESS_COOKIE = "stundenalfio_access";

export function getSitePassword() {
  return process.env.SITE_PASSWORD ?? "Passwort";
}

export function isSitePasswordValid(password: string) {
  return password === getSitePassword();
}

export function getStundenFormPassword() {
  return process.env.STUNDEN_FORM_PASSWORD ?? "Passwort2";
}

export function isStundenFormPasswordValid(password: string) {
  return password === getStundenFormPassword();
}

export async function hasSiteAccess() {
  const cookieStore = await cookies();
  return cookieStore.get(SITE_ACCESS_COOKIE)?.value === "granted";
}
