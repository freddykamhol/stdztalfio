import { notFound } from "next/navigation";
import { StundenForm } from "../../components/stunden-form";
import { isStundenFormLinkTokenValid } from "../../config/stunden-form-link";

function formatiereDatumFuerInput() {
  const teile = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Berlin",
    year: "numeric",
  }).formatToParts(new Date());

  const jahr = teile.find((teil) => teil.type === "year")?.value;
  const monat = teile.find((teil) => teil.type === "month")?.value;
  const tag = teile.find((teil) => teil.type === "day")?.value;

  return `${jahr}-${monat}-${tag}`;
}

type NeueStundenPageProps = {
  searchParams: Promise<{
    token?: string | string[];
  }>;
};

function leseToken(token: string | string[] | undefined) {
  return Array.isArray(token) ? token[0] : token;
}

export default async function NeueStundenPage({ searchParams }: NeueStundenPageProps) {
  const resolvedSearchParams = await searchParams;
  const token = leseToken(resolvedSearchParams.token);

  if (!isStundenFormLinkTokenValid(token)) {
    notFound();
  }

  return <StundenForm accessToken={token} defaultDate={formatiereDatumFuerInput()} />;
}
