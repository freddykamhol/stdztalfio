export type StundenzettelEintrag = {
  id: string;
  datumText: string;
  datumInput: string;
  baustelle: string;
  beginnText: string;
  beginnInput: string;
  endeText: string;
  endeInput: string;
  stunden: number;
  pauseMinuten: number;
  tankKosten: number;
  tankKostenInput: string;
  uebernachtung: boolean;
  bildNotizUrl: string | null;
};

export type StundenzettelSummen = {
  eintraege: number;
  pauseMinuten: number;
  stunden: number;
  tankKosten: number;
  uebernachtungen: number;
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

function pad(zahl: number) {
  return String(zahl).padStart(2, "0");
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

export function formatUhrzeitUtc(datum: Date | string) {
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
