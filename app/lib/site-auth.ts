import "server-only";
import { cookies } from "next/headers";
import { getSitePassword, getStundenFormPassword } from "./env";

export const SITE_ACCESS_COOKIE = "stundenalfio_access";

export function isSitePasswordValid(password: string) {
  return password === getSitePassword();
}

export function isStundenFormPasswordValid(password: string) {
  return password === getStundenFormPassword();
}

export async function hasSiteAccess() {
  const cookieStore = await cookies();
  return cookieStore.get(SITE_ACCESS_COOKIE)?.value === "granted";
}
