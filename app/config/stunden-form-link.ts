import { getStundenFormLinkToken } from "../lib/env";

export function isStundenFormLinkTokenValid(token: string | null | undefined) {
  return token === getStundenFormLinkToken();
}

export function getStundenFormLinkPath() {
  return `/stunden/neu?token=${getStundenFormLinkToken()}`;
}
