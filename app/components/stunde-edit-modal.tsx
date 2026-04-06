"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  Clock3,
  ImageIcon,
  LockKeyhole,
  PencilLine,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { type AuthState, verifyStundenFormPassword } from "../actions/auth";
import { deleteStunde, type StundenFormState, updateStunde } from "../actions/stunden";
import { BildNotizFelder, type BildNotizFeld } from "./bild-notiz-felder";
import {
  getBildNotizLabel,
  getStundenEintragTitel,
  getStundenEintragUntertitel,
  istGanztagEintragsart,
  STUNDEN_EINTRAGSART_OPTIONEN,
  type StundenEintragsart,
  type StundenzettelEintrag,
} from "../lib/stundenzettel";

type StundeEditModalProps = {
  eintrag: StundenzettelEintrag;
  onClose: () => void;
  onDeleted: (eintragId: string) => void;
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

const initialUnlockState: AuthState = { error: null, unlocked: false };
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

export function StundeEditModal({ eintrag, onClose, onDeleted }: StundeEditModalProps) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>({
    beginn: eintrag.beginnInput,
    bemerkung: eintrag.bemerkung,
    bisDatum: eintrag.datumInput,
    datum: eintrag.datumInput,
    ende: eintrag.endeInput,
    eintragsart: eintrag.eintragsart,
    pauseDauer: String(eintrag.pauseMinuten),
    tankKosten: eintrag.tankKostenInput,
  });
  const [bildNotizFelder, setBildNotizFelder] = useState<BildNotizFeld[]>([createBildNotizFeld()]);
  const [bildNotizEntfernenIds, setBildNotizEntfernenIds] = useState<string[]>([]);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [submittedUnlockPassword, setSubmittedUnlockPassword] = useState("");

  const [unlockState, unlockAction, unlockPending] = useActionState(
    verifyStundenFormPassword,
    initialUnlockState,
  );
  const [editState, editAction, editPending] = useActionState(updateStunde, initialStundenFormState);
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteStunde,
    initialStundenFormState,
  );

  useEffect(() => {
    if (editState.status === "success") {
      router.refresh();
      onClose();
    }
  }, [editState.status, onClose, router]);

  useEffect(() => {
    if (deleteState.status === "success") {
      onDeleted(eintrag.id);
      router.refresh();
      onClose();
    }
  }, [deleteState.status, eintrag.id, onClose, onDeleted, router]);

  const hasFormAccess = unlockState.unlocked === true;
  const istGanztag = istGanztagEintragsart(values.eintragsart);
  const stundenVorschau = berechneStundenVorschau(values.beginn, values.ende, values.pauseDauer);
  const tageVorschau = berechneTageVorschau(values.datum, values.bisDatum);
  const aktiveBildNotizen = useMemo(
    () => eintrag.bildNotizen.filter((bildNotiz) => !bildNotizEntfernenIds.includes(bildNotiz.id)),
    [bildNotizEntfernenIds, eintrag.bildNotizen],
  );
  const titel = getStundenEintragTitel(eintrag.eintragsart, eintrag.bemerkung);
  const untertitel = getStundenEintragUntertitel(eintrag.eintragsart, eintrag.bemerkung);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 px-3 py-3 backdrop-blur-sm sm:px-6 sm:py-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,19,20,0.98),rgba(10,10,11,0.96))] shadow-[0_25px_120px_rgba(0,0,0,0.7)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-zinc-400">
                <PencilLine size={14} />
                Eintrag bearbeiten
              </div>
              <h3 className="mt-3 text-xl font-semibold text-white sm:text-2xl">
                {eintrag.datumText} · {titel}
              </h3>
              <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                {untertitel ?? "Eintrag anpassen oder in einen Datumsbereich erweitern."}
              </p>
            </div>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {!hasFormAccess ? (
              <div className="mx-auto max-w-xl rounded-[28px] border border-white/10 bg-black/20 p-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#E20613]/20 bg-[#E20613]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-red-100">
                  <LockKeyhole size={14} />
                  Formular-Passwort
                </div>
                <h4 className="mt-4 text-2xl font-semibold text-white">Bearbeitung freischalten</h4>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  Fuer jede Aenderung wird das zweite Passwort vom Stundenformular benoetigt.
                </p>

                <form
                  action={unlockAction}
                  className="mt-6 space-y-4"
                  onSubmit={() => setSubmittedUnlockPassword(unlockPassword)}
                >
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-zinc-200">Passwort</span>
                    <input
                      autoComplete="current-password"
                      autoFocus
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white outline-none transition placeholder:text-zinc-500 focus:border-[#E20613]/50 focus:ring-2 focus:ring-[#E20613]/20"
                      name="password"
                      onChange={(event) => setUnlockPassword(event.target.value)}
                      placeholder="Passwort eingeben"
                      type="password"
                      value={unlockPassword}
                    />
                  </label>

                  {unlockState.error ? (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                      {unlockState.error}
                    </div>
                  ) : null}

                  <button
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-[#E20613] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b5050f] disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={unlockPending}
                    type="submit"
                  >
                    {unlockPending ? "Pruefe Passwort..." : "Bearbeitung freischalten"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <form
                  action={editAction}
                  className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur sm:p-6"
                >
                  <input name="id" type="hidden" value={eintrag.id} />
                  <input name="password" type="hidden" value={submittedUnlockPassword} />

                  <fieldset>
                    <legend className="mb-2 block text-sm font-medium text-zinc-200">
                      Eintragsart
                    </legend>
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
                            ? "Optionaler Hinweis zum Urlaub oder Krank-Eintrag"
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
                              setValues((current) => ({
                                ...current,
                                pauseDauer: event.target.value,
                              }))
                            }
                            step="1"
                            type="number"
                            value={values.pauseDauer}
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-zinc-200">
                            Tankkosten
                          </span>
                          <input
                            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-[#E20613]/50 focus:ring-2 focus:ring-[#E20613]/20"
                            inputMode="decimal"
                            min="0"
                            name="tankKosten"
                            onChange={(event) =>
                              setValues((current) => ({
                                ...current,
                                tankKosten: event.target.value,
                              }))
                            }
                            step="0.01"
                            type="number"
                            value={values.tankKosten}
                          />
                        </label>
                      </>
                    ) : null}

                    <BildNotizFelder
                      beschreibung="Mehrere neue Bilder sind moeglich. Jeder Upload kann einen eigenen Namen haben."
                      felder={bildNotizFelder}
                      onAdd={() =>
                        setBildNotizFelder((current) => [...current, createBildNotizFeld()])
                      }
                      onChangeTitel={(id, titelWert) =>
                        setBildNotizFelder((current) =>
                          current.map((feld) =>
                            feld.id === id ? { ...feld, titel: titelWert } : feld,
                          ),
                        )
                      }
                      onRemove={(id) =>
                        setBildNotizFelder((current) => current.filter((feld) => feld.id !== id))
                      }
                      titel="Neue Bild-Notizen"
                    />
                  </div>

                  {eintrag.bildNotizen.length > 0 ? (
                    <div className="mt-4 rounded-[24px] border border-white/10 bg-black/20 px-4 py-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-white">
                        <ImageIcon size={16} />
                        Aktuelle Bild-Notizen
                      </div>
                      <div className="mt-2 text-sm text-zinc-400">
                        {aktiveBildNotizen.length > 0
                          ? `${getBildNotizLabel(aktiveBildNotizen.length)} bleiben aktuell aktiv.`
                          : "Alle vorhandenen Bilder werden beim Speichern entfernt."}
                      </div>
                      <div className="mt-4 space-y-3">
                        {eintrag.bildNotizen.map((bildNotiz) => {
                          const checked = bildNotizEntfernenIds.includes(bildNotiz.id);

                          return (
                            <label
                              key={bildNotiz.id}
                              className="flex items-start gap-3 rounded-[20px] border border-white/10 bg-black/20 px-4 py-3"
                            >
                              <input
                                checked={checked}
                                className="mt-1 h-5 w-5 rounded border-white/20 bg-black/20 accent-[#E20613]"
                                name="bildNotizEntfernenId"
                                onChange={(event) =>
                                  setBildNotizEntfernenIds((current) =>
                                    event.target.checked
                                      ? [...current, bildNotiz.id]
                                      : current.filter((id) => id !== bildNotiz.id),
                                  )
                                }
                                type="checkbox"
                                value={bildNotiz.id}
                              />
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-white">{bildNotiz.titel}</div>
                                <div className="text-sm text-zinc-400">
                                  {checked ? "Wird beim Speichern entfernt." : "Bleibt erhalten."}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {editState.message ? (
                    <div
                      className={`mt-4 rounded-[24px] px-4 py-3 text-sm ${
                        editState.status === "success"
                          ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
                          : "border border-red-500/20 bg-red-500/10 text-red-100"
                      }`}
                    >
                      {editState.message}
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-zinc-400">
                      {istGanztag
                        ? "Datumsbereiche werden beim Speichern als einzelne Tage angelegt."
                        : "Aenderungen werden nur mit dem Formular-Passwort gespeichert."}
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
                        onClick={onClose}
                        type="button"
                      >
                        Abbrechen
                      </button>
                      <button
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#E20613] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b5050f] disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={editPending || deletePending}
                        type="submit"
                      >
                        <Save size={16} />
                        {editPending ? "Speichert..." : "Aenderungen speichern"}
                      </button>
                    </div>
                  </div>
                </form>

                <form
                  action={deleteAction}
                  className="rounded-[28px] border border-red-500/20 bg-red-500/8 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.2)] sm:p-6"
                >
                  <input name="id" type="hidden" value={eintrag.id} />
                  <input name="password" type="hidden" value={submittedUnlockPassword} />

                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-200">
                      <Trash2 size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-lg font-semibold text-white">Eintrag loeschen</h4>
                      <p className="mt-2 text-sm leading-6 text-red-100/85">
                        Loescht diesen Stundeneintrag dauerhaft. Vorhandene Bilddateien werden
                        ebenfalls entfernt.
                      </p>
                    </div>
                  </div>

                  <label className="mt-4 flex items-center gap-3 rounded-[24px] border border-red-500/20 bg-black/20 px-4 py-4">
                    <input
                      checked={deleteConfirmed}
                      className="h-5 w-5 rounded border-white/20 bg-black/20 accent-[#E20613]"
                      onChange={(event) => setDeleteConfirmed(event.target.checked)}
                      type="checkbox"
                    />
                    <div>
                      <div className="text-sm font-medium text-white">
                        Ich moechte diesen Eintrag endgueltig loeschen
                      </div>
                      <div className="text-sm text-zinc-400">
                        Diese Aktion kann nicht rueckgaengig gemacht werden.
                      </div>
                    </div>
                  </label>

                  {deleteState.message ? (
                    <div
                      className={`mt-4 rounded-[24px] px-4 py-3 text-sm ${
                        deleteState.status === "success"
                          ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
                          : "border border-red-500/20 bg-red-500/10 text-red-100"
                      }`}
                    >
                      {deleteState.message}
                    </div>
                  ) : null}

                  <div className="mt-5 flex justify-end">
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!deleteConfirmed || deletePending || editPending}
                      type="submit"
                    >
                      <Trash2 size={16} />
                      {deletePending ? "Loescht..." : "Eintrag loeschen"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
