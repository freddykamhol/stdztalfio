import "server-only";

import type { Prisma } from "@prisma/client";
import { getPrismaClient } from "./prisma";
import {
  STANDARD_STUNDEN_EINTRAGSART,
  buildMonatId,
  formatDatumUtc,
  formatDatumInputUtc,
  formatUhrzeitUtc,
  getMonatLabel,
  istStundenEintragsart,
  type StundenzettelEintrag,
  type StundenzettelMonat,
  type StundenzettelSummen,
} from "./stundenzettel";

type StundeRow = Prisma.StundeGetPayload<{
  include: {
    bildNotizen: true;
  };
}>;

function mapEintrag(row: StundeRow): StundenzettelEintrag {
  return {
    id: row.id,
    datumText: formatDatumUtc(row.datum),
    datumInput: formatDatumInputUtc(row.datum),
    bemerkung: row.bemerkung,
    beginnText: formatUhrzeitUtc(row.beginn),
    beginnInput: formatUhrzeitUtc(row.beginn) ?? "",
    endeText: formatUhrzeitUtc(row.ende),
    endeInput: formatUhrzeitUtc(row.ende) ?? "",
    pauseMinuten: row.pauseDauer,
    stunden: Number(row.stundenGes),
    tankKosten: Number(row.tankKosten),
    tankKostenInput: Number(row.tankKosten).toFixed(2),
    eintragsart: istStundenEintragsart(row.eintragsart)
      ? row.eintragsart
      : STANDARD_STUNDEN_EINTRAGSART,
    bildNotizen: row.bildNotizen.map((bildNotiz) => ({
      id: bildNotiz.id,
      titel: bildNotiz.titel,
      url: bildNotiz.bildPfad,
    })),
  };
}

function berechneSummen(eintraege: StundenzettelEintrag[]): StundenzettelSummen {
  return eintraege.reduce(
    (summe, eintrag) => ({
      eintraege: summe.eintraege + 1,
      pauseMinuten: summe.pauseMinuten + eintrag.pauseMinuten,
      stunden: summe.stunden + eintrag.stunden,
      tankKosten: summe.tankKosten + eintrag.tankKosten,
      uebernachtungen: summe.uebernachtungen + Number(eintrag.eintragsart === "UEBERNACHTUNG"),
      urlaubstage: summe.urlaubstage + Number(eintrag.eintragsart === "URLAUB"),
      kranktage: summe.kranktage + Number(eintrag.eintragsart === "KRANK"),
    }),
    {
      eintraege: 0,
      pauseMinuten: 0,
      stunden: 0,
      tankKosten: 0,
      uebernachtungen: 0,
      urlaubstage: 0,
      kranktage: 0,
    },
  );
}

function buildMonat(jahr: number, monat: number, rows: StundeRow[]): StundenzettelMonat {
  const eintraege = rows.map(mapEintrag);

  return {
    id: buildMonatId(jahr, monat),
    jahr,
    monat,
    monatLabel: getMonatLabel(jahr, monat),
    pdfHref: `/api/stundenzettel/${jahr}/${String(monat).padStart(2, "0")}/pdf`,
    summen: berechneSummen(eintraege),
    eintraege,
  };
}

export async function getStundenzettelMonate() {
  const prisma = getPrismaClient();
  const rows = await prisma.stunde.findMany({
    include: {
      bildNotizen: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: [{ datum: "desc" }, { beginn: "desc" }],
  });

  const gruppiert = new Map<string, { jahr: number; monat: number; rows: StundeRow[] }>();

  for (const row of rows) {
    const jahr = row.datum.getUTCFullYear();
    const monat = row.datum.getUTCMonth() + 1;
    const id = buildMonatId(jahr, monat);
    const gruppe = gruppiert.get(id);

    if (gruppe) {
      gruppe.rows.push(row);
      continue;
    }

    gruppiert.set(id, { jahr, monat, rows: [row] });
  }

  return Array.from(gruppiert.values()).map((gruppe) =>
    buildMonat(gruppe.jahr, gruppe.monat, gruppe.rows),
  );
}

export async function getStundenzettelMonat(jahr: number, monat: number) {
  const prisma = getPrismaClient();
  const start = new Date(Date.UTC(jahr, monat - 1, 1, 0, 0, 0));
  const ende = new Date(Date.UTC(jahr, monat, 1, 0, 0, 0));

  const rows = await prisma.stunde.findMany({
    include: {
      bildNotizen: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      },
    },
    where: {
      datum: {
        gte: start,
        lt: ende,
      },
    },
    orderBy: [{ datum: "asc" }, { beginn: "asc" }],
  });

  if (rows.length === 0) {
    return null;
  }

  return buildMonat(jahr, monat, rows);
}
