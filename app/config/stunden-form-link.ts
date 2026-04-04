export const STUNDEN_FORM_LINK_TOKEN = "8XkSU4b0ImHVihmqlZ6R";

export function isStundenFormLinkTokenValid(token: string | null | undefined) {
  return token === STUNDEN_FORM_LINK_TOKEN;
}

export function getStundenFormLinkPath() {
  return `/stunden/neu?token=${STUNDEN_FORM_LINK_TOKEN}`;
}
