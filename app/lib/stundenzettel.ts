export const STUNDEN_EINTRAGSARTEN = [
  "TAGESEINSATZ",
  "UEBERNACHTUNG",
  "URLAUB",
  "KRANK",
] as const;

export const GANZTAGES_EINTRAGSARTEN = ["URLAUB", "KRANK"] as const;

export type StundenEintragsart = (typeof STUNDEN_EINTRAGSARTEN)[number];

export const STANDARD_STUNDEN_EINTRAGSART: StundenEintragsart = "TAGESEINSATZ";

export const STUNDEN_EINTRAGSART_OPTIONEN: ReadonlyArray<{
  beschreibung: string;
  label: string;
  value: StundenEintragsart;
}> = [
  {
    beschreibung: "Normale Arbeitszeit ohne besondere Kennzeichnung.",
    label: "Tageseinsatz",
    value: "TAGESEINSATZ",
  },
  {
    beschreibung: "Einsatz mit Übernachtung markieren.",
    label: "Übernachtung",
    value: "UEBERNACHTUNG",
  },
  {
    beschreibung: "Den Eintrag als Urlaub markieren.",
    label: "Urlaub",
    value: "URLAUB",
  },
  {
    beschreibung: "Den Eintrag als Krank melden.",
    label: "Krank",
    value: "KRANK",
  },
] as const;

export type StundenzettelEintrag = {
  id: string;
  datumText: string;
  datumInput: string;
  bemerkung: string;
  beginnText: string | null;
  beginnInput: string;
  endeText: string | null;
  endeInput: string;
  stunden: number;
  pauseMinuten: number;
  tankKosten: number;
  tankKostenInput: string;
  eintragsart: StundenEintragsart;
  bildNotizen: StundenzettelBildNotiz[];
};

export type StundenzettelBildNotiz = {
  id: string;
  titel: string;
  url: string;
};

export type StundenzettelSummen = {
  eintraege: number;
  pauseMinuten: number;
  stunden: number;
  tankKosten: number;
  uebernachtungen: number;
  urlaubstage: number;
  kranktage: number;
};

export type StundenzettelMonat = {
  id: string;
  jahr: number;
  monat: number;
  monatLabel: string;
  pdfHref: string;
  summen: StundenzettelSummen;
  eintraege: StundenzettelEintrag[];
};

const waehrungFormatter = new Intl.NumberFormat("de-DE", {
  currency: "EUR",
  minimumFractionDigits: 2,
  style: "currency",
});

const monatFormatter = new Intl.DateTimeFormat("de-DE", {
  month: "long",
  timeZone: "UTC",
});

const eintragsartLabels: Record<StundenEintragsart, string> = {
  KRANK: "Krank",
  TAGESEINSATZ: "Tageseinsatz",
  UEBERNACHTUNG: "Übernachtung",
  URLAUB: "Urlaub",
};

function pad(zahl: number) {
  return String(zahl).padStart(2, "0");
}

function normalizeBemerkung(bemerkung: string) {
  return bemerkung.trim();
}

export function istStundenEintragsart(
  value: string | null | undefined,
): value is StundenEintragsart {
  return STUNDEN_EINTRAGSARTEN.some((eintragsart) => eintragsart === value);
}

export function getStundenEintragsartLabel(eintragsart: StundenEintragsart) {
  return eintragsartLabels[eintragsart];
}

export function istGanztagEintragsart(eintragsart: StundenEintragsart) {
  return eintragsart === "URLAUB" || eintragsart === "KRANK";
}

export function hatStundenZeiten(eintragsart: StundenEintragsart) {
  return !istGanztagEintragsart(eintragsart);
}

export function getStundenEintragTitel(eintragsart: StundenEintragsart, bemerkung: string) {
  const text = normalizeBemerkung(bemerkung);

  if (istGanztagEintragsart(eintragsart)) {
    return getStundenEintragsartLabel(eintragsart);
  }

  return text || getStundenEintragsartLabel(eintragsart);
}

export function getStundenEintragUntertitel(eintragsart: StundenEintragsart, bemerkung: string) {
  const text = normalizeBemerkung(bemerkung);

  if (!text) {
    return null;
  }

  return istGanztagEintragsart(eintragsart) ? text : null;
}

export function getStundenEintragZeitText(
  eintragsart: StundenEintragsart,
  beginnText: string | null,
  endeText: string | null,
) {
  if (!hatStundenZeiten(eintragsart)) {
    return "Ganztägig";
  }

  if (!beginnText || !endeText) {
    return "Offene Zeit";
  }

  return `${beginnText} - ${endeText}`;
}

export function getBildNotizLabel(anzahl: number) {
  return `${anzahl} ${anzahl === 1 ? "Bild" : "Bilder"}`;
}

export function formatEintragsartenZusammenfassung(
  summen: Pick<StundenzettelSummen, "kranktage" | "uebernachtungen" | "urlaubstage">,
  leerText = "Keine Markierungen",
) {
  const teile = [
    summen.uebernachtungen > 0
      ? `${summen.uebernachtungen} ${
          summen.uebernachtungen === 1 ? "Übernachtung" : "Übernachtungen"
        }`
      : null,
    summen.urlaubstage > 0
      ? `${summen.urlaubstage} ${summen.urlaubstage === 1 ? "Urlaubstag" : "Urlaubstage"}`
      : null,
    summen.kranktage > 0
      ? `${summen.kranktage} ${summen.kranktage === 1 ? "Kranktag" : "Kranktage"}`
      : null,
  ].filter((teil): teil is string => Boolean(teil));

  return teile.length > 0 ? teile.join(" · ") : leerText;
}

export function buildMonatId(jahr: number, monat: number) {
  return `${jahr}-${pad(monat)}`;
}

export function getMonatLabel(jahr: number, monat: number) {
  const datum = new Date(Date.UTC(jahr, monat - 1, 1));
  const label = monatFormatter.format(datum);

  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatDatumUtc(datum: Date) {
  return `${pad(datum.getUTCDate())}.${pad(datum.getUTCMonth() + 1)}.${datum.getUTCFullYear()}`;
}

export function formatDatumInputUtc(datum: Date) {
  return `${datum.getUTCFullYear()}-${pad(datum.getUTCMonth() + 1)}-${pad(datum.getUTCDate())}`;
}

export function formatUhrzeitUtc(datum: Date | string | null | undefined) {
  if (!datum) {
    return null;
  }

  if (typeof datum === "string") {
    return datum.slice(0, 5);
  }

  return `${pad(datum.getUTCHours())}:${pad(datum.getUTCMinutes())}`;
}

export function formatStunden(stunden: number) {
  return `${stunden.toLocaleString("de-DE", {
    maximumFractionDigits: 2,
    minimumFractionDigits: stunden % 1 === 0 ? 0 : 2,
  })} h`;
}

export function formatPause(minuten: number) {
  const stunden = Math.floor(minuten / 60);
  const restMinuten = minuten % 60;

  if (stunden === 0) {
    return `${restMinuten} min`;
  }

  if (restMinuten === 0) {
    return `${stunden} h`;
  }

  return `${stunden} h ${restMinuten} min`;
}

export function formatEuro(wert: number) {
  return waehrungFormatter.format(wert);
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}
