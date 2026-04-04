"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  ArrowLeft,
  Clock3,
  Save,
} from "lucide-react";
import { createStunde, type StundenFormState } from "../actions/stunden";

type StundenFormProps = {
  accessToken: string;
  defaultDate: string;
};

type FormValues = {
  baustellen: string;
  beginn: string;
  datum: string;
  ende: string;
  pauseDauer: string;
  tankKosten: string;
  uebernachtung: boolean;
};

const initialStundenFormState: StundenFormState = {
  message: null,
  status: "idle",
};

function parseZeitMinuten(uhrzeit: string) {
  const teile = uhrzeit.split(":").map((teil) => Number.parseInt(teil, 10));

  if (teile.length !== 2 || teile.some((teil) => Number.isNaN(teil))) {
    return null;
  }

  return teile[0] * 60 + teile[1];
}

function berechneVorschau(beginn: string, ende: string, pause: string) {
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

export function StundenForm({ accessToken, defaultDate }: StundenFormProps) {
  const [state, formAction, pending] = useActionState(
    createStunde,
    initialStundenFormState,
  );
  const [values, setValues] = useState<FormValues>({
    baustellen: "",
    beginn: "",
    datum: defaultDate,
    ende: "",
    pauseDauer: "0",
    tankKosten: "0",
    uebernachtung: false,
  });

  const stundenVorschau = berechneVorschau(values.beginn, values.ende, values.pauseDauer);

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
              Mobiloptimierte Eingabe. Die Gesamtstunden werden automatisch aus Beginn, Ende und
              Pause berechnet.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-200">Datum</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-[#E20613]/50 focus:ring-2 focus:ring-[#E20613]/20"
                name="datum"
                onChange={(event) =>
                  setValues((current) => ({ ...current, datum: event.target.value }))
                }
                required
                type="date"
                value={values.datum}
              />
            </label>

            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Berechnete Stunden
              </div>
              <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-white">
                <Clock3 size={18} className="text-[#ffb4ba]" />
                {stundenVorschau ? `${stundenVorschau} h` : "Noch offen"}
              </div>
            </div>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-zinc-200">Baustellen</span>
              <textarea
                className="min-h-28 w-full resize-y rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-[#E20613]/50 focus:ring-2 focus:ring-[#E20613]/20"
                name="baustellen"
                onChange={(event) =>
                  setValues((current) => ({ ...current, baustellen: event.target.value }))
                }
                placeholder="Baustelle, Adresse, Hinweise oder mehrere Einsatzorte eintragen"
                required
                value={values.baustellen}
              />
            </label>

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

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-zinc-200">
                Foto als Bild-Notiz
              </span>
              <input
                accept="image/jpeg,image/png,image/webp"
                className="w-full rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-3 text-sm text-zinc-200 file:mr-4 file:rounded-full file:border-0 file:bg-[#E20613] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#b5050f]"
                name="bildNotiz"
                type="file"
              />
              <div className="mt-2 text-sm text-zinc-400">
                Optional. JPG, PNG oder WebP bis 8 MB. Das Bild erscheint später nur direkt am
                jeweiligen Eintrag.
              </div>
            </label>
          </div>

          <label className="mt-4 flex items-center gap-3 rounded-[24px] border border-white/10 bg-black/20 px-4 py-4">
            <input
              checked={values.uebernachtung}
              className="h-5 w-5 rounded border-white/20 bg-black/20 accent-[#E20613]"
              name="uebernachtung"
              onChange={(event) =>
                setValues((current) => ({ ...current, uebernachtung: event.target.checked }))
              }
              type="checkbox"
            />
            <div>
              <div className="text-sm font-medium text-white">Übernachtung</div>
              <div className="text-sm text-zinc-400">
                Aktivieren, wenn der Einsatz eine Übernachtung enthält.
              </div>
            </div>
          </label>

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
              Ende muss nach Beginn liegen, sonst wird nicht gespeichert.
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
