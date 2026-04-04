import { hasSiteAccess } from "./lib/site-auth";
import { getStundenzettelMonate } from "./lib/stundenzettel-data";

function getDashboardProblem(error: unknown) {
  const technicalDetail = error instanceof Error ? error.message : "Unbekannter Serverfehler.";
  const normalizedDetail = technicalDetail.toLowerCase();

  if (normalizedDetail.includes("database_url")) {
    return {
      title: "Die Übersicht ist noch nicht mit der Datenbank verbunden.",
      description:
        "Die Anmeldung war erfolgreich, aber der Server hat keine Datenbank-Verbindung für die Stundenzettel gefunden.",
      hint: "Lege auf dem Server `DATABASE_URL` an und starte die Anwendung danach neu.",
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
    normalizedDetail.includes("p1001") ||
    normalizedDetail.includes("econnrefused") ||
    normalizedDetail.includes("can't reach database server") ||
    normalizedDetail.includes("connect")
  ) {
    return {
      title: "Die Übersicht kann die Datenbank gerade nicht erreichen.",
      description:
        "Die Anmeldung war erfolgreich, aber der Server bekommt im nächsten Schritt keine Verbindung zur Datenbank.",
      hint: "Prüfe auf dem Server die Datenbank-Zugangsdaten, den Host und ob PostgreSQL erreichbar ist.",
      technicalDetail,
    };
  }

  return {
    title: "Die Übersicht konnte gerade nicht geladen werden.",
    description:
      "Die Anmeldung war erfolgreich, aber beim Laden der gespeicherten Stunden ist serverseitig ein Fehler aufgetreten.",
    hint: "Prüfe die Server-Logs und die Datenbank-Konfiguration, dann lade die Seite erneut.",
    technicalDetail,
  };
}

export default async function HomePage() {
  const hasAccess = await hasSiteAccess();

  if (!hasAccess) {
    const { AccessGate } = await import("./components/access-gate");
    return <AccessGate />;
  }

  try {
    const monate = await getStundenzettelMonate();
    const { StundenzettelDashboard } = await import("./components/stundenzettel-dashboard");

    return <StundenzettelDashboard monate={monate} />;
  } catch (error) {
    console.error("Dashboard konnte nach Freischaltung nicht geladen werden.", error);
    const { DashboardUnavailable } = await import("./components/dashboard-unavailable");
    const problem = getDashboardProblem(error);

    return <DashboardUnavailable {...problem} />;
  }
}
