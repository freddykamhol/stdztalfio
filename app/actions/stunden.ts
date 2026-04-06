"use server";

import { copyFile, mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { isStundenFormLinkTokenValid } from "../config/stunden-form-link";
import { getPrismaClient } from "../lib/prisma";
import { isStundenFormPasswordValid } from "../lib/site-auth";
import {
  STANDARD_STUNDEN_EINTRAGSART,
  getStundenEintragsartLabel,
  istGanztagEintragsart,
  istStundenEintragsart,
  type StundenEintragsart,
} from "../lib/stundenzettel";

export type StundenFormState = {
  message: string | null;
  status: "idle" | "error" | "success";
};

const BILD_NOTIZ_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "stunden-notizen");
const BILD_NOTIZ_DATEI_PFAD = "/uploads/stunden-notizen";
const BILD_NOTIZ_MAX_BYTES = 8 * 1024 * 1024;
const ERLAUBTE_BILD_NOTIZ_TYPEN = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

type ParsedStundeEingaben = {
  bemerkung: string;
  beginn: string | null;
  daten: Date[];
  ende: string | null;
  eintragsart: StundenEintragsart;
  pauseDauer: number;
  stundenGes: number;
  tankKosten: number;
};

type NeueBildNotizVorlage = {
  bytes: Buffer;
  dateiEndung: string;
  titel: string;
};

type BildNotizDatensatz = {
  bildPfad: string;
  position: number;
  titel: string;
};

function zweiStellig(zahl: number) {
  return String(zahl).padStart(2, "0");
}

function leseText(formData: FormData, feld: string) {
  const wert = formData.get(feld);
  return typeof wert === "string" ? wert.trim() : "";
}

function leseTextListe(formData: FormData, feld: string) {
  return formData.getAll(feld).map((wert) => (typeof wert === "string" ? wert.trim() : ""));
}

function parseDatum(datum: string) {
  const teile = datum.split("-").map((teil) => Number.parseInt(teil, 10));

  if (teile.length !== 3 || teile.some((teil) => Number.isNaN(teil))) {
    return null;
  }

  const [jahr, monat, tag] = teile;
  return new Date(Date.UTC(jahr, monat - 1, tag, 0, 0, 0));
}

function parseUhrzeit(uhrzeit: string) {
  const teile = uhrzeit.split(":").map((teil) => Number.parseInt(teil, 10));

  if (teile.length !== 2 || teile.some((teil) => Number.isNaN(teil))) {
    return null;
  }

  const [stunden, minuten] = teile;

  if (stunden < 0 || stunden > 23 || minuten < 0 || minuten > 59) {
    return null;
  }

  return {
    text: `${zweiStellig(stunden)}:${zweiStellig(minuten)}`,
    minutenSeitMitternacht: stunden * 60 + minuten,
  };
}

function parseZahl(wert: string) {
  if (!wert) {
    return 0;
  }

  const normalisiert = wert.replace(",", ".");
  const zahl = Number.parseFloat(normalisiert);

  return Number.isFinite(zahl) ? zahl : null;
}

function buildDatumsbereich(von: Date, bis: Date) {
  const daten: Date[] = [];
  const aktuellesDatum = new Date(von);

  while (aktuellesDatum.getTime() <= bis.getTime()) {
    daten.push(new Date(aktuellesDatum));
    aktuellesDatum.setUTCDate(aktuellesDatum.getUTCDate() + 1);
  }

  return daten;
}

function getDateiTitel(dateiname: string, fallbackIndex: number) {
  const name = path.parse(dateiname).name.trim();
  return name || `Bild ${fallbackIndex}`;
}

function absoluterBildNotizPfad(relativerPfad: string) {
  return path.join(process.cwd(), "public", relativerPfad.replace(/^\/+/, ""));
}

async function loescheBildNotiz(relativerPfad: string | null | undefined) {
  if (!relativerPfad) {
    return;
  }

  try {
    await unlink(absoluterBildNotizPfad(relativerPfad));
  } catch (error) {
    const fsError = error as NodeJS.ErrnoException;

    if (fsError.code !== "ENOENT") {
      throw error;
    }
  }
}

async function loescheBildNotizen(relativerPfade: string[]) {
  for (const relativerPfad of relativerPfade) {
    await loescheBildNotiz(relativerPfad);
  }
}

async function speichereBildNotizInhalt(inhalt: Buffer, dateiEndung: string) {
  await mkdir(BILD_NOTIZ_UPLOAD_DIR, { recursive: true });

  const dateiName = `${Date.now()}-${randomUUID()}${dateiEndung}`;
  const absoluterPfad = path.join(BILD_NOTIZ_UPLOAD_DIR, dateiName);
  const relativerPfad = `${BILD_NOTIZ_DATEI_PFAD}/${dateiName}`;

  await writeFile(absoluterPfad, inhalt);

  return relativerPfad;
}

async function dupliziereBildNotizDatei(relativerPfad: string) {
  const dateiEndung = path.extname(relativerPfad) || ".jpg";
  await mkdir(BILD_NOTIZ_UPLOAD_DIR, { recursive: true });

  const dateiName = `${Date.now()}-${randomUUID()}${dateiEndung}`;
  const absoluterPfad = path.join(BILD_NOTIZ_UPLOAD_DIR, dateiName);
  const relativerZielPfad = `${BILD_NOTIZ_DATEI_PFAD}/${dateiName}`;

  await copyFile(absoluterBildNotizPfad(relativerPfad), absoluterPfad);

  return relativerZielPfad;
}

async function parseNeueBildNotizen(formData: FormData) {
  const titel = leseTextListe(formData, "bildNotizTitel");
  const dateien = formData.getAll("bildNotizDatei");
  const laenge = Math.max(titel.length, dateien.length);
  const vorlagen: NeueBildNotizVorlage[] = [];

  for (let index = 0; index < laenge; index += 1) {
    const titelWert = titel[index] ?? "";
    const dateiWert = dateien[index];
    const datei = dateiWert instanceof File && dateiWert.size > 0 ? dateiWert : null;

    if (!datei) {
      if (titelWert) {
        return {
          data: null as NeueBildNotizVorlage[] | null,
          fehler: "Bitte wähle zu jedem Bild auch eine Datei aus.",
        };
      }

      continue;
    }

    const dateiEndung = ERLAUBTE_BILD_NOTIZ_TYPEN.get(datei.type);

    if (!dateiEndung) {
      return {
        data: null as NeueBildNotizVorlage[] | null,
        fehler: "Bitte lade Bilder nur als JPG, PNG oder WebP hoch.",
      };
    }

    if (datei.size > BILD_NOTIZ_MAX_BYTES) {
      return {
        data: null as NeueBildNotizVorlage[] | null,
        fehler: "Jede Bild-Notiz darf maximal 8 MB groß sein.",
      };
    }

    vorlagen.push({
      bytes: Buffer.from(await datei.arrayBuffer()),
      dateiEndung,
      titel: titelWert || getDateiTitel(datei.name, vorlagen.length + 1),
    });
  }

  return { data: vorlagen, fehler: null as string | null };
}

async function speichereBildNotizVorlagen(
  vorlagen: NeueBildNotizVorlage[],
  positionStart = 0,
): Promise<BildNotizDatensatz[]> {
  const bildNotizen: BildNotizDatensatz[] = [];

  for (let index = 0; index < vorlagen.length; index += 1) {
    const vorlage = vorlagen[index];

    bildNotizen.push({
      bildPfad: await speichereBildNotizInhalt(vorlage.bytes, vorlage.dateiEndung),
      position: positionStart + index,
      titel: vorlage.titel,
    });
  }

  return bildNotizen;
}

async function dupliziereBildNotizen(
  bildNotizen: Array<{
    bildPfad: string;
    position: number;
    titel: string;
  }>,
) {
  const kopien: BildNotizDatensatz[] = [];

  for (let index = 0; index < bildNotizen.length; index += 1) {
    const bildNotiz = bildNotizen[index];

    kopien.push({
      bildPfad: await dupliziereBildNotizDatei(bildNotiz.bildPfad),
      position: index,
      titel: bildNotiz.titel,
    });
  }

  return kopien;
}

function parseStundenEingaben(formData: FormData) {
  const bemerkung = leseText(formData, "bemerkung");
  const datumInput = leseText(formData, "datum");
  const bisDatumInput = leseText(formData, "bisDatum");
  const beginnInput = leseText(formData, "beginn");
  const endeInput = leseText(formData, "ende");
  const pauseInput = leseText(formData, "pauseDauer");
  const tankKostenInput = leseText(formData, "tankKosten");
  const eintragsartInput = leseText(formData, "eintragsart");
  const eintragsart = eintragsartInput
    ? istStundenEintragsart(eintragsartInput)
      ? eintragsartInput
      : null
    : STANDARD_STUNDEN_EINTRAGSART;

  if (!datumInput) {
    return {
      data: null as ParsedStundeEingaben | null,
      fehler: "Bitte wähle ein Datum aus.",
    };
  }

  const datum = parseDatum(datumInput);

  if (!datum) {
    return {
      data: null as ParsedStundeEingaben | null,
      fehler: "Das Datum konnte nicht gelesen werden.",
    };
  }

  if (!eintragsart) {
    return {
      data: null as ParsedStundeEingaben | null,
      fehler: "Bitte wähle eine gültige Eintragsart aus.",
    };
  }

  if (istGanztagEintragsart(eintragsart)) {
    const bisDatum = parseDatum(bisDatumInput || datumInput);

    if (!bisDatum) {
      return {
        data: null as ParsedStundeEingaben | null,
        fehler: "Das Enddatum konnte nicht gelesen werden.",
      };
    }

    if (bisDatum.getTime() < datum.getTime()) {
      return {
        data: null as ParsedStundeEingaben | null,
        fehler: "Das Enddatum darf nicht vor dem Startdatum liegen.",
      };
    }

    return {
      data: {
        bemerkung,
        beginn: null,
        daten: buildDatumsbereich(datum, bisDatum),
        ende: null,
        eintragsart,
        pauseDauer: 0,
        stundenGes: 0,
        tankKosten: 0,
      },
      fehler: null as string | null,
    };
  }

  if (!beginnInput || !endeInput) {
    return {
      data: null as ParsedStundeEingaben | null,
      fehler: "Bitte fülle für Arbeitseinträge Beginn und Ende aus.",
    };
  }

  const beginn = parseUhrzeit(beginnInput);
  const ende = parseUhrzeit(endeInput);
  const pauseDauer = Number.parseInt(pauseInput || "0", 10);
  const tankKosten = parseZahl(tankKostenInput);

  if (!beginn || !ende) {
    return {
      data: null as ParsedStundeEingaben | null,
      fehler: "Beginn oder Ende konnten nicht gelesen werden.",
    };
  }

  if (Number.isNaN(pauseDauer) || pauseDauer < 0) {
    return {
      data: null as ParsedStundeEingaben | null,
      fehler: "Die Pause muss eine gültige Minutenanzahl sein.",
    };
  }

  if (tankKosten === null || tankKosten < 0) {
    return {
      data: null as ParsedStundeEingaben | null,
      fehler: "Bitte gib gültige Tankkosten ein.",
    };
  }

  const arbeitsMinuten = ende.minutenSeitMitternacht - beginn.minutenSeitMitternacht;

  if (arbeitsMinuten <= 0) {
    return {
      data: null as ParsedStundeEingaben | null,
      fehler: "Die Endzeit muss nach der Beginnzeit liegen.",
    };
  }

  if (pauseDauer >= arbeitsMinuten) {
    return {
      data: null as ParsedStundeEingaben | null,
      fehler: "Die Pause darf nicht länger als die Arbeitszeit sein.",
    };
  }

  return {
    data: {
      bemerkung,
      beginn: beginn.text,
      daten: [datum],
      ende: ende.text,
      eintragsart,
      pauseDauer,
      stundenGes: Number(((arbeitsMinuten - pauseDauer) / 60).toFixed(2)),
      tankKosten: Number(tankKosten.toFixed(2)),
    },
    fehler: null as string | null,
  };
}

function formatDezimalwert(wert: number) {
  return wert.toFixed(2).replace(".", ",");
}

function buildStundeDaten(parsed: ParsedStundeEingaben, datum: Date) {
  return {
    datum,
    beginn: parsed.beginn,
    bemerkung: parsed.bemerkung,
    ende: parsed.ende,
    eintragsart: parsed.eintragsart,
    pauseDauer: parsed.pauseDauer,
    stundenGes: parsed.stundenGes,
    tankKosten: parsed.tankKosten,
  };
}

function buildSuccessMessage(parsed: ParsedStundeEingaben, anzahlTage: number, modus: "create" | "update") {
  const prefix = modus === "create" ? "Gespeichert." : "Aktualisiert.";

  if (istGanztagEintragsart(parsed.eintragsart)) {
    return `${prefix} ${anzahlTage} ${
      anzahlTage === 1 ? "Tag" : "Tage"
    } als ${getStundenEintragsartLabel(parsed.eintragsart)} angelegt.`;
  }

  return `${prefix} Gesamtstunden: ${formatDezimalwert(parsed.stundenGes)} h`;
}

function pruefeBearbeitungsPasswort(formData: FormData) {
  const password = leseText(formData, "password");

  if (!password || !isStundenFormPasswordValid(password)) {
    return {
      fehler: "Bitte gib für diese Bearbeitung das Formular-Passwort korrekt ein.",
      password,
    };
  }

  return { fehler: null, password };
}

export async function createStunde(
  _: StundenFormState,
  formData: FormData,
): Promise<StundenFormState> {
  const prisma = getPrismaClient();
  const token = leseText(formData, "token");

  if (!isStundenFormLinkTokenValid(token)) {
    return {
      status: "error",
      message: "Der Formular-Link ist ungültig oder nicht mehr freigegeben.",
    };
  }

  const parsed = parseStundenEingaben(formData);

  if (parsed.fehler || !parsed.data) {
    return {
      status: "error",
      message: parsed.fehler,
    };
  }

  const parsedData = parsed.data;

  const parsedBildNotizen = await parseNeueBildNotizen(formData);

  if (parsedBildNotizen.fehler || !parsedBildNotizen.data) {
    return {
      status: "error",
      message: parsedBildNotizen.fehler,
    };
  }

  for (const datum of parsedData.daten) {
    const bildNotizen = await speichereBildNotizVorlagen(parsedBildNotizen.data);

    await prisma.stunde.create({
      data: {
        ...buildStundeDaten(parsedData, datum),
        bildNotizen: bildNotizen.length > 0 ? { create: bildNotizen } : undefined,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/stunden/neu");

  return {
    status: "success",
    message: buildSuccessMessage(parsedData, parsedData.daten.length, "create"),
  };
}

export async function updateStunde(
  _: StundenFormState,
  formData: FormData,
): Promise<StundenFormState> {
  const prisma = getPrismaClient();
  const { fehler: passwortFehler } = pruefeBearbeitungsPasswort(formData);

  if (passwortFehler) {
    return {
      status: "error",
      message: passwortFehler,
    };
  }

  const id = leseText(formData, "id");

  if (!id) {
    return {
      status: "error",
      message: "Der Eintrag konnte nicht eindeutig erkannt werden.",
    };
  }

  const bestehendeStunde = await prisma.stunde.findUnique({
    where: { id },
    include: {
      bildNotizen: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!bestehendeStunde) {
    return {
      status: "error",
      message: "Der ausgewählte Eintrag wurde nicht gefunden.",
    };
  }

  const parsed = parseStundenEingaben(formData);

  if (parsed.fehler || !parsed.data) {
    return {
      status: "error",
      message: parsed.fehler,
    };
  }

  const parsedData = parsed.data;

  const parsedBildNotizen = await parseNeueBildNotizen(formData);

  if (parsedBildNotizen.fehler || !parsedBildNotizen.data) {
    return {
      status: "error",
      message: parsedBildNotizen.fehler,
    };
  }

  const bildNotizEntfernenIds = new Set(
    formData
      .getAll("bildNotizEntfernenId")
      .filter((wert): wert is string => typeof wert === "string" && wert.length > 0),
  );

  const bildNotizenZumEntfernen = bestehendeStunde.bildNotizen.filter((bildNotiz) =>
    bildNotizEntfernenIds.has(bildNotiz.id),
  );
  const verbleibendeBildNotizen = bestehendeStunde.bildNotizen.filter(
    (bildNotiz) => !bildNotizEntfernenIds.has(bildNotiz.id),
  );
  const neueBildNotizen = await speichereBildNotizVorlagen(
    parsedBildNotizen.data,
    verbleibendeBildNotizen.reduce(
      (maxPosition, bildNotiz) => Math.max(maxPosition, bildNotiz.position + 1),
      0,
    ),
  );

  await prisma.$transaction(async (transaction) => {
    await transaction.stunde.update({
      where: { id },
      data: buildStundeDaten(parsedData, parsedData.daten[0]),
    });

    if (bildNotizenZumEntfernen.length > 0) {
      await transaction.stundeBildNotiz.deleteMany({
        where: { id: { in: bildNotizenZumEntfernen.map((bildNotiz) => bildNotiz.id) } },
      });
    }

    if (neueBildNotizen.length > 0) {
      await transaction.stundeBildNotiz.createMany({
        data: neueBildNotizen.map((bildNotiz) => ({
          ...bildNotiz,
          stundeId: id,
        })),
      });
    }
  });

  if (bildNotizenZumEntfernen.length > 0) {
    await loescheBildNotizen(
      bildNotizenZumEntfernen.map((bildNotiz) => bildNotiz.bildPfad),
    );
  }

  if (parsedData.daten.length > 1) {
    const aktualisierteStunde = await prisma.stunde.findUnique({
      where: { id },
      include: {
        bildNotizen: {
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!aktualisierteStunde) {
      return {
        status: "error",
        message: "Der aktualisierte Eintrag konnte nicht erneut geladen werden.",
      };
    }

    for (const datum of parsedData.daten.slice(1)) {
      const duplizierteBildNotizen = await dupliziereBildNotizen(aktualisierteStunde.bildNotizen);

      await prisma.stunde.create({
        data: {
          ...buildStundeDaten(parsedData, datum),
          bildNotizen:
            duplizierteBildNotizen.length > 0 ? { create: duplizierteBildNotizen } : undefined,
        },
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/stunden/neu");

  return {
    status: "success",
    message: buildSuccessMessage(parsedData, parsedData.daten.length, "update"),
  };
}

export async function deleteStunde(
  _: StundenFormState,
  formData: FormData,
): Promise<StundenFormState> {
  const prisma = getPrismaClient();
  const { fehler: passwortFehler } = pruefeBearbeitungsPasswort(formData);

  if (passwortFehler) {
    return {
      status: "error",
      message: passwortFehler,
    };
  }

  const id = leseText(formData, "id");

  if (!id) {
    return {
      status: "error",
      message: "Der Eintrag konnte nicht eindeutig erkannt werden.",
    };
  }

  const bestehendeStunde = await prisma.stunde.findUnique({
    where: { id },
    include: {
      bildNotizen: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!bestehendeStunde) {
    return {
      status: "error",
      message: "Der ausgewählte Eintrag wurde nicht gefunden.",
    };
  }

  await prisma.stunde.delete({
    where: { id },
  });

  await loescheBildNotizen(bestehendeStunde.bildNotizen.map((bildNotiz) => bildNotiz.bildPfad));

  revalidatePath("/");
  revalidatePath("/stunden/neu");

  return {
    status: "success",
    message: "Der Eintrag wurde gelöscht.",
  };
}
