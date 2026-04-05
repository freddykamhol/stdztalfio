"use server";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { isStundenFormLinkTokenValid } from "../config/stunden-form-link";
import { getPrismaClient } from "../lib/prisma";
import { isStundenFormPasswordValid } from "../lib/site-auth";

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
  baustellen: string;
  beginn: string;
  datum: Date;
  ende: string;
  pauseDauer: number;
  stundenGes: number;
  tankKosten: number;
  uebernachtung: boolean;
};

function zweiStellig(zahl: number) {
  return String(zahl).padStart(2, "0");
}

function leseText(formData: FormData, feld: string) {
  const wert = formData.get(feld);
  return typeof wert === "string" ? wert.trim() : "";
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

function leseBildNotizDatei(formData: FormData, feld: string) {
  const wert = formData.get(feld);
  return wert instanceof File && wert.size > 0 ? wert : null;
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

function parseStundenEingaben(formData: FormData) {
  const datumInput = leseText(formData, "datum");
  const beginnInput = leseText(formData, "beginn");
  const endeInput = leseText(formData, "ende");
  const pauseInput = leseText(formData, "pauseDauer");
  const baustellen = leseText(formData, "baustellen");
  const tankKostenInput = leseText(formData, "tankKosten");
  const uebernachtung = formData.get("uebernachtung") === "on";

  if (!datumInput || !beginnInput || !endeInput || !baustellen) {
    return {
      data: null as ParsedStundeEingaben | null,
      fehler: "Bitte fülle Datum, Beginn, Ende und Baustellen aus.",
    };
  }

  const datum = parseDatum(datumInput);
  const beginn = parseUhrzeit(beginnInput);
  const ende = parseUhrzeit(endeInput);
  const pauseDauer = Number.parseInt(pauseInput || "0", 10);
  const tankKosten = parseZahl(tankKostenInput);

  if (!datum || !beginn || !ende) {
    return {
      data: null as ParsedStundeEingaben | null,
      fehler: "Datum oder Uhrzeit konnten nicht gelesen werden.",
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
      baustellen,
      beginn: beginn.text,
      datum,
      ende: ende.text,
      pauseDauer,
      stundenGes: Number(((arbeitsMinuten - pauseDauer) / 60).toFixed(2)),
      tankKosten: Number(tankKosten.toFixed(2)),
      uebernachtung,
    },
    fehler: null as string | null,
  };
}

function formatDezimalwert(wert: number) {
  return wert.toFixed(2).replace(".", ",");
}

async function speichereBildNotiz(datei: File) {
  if (!datei.size) {
    return { fehler: null, pfad: null as string | null };
  }

  const dateiEndung = ERLAUBTE_BILD_NOTIZ_TYPEN.get(datei.type);

  if (!dateiEndung) {
    return {
      fehler: "Bitte lade ein Bild als JPG, PNG oder WebP hoch.",
      pfad: null as string | null,
    };
  }

  if (datei.size > BILD_NOTIZ_MAX_BYTES) {
    return {
      fehler: "Die Bild-Notiz darf maximal 8 MB groß sein.",
      pfad: null as string | null,
    };
  }

  await mkdir(BILD_NOTIZ_UPLOAD_DIR, { recursive: true });

  const dateiName = `${Date.now()}-${randomUUID()}${dateiEndung}`;
  const absoluterPfad = path.join(BILD_NOTIZ_UPLOAD_DIR, dateiName);
  const relativerPfad = `${BILD_NOTIZ_DATEI_PFAD}/${dateiName}`;
  const inhalt = Buffer.from(await datei.arrayBuffer());

  await writeFile(absoluterPfad, inhalt);

  return { fehler: null, pfad: relativerPfad };
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

  const bildNotizDatei = leseBildNotizDatei(formData, "bildNotiz");
  const gespeicherteBildNotiz = bildNotizDatei
    ? await speichereBildNotiz(bildNotizDatei)
    : { fehler: null, pfad: null };

  if (gespeicherteBildNotiz.fehler) {
    return {
      status: "error",
      message: gespeicherteBildNotiz.fehler,
    };
  }

  await prisma.stunde.create({
    data: {
      datum: parsed.data.datum,
      beginn: parsed.data.beginn,
      ende: parsed.data.ende,
      pauseDauer: parsed.data.pauseDauer,
      stundenGes: parsed.data.stundenGes,
      baustellen: parsed.data.baustellen,
      uebernachtung: parsed.data.uebernachtung,
      tankKosten: parsed.data.tankKosten,
      bildNotizPfad: gespeicherteBildNotiz.pfad,
    },
  });

  revalidatePath("/");
  revalidatePath("/stunden/neu");

  return {
    status: "success",
    message: `Gespeichert. Gesamtstunden: ${formatDezimalwert(parsed.data.stundenGes)} h`,
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
    select: { bildNotizPfad: true, id: true },
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

  const neueBildNotizDatei = leseBildNotizDatei(formData, "bildNotiz");
  const bildNotizEntfernen = formData.get("bildNotizEntfernen") === "on";
  let bildNotizPfad = bestehendeStunde.bildNotizPfad;

  if (neueBildNotizDatei) {
    const gespeicherteBildNotiz = await speichereBildNotiz(neueBildNotizDatei);

    if (gespeicherteBildNotiz.fehler || !gespeicherteBildNotiz.pfad) {
      return {
        status: "error",
        message: gespeicherteBildNotiz.fehler ?? "Die Bild-Notiz konnte nicht gespeichert werden.",
      };
    }

    bildNotizPfad = gespeicherteBildNotiz.pfad;
    await loescheBildNotiz(bestehendeStunde.bildNotizPfad);
  } else if (bildNotizEntfernen) {
    await loescheBildNotiz(bestehendeStunde.bildNotizPfad);
    bildNotizPfad = null;
  }

  await prisma.stunde.update({
    where: { id },
    data: {
      datum: parsed.data.datum,
      beginn: parsed.data.beginn,
      ende: parsed.data.ende,
      pauseDauer: parsed.data.pauseDauer,
      stundenGes: parsed.data.stundenGes,
      baustellen: parsed.data.baustellen,
      uebernachtung: parsed.data.uebernachtung,
      tankKosten: parsed.data.tankKosten,
      bildNotizPfad,
    },
  });

  revalidatePath("/");
  revalidatePath("/stunden/neu");

  return {
    status: "success",
    message: `Aktualisiert. Gesamtstunden: ${formatDezimalwert(parsed.data.stundenGes)} h`,
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
    select: { bildNotizPfad: true, id: true },
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

  await loescheBildNotiz(bestehendeStunde.bildNotizPfad);

  revalidatePath("/");
  revalidatePath("/stunden/neu");

  return {
    status: "success",
    message: "Der Eintrag wurde gelöscht.",
  };
}
