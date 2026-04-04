import "server-only";

import type { Stunde as StundeRow } from "@prisma/client";
import { getPrismaClient } from "./prisma";
import {
  buildMonatId,
  formatDatumUtc,
  formatDatumInputUtc,
  formatUhrzeitUtc,
  getMonatLabel,
  type StundenzettelEintrag,
  type StundenzettelMonat,
  type StundenzettelSummen,
} from "./stundenzettel";

function mapEintrag(row: StundeRow): StundenzettelEintrag {
  return {
    id: row.id,
    datumText: formatDatumUtc(row.datum),
    datumInput: formatDatumInputUtc(row.datum),
    baustelle: row.baustellen,
    beginnText: formatUhrzeitUtc(row.beginn),
    beginnInput: formatUhrzeitUtc(row.beginn),
    endeText: formatUhrzeitUtc(row.ende),
    endeInput: formatUhrzeitUtc(row.ende),
    pauseMinuten: row.pauseDauer,
    stunden: Number(row.stundenGes),
    tankKosten: Number(row.tankKosten),
    tankKostenInput: Number(row.tankKosten).toFixed(2),
    uebernachtung: row.uebernachtung,
    bildNotizUrl: row.bildNotizPfad,
  };
}

function berechneSummen(eintraege: StundenzettelEintrag[]): StundenzettelSummen {
  return eintraege.reduce(
    (summe, eintrag) => ({
      eintraege: summe.eintraege + 1,
      pauseMinuten: summe.pauseMinuten + eintrag.pauseMinuten,
      stunden: summe.stunden + eintrag.stunden,
      tankKosten: summe.tankKosten + eintrag.tankKosten,
      uebernachtungen: summe.uebernachtungen + Number(eintrag.uebernachtung),
    }),
    { eintraege: 0, pauseMinuten: 0, stunden: 0, tankKosten: 0, uebernachtungen: 0 },
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
