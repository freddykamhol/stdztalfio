import { AccessGate } from "./components/access-gate";
import { DashboardUnavailable } from "./components/dashboard-unavailable";
import { StundenzettelDashboard } from "./components/stundenzettel-dashboard";
import { hasSiteAccess } from "./lib/site-auth";
import { getStundenzettelMonate } from "./lib/stundenzettel-data";

function getDashboardProblem(error: unknown) {
  const technicalDetail = error instanceof Error ? error.message : "Unbekannter Serverfehler.";
  const normalizedDetail = technicalDetail.toLowerCase();

  if (normalizedDetail.includes("database_url")) {
    return {
      title: "Die Übersicht konnte die Datenbank-Datei nicht vorbereiten.",
      description:
        "Die Anmeldung war erfolgreich, aber die SQLite-Konfiguration für die Stundenzettel ist unvollständig.",
      hint: "Prüfe `DATABASE_URL` oder nutze den Standardpfad in `prisma/data/stundenalfio.db`.",
      technicalDetail,
    };
  }

  if (
    normalizedDetail.includes('relation "stunden" does not exist') ||
    normalizedDetail.includes("the table") ||
    normalizedDetail.includes("does not exist") ||
    normalizedDetail.includes("p2021")
  ) {
    return {
      title: "Die Übersicht ist bereit, aber die Tabelle fehlt noch.",
      description:
        "Die Anwendung konnte sich mit der Datenbank verbinden, aber die gespeicherten Stunden sind auf dem Server noch nicht angelegt.",
      hint: "Führe auf dem Server die Prisma-Migrationen aus, damit die Tabelle `stunden` vorhanden ist.",
      technicalDetail,
    };
  }

  if (
    normalizedDetail.includes("unable to open database file") ||
    normalizedDetail.includes("readonly database") ||
    normalizedDetail.includes("permission denied") ||
    normalizedDetail.includes("p1003") ||
    normalizedDetail.includes("p1001") ||
    normalizedDetail.includes("econnrefused") ||
    normalizedDetail.includes("can't reach database server") ||
    normalizedDetail.includes("connect")
  ) {
    return {
      title: "Die Übersicht kann die SQLite-Datei gerade nicht öffnen.",
      description:
        "Die Anmeldung war erfolgreich, aber der Server kann im nächsten Schritt nicht auf die Datenbank-Datei zugreifen.",
      hint: "Prüfe auf dem Server die Schreibrechte für `prisma/data` und ob `npm start` die Migrationen ausführen konnte.",
      technicalDetail,
    };
  }

  return {
    title: "Die Übersicht konnte gerade nicht geladen werden.",
    description:
      "Die Anmeldung war erfolgreich, aber beim Laden der gespeicherten Stunden ist serverseitig ein Fehler aufgetreten.",
    hint: "Prüfe die Server-Logs, die SQLite-Datei und die Migrationen, dann lade die Seite erneut.",
    technicalDetail,
  };
}

export default async function HomePage() {
  const hasAccess = await hasSiteAccess();

  if (!hasAccess) {
    return <AccessGate />;
  }

  let monate: Awaited<ReturnType<typeof getStundenzettelMonate>> = [];
  let problem: ReturnType<typeof getDashboardProblem> | null = null;

  try {
    monate = await getStundenzettelMonate();
  } catch (error) {
    console.error("Dashboard konnte nach Freischaltung nicht geladen werden.", error);
    problem = getDashboardProblem(error);
  }

  if (problem) {
    return <DashboardUnavailable {...problem} />;
  }

  return <StundenzettelDashboard monate={monate} />;
}
