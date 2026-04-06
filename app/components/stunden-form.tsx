"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, CalendarRange, Clock3, Save } from "lucide-react";
import { createStunde, type StundenFormState } from "../actions/stunden";
import { BildNotizFelder, type BildNotizFeld } from "./bild-notiz-felder";
import {
  STANDARD_STUNDEN_EINTRAGSART,
  STUNDEN_EINTRAGSART_OPTIONEN,
  istGanztagEintragsart,
  type StundenEintragsart,
} from "../lib/stundenzettel";

type StundenFormProps = {
  accessToken: string;
  defaultDate: string;
};

type FormValues = {
  beginn: string;
  bemerkung: string;
  bisDatum: string;
  datum: string;
  ende: string;
  eintragsart: StundenEintragsart;
  pauseDauer: string;
  tankKosten: string;
};

const initialStundenFormState: StundenFormState = {
  message: null,
  status: "idle",
};

function createBildNotizFeld(): BildNotizFeld {
  return {
    id: crypto.randomUUID(),
    titel: "",
  };
}

function parseZeitMinuten(uhrzeit: string) {
  const teile = uhrzeit.split(":").map((teil) => Number.parseInt(teil, 10));

  if (teile.length !== 2 || teile.some((teil) => Number.isNaN(teil))) {
    return null;
  }

  return teile[0] * 60 + teile[1];
}

function berechneStundenVorschau(beginn: string, ende: string, pause: string) {
  const start = parseZeitMinuten(beginn);
  const finish = parseZeitMinuten(ende);
  const pauseMinuten = Number.parseInt(pause || "0", 10);

  if (
    start === null ||
    finish === null ||
    Number.isNaN(pauseMinuten) ||
    pauseMinuten < 0 ||
    finish <= start ||
    pauseMinuten >= finish - start
  ) {
    return null;
  }

  return ((finish - start - pauseMinuten) / 60).toFixed(2).replace(".", ",");
}

function berechneTageVorschau(von: string, bis: string) {
  if (!von || !bis) {
    return null;
  }

  const start = new Date(`${von}T00:00:00Z`);
  const end = new Date(`${bis}T00:00:00Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return null;
  }

  return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

export function StundenForm({ accessToken, defaultDate }: StundenFormProps) {
  const [state, formAction, pending] = useActionState(createStunde, initialStundenFormState);
  const [values, setValues] = useState<FormValues>({
    beginn: "",
    bemerkung: "",
    bisDatum: defaultDate,
    datum: defaultDate,
    ende: "",
    eintragsart: STANDARD_STUNDEN_EINTRAGSART,
    pauseDauer: "0",
    tankKosten: "0",
  });
  const [bildNotizFelder, setBildNotizFelder] = useState<BildNotizFeld[]>([createBildNotizFeld()]);

  const istGanztag = istGanztagEintragsart(values.eintragsart);
  const stundenVorschau = berechneStundenVorschau(values.beginn, values.ende, values.pauseDauer);
  const tageVorschau = berechneTageVorschau(values.datum, values.bisDatum);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(226,6,19,0.18),_transparent_32%),linear-gradient(180deg,_rgb(18,18,20)_0%,_rgb(11,11,12)_100%)] text-zinc-50">
      <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-4 sm:mb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={16} />
            Zur Übersicht
          </Link>
        </div>

        <form
          action={formAction}
          className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur sm:rounded-[32px] sm:p-6"
        >
          <input name="token" type="hidden" value={accessToken} />

          <div className="border-b border-white/10 pb-5">
            <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              Neues Formular
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              Stunden erfassen
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Arbeitszeiten werden automatisch berechnet. Krank und Urlaub werden ganztägig als
              einzelne Tage gespeichert.
            </p>
          </div>

          <fieldset className="mt-5">
            <legend className="mb-2 block text-sm font-medium text-zinc-200">Eintragsart</legend>
            <div className="mb-3 text-sm text-zinc-400">
              Es ist immer nur eine Auswahl gleichzeitig aktiv.
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {STUNDEN_EINTRAGSART_OPTIONEN.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-[24px] border px-4 py-4 transition ${
                    values.eintragsart === option.value
                      ? "border-[#E20613]/50 bg-[#E20613]/10"
                      : "border-white/10 bg-black/20 hover:border-white/20"
                  }`}
                >
                  <input
                    checked={values.eintragsart === option.value}
                    className="mt-0.5 h-5 w-5 border-white/20 bg-black/20 accent-[#E20613]"
                    name="eintragsart"
                    onChange={() =>
                      setValues((current) => ({
                        ...current,
                        bisDatum: current.datum,
                        eintragsart: option.value,
                      }))
                    }
                    type="radio"
                    value={option.value}
                  />
                  <div>
                    <div className="text-sm font-medium text-white">{option.label}</div>
                    <div className="text-sm text-zinc-400">{option.beschreibung}</div>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-200">
                {istGanztag ? "Von" : "Datum"}
              </span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-[#E20613]/50 focus:ring-2 focus:ring-[#E20613]/20"
                name="datum"
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    bisDatum:
                      istGanztag && current.bisDatum < event.target.value
                        ? event.target.value
                        : current.bisDatum,
                    datum: event.target.value,
                  }))
                }
                required
                type="date"
                value={values.datum}
              />
            </label>

            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                {istGanztag ? "Gespeicherte Tage" : "Berechnete Stunden"}
              </div>
              <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-white">
                {istGanztag ? (
                  <CalendarRange size={18} className="text-[#ffb4ba]" />
                ) : (
                  <Clock3 size={18} className="text-[#ffb4ba]" />
                )}
                {istGanztag
                  ? tageVorschau
                    ? `${tageVorschau} ${tageVorschau === 1 ? "Tag" : "Tage"}`
                    : "Noch offen"
                  : stundenVorschau
                    ? `${stundenVorschau} h`
                    : "Noch offen"}
              </div>
            </div>

            {istGanztag ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-200">Bis</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-[#E20613]/50 focus:ring-2 focus:ring-[#E20613]/20"
                  min={values.datum}
                  name="bisDatum"
                  onChange={(event) =>
                    setValues((current) => ({ ...current, bisDatum: event.target.value }))
                  }
                  required
                  type="date"
                  value={values.bisDatum}
                />
              </label>
            ) : null}

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-zinc-200">Bemerkung</span>
              <textarea
                className="min-h-28 w-full resize-y rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-[#E20613]/50 focus:ring-2 focus:ring-[#E20613]/20"
                name="bemerkung"
                onChange={(event) =>
                  setValues((current) => ({ ...current, bemerkung: event.target.value }))
                }
                placeholder={
                  istGanztag
                    ? "Optionaler Hinweis, z. B. Krankmeldung oder Urlaubshinweis"
                    : "Bemerkung, Baustelle, Adresse oder Hinweise eintragen"
                }
                value={values.bemerkung}
              />
            </label>

            {!istGanztag ? (
              <>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-200">Beginn</span>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-[#E20613]/50 focus:ring-2 focus:ring-[#E20613]/20"
                    name="beginn"
                    onChange={(event) =>
                      setValues((current) => ({ ...current, beginn: event.target.value }))
                    }
                    required
                    type="time"
                    value={values.beginn}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-200">Ende</span>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-[#E20613]/50 focus:ring-2 focus:ring-[#E20613]/20"
                    name="ende"
                    onChange={(event) =>
                      setValues((current) => ({ ...current, ende: event.target.value }))
                    }
                    required
                    type="time"
                    value={values.ende}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-200">
                    Dauer Pause in Minuten
                  </span>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-[#E20613]/50 focus:ring-2 focus:ring-[#E20613]/20"
                    min="0"
                    name="pauseDauer"
                    onChange={(event) =>
                      setValues((current) => ({ ...current, pauseDauer: event.target.value }))
                    }
                    step="1"
                    type="number"
                    value={values.pauseDauer}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-200">Tankkosten</span>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-[#E20613]/50 focus:ring-2 focus:ring-[#E20613]/20"
                    inputMode="decimal"
                    min="0"
                    name="tankKosten"
                    onChange={(event) =>
                      setValues((current) => ({ ...current, tankKosten: event.target.value }))
                    }
                    step="0.01"
                    type="number"
                    value={values.tankKosten}
                  />
                </label>
              </>
            ) : null}

            <BildNotizFelder
              beschreibung="Optional. Mehrere Bilder sind moeglich, jedes Bild kann einen eigenen Namen haben."
              felder={bildNotizFelder}
              onAdd={() => setBildNotizFelder((current) => [...current, createBildNotizFeld()])}
              onChangeTitel={(id, titel) =>
                setBildNotizFelder((current) =>
                  current.map((feld) => (feld.id === id ? { ...feld, titel } : feld)),
                )
              }
              onRemove={(id) =>
                setBildNotizFelder((current) => current.filter((feld) => feld.id !== id))
              }
            />
          </div>

          {state.message ? (
            <div
              className={`mt-4 rounded-[24px] px-4 py-3 text-sm ${
                state.status === "success"
                  ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
                  : "border border-red-500/20 bg-red-500/10 text-red-100"
              }`}
            >
              {state.message}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-zinc-400">
              {istGanztag
                ? "Krank und Urlaub werden fuer jeden Tag einzeln gespeichert."
                : "Ende muss nach Beginn liegen, sonst wird nicht gespeichert."}
            </div>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#E20613] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b5050f] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={pending}
              type="submit"
            >
              <Save size={16} />
              {pending ? "Speichert..." : "Speichern"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
