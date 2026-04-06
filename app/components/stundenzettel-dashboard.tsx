"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  CalendarRange,
  Clock3,
  Download,
  Ellipsis,
  Eye,
  Fuel,
  HeartPulse,
  ImageIcon,
  MoonStar,
  Palmtree,
  PencilLine,
  PauseCircle,
  X,
} from "lucide-react";
import { startTransition, type MouseEvent, useEffect, useOptimistic, useState } from "react";

import { StundeEditModal } from "./stunde-edit-modal";
import {
  getBildNotizLabel,
  formatEintragsartenZusammenfassung,
  formatEuro,
  formatPause,
  formatStunden,
  getStundenEintragTitel,
  getStundenEintragUntertitel,
  getStundenEintragsartLabel,
  getStundenEintragZeitText,
  hatStundenZeiten,
  truncateText,
  type StundenzettelEintrag,
  type StundenzettelMonat,
} from "../lib/stundenzettel";

type StundenzettelDashboardProps = {
  monate: StundenzettelMonat[];
};

type OffenesMenue = {
  id: string;
  left: number;
  top: number;
};

function berechneSummenClient(eintraege: StundenzettelEintrag[]) {
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

function findeEintrag(monate: StundenzettelMonat[], eintragId: string) {
  for (const monat of monate) {
    const eintrag = monat.eintraege.find((currentEintrag) => currentEintrag.id === eintragId);

    if (eintrag) {
      return eintrag;
    }
  }

  return null;
}

function getEintragInfoFelder(eintrag: StundenzettelEintrag) {
  if (hatStundenZeiten(eintrag.eintragsart)) {
    return [
      {
        label: "Zeit",
        value: getStundenEintragZeitText(eintrag.eintragsart, eintrag.beginnText, eintrag.endeText),
      },
      { label: "Stunden", value: formatStunden(eintrag.stunden) },
      { label: "Pause", value: formatPause(eintrag.pauseMinuten) },
      { label: "Tankkosten", value: formatEuro(eintrag.tankKosten) },
    ];
  }

  return [
    { label: "Zeit", value: "Ganztägig" },
    {
      label: "Bilder",
      value:
        eintrag.bildNotizen.length > 0 ? getBildNotizLabel(eintrag.bildNotizen.length) : "Keine",
    },
  ];
}

export function StundenzettelDashboard({ monate }: StundenzettelDashboardProps) {
  const [offenesMenue, setOffenesMenue] = useState<OffenesMenue | null>(null);
  const [aktiverMonatId, setAktiverMonatId] = useState<string | null>(null);
  const [aktiveBildNotizId, setAktiveBildNotizId] = useState<string | null>(null);
  const [aktiveBearbeitungId, setAktiveBearbeitungId] = useState<string | null>(null);
  const [optimistischeMonate, entferneEintragOptimistisch] = useOptimistic(
    monate,
    (currentMonate, geloeschteEintragId: string) =>
      currentMonate.flatMap((monat) => {
        const eintraege = monat.eintraege.filter((eintrag) => eintrag.id !== geloeschteEintragId);

        if (eintraege.length === monat.eintraege.length) {
          return [monat];
        }

        if (eintraege.length === 0) {
          return [];
        }

        return [
          {
            ...monat,
            eintraege,
            summen: berechneSummenClient(eintraege),
          },
        ];
      }),
  );

  useEffect(() => {
    const beiEscapeSchliessen = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOffenesMenue(null);
        setAktiverMonatId(null);
        setAktiveBildNotizId(null);
        setAktiveBearbeitungId(null);
      }
    };
    const menueSchliessen = () => setOffenesMenue(null);

    window.addEventListener("keydown", beiEscapeSchliessen);
    window.addEventListener("resize", menueSchliessen);
    window.addEventListener("scroll", menueSchliessen, true);

    return () => {
      window.removeEventListener("keydown", beiEscapeSchliessen);
      window.removeEventListener("resize", menueSchliessen);
      window.removeEventListener("scroll", menueSchliessen, true);
    };
  }, []);

  const aktiverMonat = aktiverMonatId
    ? optimistischeMonate.find((monat) => monat.id === aktiverMonatId) ?? null
    : null;
  const aktiveBildNotiz = aktiveBildNotizId
    ? findeEintrag(optimistischeMonate, aktiveBildNotizId)
    : null;
  const aktiveBearbeitung = aktiveBearbeitungId
    ? findeEintrag(optimistischeMonate, aktiveBearbeitungId)
    : null;

  const gesamt = optimistischeMonate.reduce(
    (summe, monat) => ({
      monate: summe.monate + 1,
      eintraege: summe.eintraege + monat.summen.eintraege,
      stunden: summe.stunden + monat.summen.stunden,
      pauseMinuten: summe.pauseMinuten + monat.summen.pauseMinuten,
      tankKosten: summe.tankKosten + monat.summen.tankKosten,
      uebernachtungen: summe.uebernachtungen + monat.summen.uebernachtungen,
      urlaubstage: summe.urlaubstage + monat.summen.urlaubstage,
      kranktage: summe.kranktage + monat.summen.kranktage,
    }),
    {
      monate: 0,
      eintraege: 0,
      stunden: 0,
      pauseMinuten: 0,
      tankKosten: 0,
      uebernachtungen: 0,
      urlaubstage: 0,
      kranktage: 0,
    },
  );

  const statistikKarten = [
    {
      label: "Monate im Blick",
      value: `${gesamt.monate}`,
      meta: `${gesamt.eintraege} Einträge`,
      icon: CalendarRange,
    },
    {
      label: "Gesamtstunden",
      value: formatStunden(gesamt.stunden),
      meta: `Pause ${formatPause(gesamt.pauseMinuten)}`,
      icon: Clock3,
    },
    {
      label: "Urlaubstage",
      value: `${gesamt.urlaubstage}`,
      meta:
        gesamt.urlaubstage > 0
          ? `${gesamt.urlaubstage} ${gesamt.urlaubstage === 1 ? "Tag" : "Tage"} gespeichert`
          : "Keine Urlaubstage erfasst",
      icon: Palmtree,
    },
    {
      label: "Kranktage",
      value: `${gesamt.kranktage}`,
      meta:
        gesamt.kranktage > 0
          ? `${gesamt.kranktage} ${gesamt.kranktage === 1 ? "Tag" : "Tage"} gespeichert`
          : "Keine Kranktage erfasst",
      icon: HeartPulse,
    },
    {
      label: "Tankkosten",
      value: formatEuro(gesamt.tankKosten),
      meta: formatEintragsartenZusammenfassung(gesamt, "Keine Markierungen erfasst"),
      icon: Fuel,
    },
  ];

  function exportierePdf(monat: StundenzettelMonat) {
    const link = document.createElement("a");
    link.href = monat.pdfHref;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.append(link);
    link.click();
    link.remove();
  }

  function toggleMenue(monatId: string, event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const menueBreite = 224;
    const menueHoehe = 118;
    const viewportPadding = 16;
    const left = Math.min(
      window.innerWidth - viewportPadding - menueBreite,
      Math.max(viewportPadding, rect.right - menueBreite),
    );
    const menuePasstUnten = rect.bottom + 10 + menueHoehe <= window.innerHeight - viewportPadding;
    const top = menuePasstUnten
      ? rect.bottom + 10
      : Math.max(viewportPadding, rect.top - menueHoehe - 10);

    setOffenesMenue((aktuellesMenue) => {
      if (aktuellesMenue?.id === monatId) {
        return null;
      }

      return { id: monatId, left, top };
    });
  }

  function handleEintragGeloescht(eintragId: string) {
    startTransition(() => {
      entferneEintragOptimistisch(eintragId);
    });

    if (aktiveBildNotizId === eintragId) {
      setAktiveBildNotizId(null);
    }

    setAktiveBearbeitungId(null);
  }

  const menueMonat = offenesMenue
    ? optimistischeMonate.find((monat) => monat.id === offenesMenue.id) ?? null
    : null;

  return (
    <main
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(226,6,19,0.18),_transparent_32%),linear-gradient(180deg,_rgb(18,18,20)_0%,_rgb(11,11,12)_100%)] text-zinc-50"
      onClick={() => setOffenesMenue(null)}
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur sm:rounded-[36px] sm:p-8 lg:p-10"
        >
          <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(226,6,19,0.12)_45%,transparent_100%)]" />
          <div className="absolute -right-16 top-12 h-44 w-44 rounded-full bg-[#E20613]/20 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-orange-400/10 blur-3xl" />

          <div className="relative grid gap-6 sm:gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E20613]/20 bg-[#E20613]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-red-100">
                <CalendarRange size={14} />
                Gesamtstatistik
              </div>

              <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:mt-5 sm:text-5xl lg:text-6xl">
                Alle Stundenzettel
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300 sm:mt-5">
                Alfio Schmidt
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:hidden">
                {statistikKarten.map((karte, index) => {
                  const Icon = karte.icon;

                  return (
                    <div
                      key={karte.label}
                      className={`rounded-[24px] border border-white/10 bg-black/25 p-4 backdrop-blur ${
                        index === statistikKarten.length - 1 ? "col-span-2" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                            {karte.label}
                          </div>
                          <div className="mt-3 text-2xl font-semibold text-white">
                            {karte.value}
                          </div>
                        </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#E20613]/10 text-[#ffb4ba]">
                          <Icon size={17} />
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-zinc-400">{karte.meta}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="hidden rounded-[30px] border border-white/10 bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur sm:block sm:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                    Schnellübersicht
                  </div>
                  <div className="mt-2 text-lg font-medium text-white">
                    Monatsdaten direkt aus der Datenbank
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                  Realdaten aktiv
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {statistikKarten.map((karte) => {
                  const Icon = karte.icon;

                  return (
                    <div
                      key={karte.label}
                      className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#E20613]/10 text-[#ffb4ba]">
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                            {karte.label}
                          </div>
                          <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
                            <div className="text-3xl font-semibold leading-none text-white">
                              {karte.value}
                            </div>
                            <div className="text-sm text-zinc-400">{karte.meta}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.section>

        <section className="mt-8 rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <h2 className="text-2xl font-semibold text-white">Stundenzettel nach Monat</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Exportiere Monats-PDFs oder prüfe die gespeicherten Einträge direkt in der
                Detailansicht.
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs uppercase tracking-[0.18em] text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {optimistischeMonate.length > 0 ? "Daten verfügbar" : "Noch keine Daten"}
            </div>
          </div>

          {optimistischeMonate.length === 0 ? (
            <div className="px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
              <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 px-5 py-8 text-center sm:px-8">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/10 bg-white/5 text-[#ffb4ba]">
                  <CalendarRange size={22} />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-white">
                  Noch keine Stundenzettel vorhanden
                </h3>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                  Sobald Stunden erfasst wurden, erscheinen hier automatisch die Monatsübersichten
                  mit Detailansicht und PDF-Export.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full table-fixed">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.18em] text-zinc-500">
                      <th className="px-6 py-4 font-medium lg:px-8">Monat / Jahr</th>
                      <th className="px-6 py-4 font-medium">Einträge</th>
                      <th className="px-6 py-4 font-medium">Gesamtstunden</th>
                      <th className="px-6 py-4 font-medium">Tankkosten</th>
                      <th className="px-6 py-4 text-right font-medium lg:px-8">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {optimistischeMonate.map((monat, index) => (
                      <motion.tr
                        key={monat.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.32, delay: 0.06 * index, ease: "easeOut" }}
                        className="border-b border-white/6 text-sm last:border-b-0"
                      >
                        <td className="px-6 py-5 lg:px-8">
                          <div className="font-medium text-white">
                            {monat.monatLabel} {monat.jahr}
                          </div>
                          <div className="mt-1 text-xs uppercase tracking-[0.15em] text-zinc-500">
                            {monat.summen.eintraege} Arbeitstage
                          </div>
                        </td>
                        <td className="px-6 py-5 text-zinc-300">{monat.summen.eintraege}</td>
                        <td className="px-6 py-5 text-zinc-300">
                          {formatStunden(monat.summen.stunden)}
                        </td>
                        <td className="px-6 py-5 text-zinc-300">
                          {formatEuro(monat.summen.tankKosten)}
                        </td>
                        <td className="px-6 py-5 lg:px-8">
                          <div className="flex items-center justify-end">
                            <div
                              className="relative"
                              data-menu-root={monat.id}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <button
                                type="button"
                                aria-haspopup="menu"
                                aria-expanded={offenesMenue?.id === monat.id}
                                aria-label={`Aktionen für ${monat.monatLabel} ${monat.jahr} anzeigen`}
                                onClick={(event) => toggleMenue(monat.id, event)}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                              >
                                <Ellipsis size={18} />
                              </button>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 p-4 md:hidden">
                {optimistischeMonate.map((monat, index) => (
                  <motion.article
                    key={monat.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.32, delay: 0.05 * index, ease: "easeOut" }}
                    className="rounded-[26px] border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xl font-semibold text-white">
                          {monat.monatLabel} {monat.jahr}
                        </div>
                        <div className="mt-1 text-sm text-zinc-400">
                          {monat.summen.eintraege} Einträge im ausgewählten Monat
                        </div>
                      </div>
                      <div className="relative" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          aria-haspopup="menu"
                          aria-expanded={offenesMenue?.id === monat.id}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300"
                          onClick={(event) => toggleMenue(monat.id, event)}
                        >
                          <Ellipsis size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {[
                        { label: "Einträge", value: `${monat.summen.eintraege}` },
                        { label: "Stunden", value: formatStunden(monat.summen.stunden) },
                        { label: "Pause", value: formatPause(monat.summen.pauseMinuten) },
                        { label: "Tankkosten", value: formatEuro(monat.summen.tankKosten) },
                      ].map((feld) => (
                        <div
                          key={feld.label}
                          className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3"
                        >
                          <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                            {feld.label}
                          </div>
                          <div className="mt-2 text-sm font-medium text-zinc-100">
                            {feld.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                        {formatEintragsartenZusammenfassung(
                          monat.summen,
                          "Keine Markierungen",
                        )}
                      </span>
                      <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                        PDF und Datenansicht verfügbar
                      </span>
                    </div>
                  </motion.article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <AnimatePresence>
        {offenesMenue && menueMonat ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30"
            onClick={() => setOffenesMenue(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute w-56 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/95 p-2 shadow-[0_20px_70px_rgba(0,0,0,0.5)] backdrop-blur"
              role="menu"
              style={{ left: offenesMenue.left, top: offenesMenue.top }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-zinc-200 transition hover:bg-white/7"
                onClick={() => {
                  setAktiverMonatId(menueMonat.id);
                  setOffenesMenue(null);
                }}
              >
                <Eye size={16} />
                Daten anzeigen
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-zinc-200 transition hover:bg-white/7"
                onClick={() => {
                  exportierePdf(menueMonat);
                  setOffenesMenue(null);
                }}
              >
                <Download size={16} />
                Export PDF
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {aktiverMonat ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 px-0 py-0 backdrop-blur-sm sm:px-4 sm:py-6"
            onClick={() => setAktiverMonatId(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="flex h-[100dvh] w-full flex-col overflow-hidden rounded-none border border-white/10 bg-[linear-gradient(180deg,rgba(19,19,20,0.98),rgba(10,10,11,0.96))] shadow-[0_25px_120px_rgba(0,0,0,0.7)] sm:mx-auto sm:h-full sm:max-w-5xl sm:rounded-[34px]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-[linear-gradient(180deg,rgba(19,19,20,0.98),rgba(19,19,20,0.92))] px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-zinc-400">
                    <Eye size={14} />
                    Daten anzeigen
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
                    {aktiverMonat.monatLabel} {aktiverMonat.jahr}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                    Übersicht mit Summen, Urlaub- und Kranktagen sowie allen gespeicherten
                    Tagesdaten.
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                  onClick={() => setAktiverMonatId(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-7">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {[
                    {
                      label: "Gesamtstunden",
                      value: formatStunden(aktiverMonat.summen.stunden),
                      icon: Clock3,
                    },
                    {
                      label: "Gesamte Tankkosten",
                      value: formatEuro(aktiverMonat.summen.tankKosten),
                      icon: Fuel,
                    },
                    {
                      label: "Gesamtpause",
                      value: formatPause(aktiverMonat.summen.pauseMinuten),
                      icon: PauseCircle,
                    },
                    {
                      label: "Urlaubstage",
                      value: `${aktiverMonat.summen.urlaubstage}`,
                      icon: Palmtree,
                    },
                    {
                      label: "Kranktage",
                      value: `${aktiverMonat.summen.kranktage}`,
                      icon: HeartPulse,
                    },
                  ].map((karte) => {
                    const Icon = karte.icon;

                    return (
                      <div
                        key={karte.label}
                        className="rounded-[28px] border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs uppercase tracking-[0.18em] text-zinc-400">
                            {karte.label}
                          </span>
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-2 text-[#ffb4ba]">
                            <Icon size={16} />
                          </div>
                        </div>
                        <div className="mt-4 text-2xl font-semibold text-white">{karte.value}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
                  <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-400">
                    <div className="flex items-center gap-2">
                      <MoonStar
                        size={16}
                        className={
                          aktiverMonat.summen.uebernachtungen > 0 ||
                          aktiverMonat.summen.urlaubstage > 0 ||
                          aktiverMonat.summen.kranktage > 0
                            ? "text-amber-200"
                            : "text-zinc-500"
                        }
                      />
                      {formatEintragsartenZusammenfassung(
                        aktiverMonat.summen,
                        "Keine Markierungen im gewählten Monat erfasst.",
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:border-white/20 hover:bg-white/10"
                    onClick={() => exportierePdf(aktiverMonat)}
                  >
                    <Download size={16} />
                    Monats-PDF exportieren
                  </button>
                </div>

                <div className="mt-4 rounded-[24px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                  {aktiverMonat.summen.eintraege} Einträge in diesem Monat gespeichert.
                </div>

                <div className="mt-6 grid gap-3 md:hidden">
                  {aktiverMonat.eintraege.map((eintrag) => (
                    <div
                      key={eintrag.id}
                      className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-base font-semibold text-white">
                              {eintrag.datumText}
                            </div>
                            {eintrag.bildNotizen.length > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-sky-100">
                                <ImageIcon size={12} />
                                {getBildNotizLabel(eintrag.bildNotizen.length)}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1 text-base font-medium text-zinc-100">
                            {getStundenEintragTitel(eintrag.eintragsart, eintrag.bemerkung)}
                          </div>
                          {getStundenEintragUntertitel(eintrag.eintragsart, eintrag.bemerkung) ? (
                            <div className="mt-1 text-sm text-zinc-400">
                              {getStundenEintragUntertitel(eintrag.eintragsart, eintrag.bemerkung)}
                            </div>
                          ) : null}
                        </div>
                        <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] text-zinc-300">
                          {getStundenEintragsartLabel(eintrag.eintragsart)}
                        </span>
                      </div>

                      <div
                        className={`mt-4 grid gap-2 ${
                          getEintragInfoFelder(eintrag).length > 2 ? "grid-cols-2" : "grid-cols-1"
                        }`}
                      >
                        {getEintragInfoFelder(eintrag).map((feld) => (
                          <div
                            key={feld.label}
                            className="rounded-2xl border border-white/10 bg-black/15 px-3 py-3"
                          >
                            <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                              {feld.label}
                            </div>
                            <div className="mt-2 text-sm font-medium text-zinc-100">
                              {feld.value}
                            </div>
                          </div>
                        ))}
                      </div>

                      {eintrag.bildNotizen.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:border-white/20 hover:bg-white/10"
                            onClick={() => setAktiveBildNotizId(eintrag.id)}
                          >
                            <ImageIcon size={16} />
                            Bilder ansehen
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:border-white/20 hover:bg-white/10"
                            onClick={() => setAktiveBearbeitungId(eintrag.id)}
                          >
                            <PencilLine size={16} />
                            Bearbeiten
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:border-white/20 hover:bg-white/10"
                          onClick={() => setAktiveBearbeitungId(eintrag.id)}
                        >
                          <PencilLine size={16} />
                          Bearbeiten
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 hidden overflow-hidden rounded-[28px] border border-white/10 md:block">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/[0.03] text-left text-xs uppercase tracking-[0.18em] text-zinc-500">
                          <th className="px-4 py-4 font-medium">Datum</th>
                          <th className="px-4 py-4 font-medium">Eintrag</th>
                          <th className="px-4 py-4 font-medium">Zeit</th>
                          <th className="px-4 py-4 font-medium">Stunden</th>
                          <th className="px-4 py-4 font-medium">Pause</th>
                          <th className="px-4 py-4 font-medium">Tankkosten</th>
                          <th className="px-4 py-4 font-medium">Bilder</th>
                          <th className="px-4 py-4 font-medium">Bearbeiten</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aktiverMonat.eintraege.map((eintrag) => (
                          <tr
                            key={eintrag.id}
                            className="border-b border-white/6 text-sm last:border-b-0"
                          >
                            <td className="px-4 py-4 text-zinc-200">{eintrag.datumText}</td>
                            <td className="px-4 py-4">
                              <div className="text-zinc-100">
                                {truncateText(
                                  getStundenEintragTitel(eintrag.eintragsart, eintrag.bemerkung),
                                  64,
                                )}
                              </div>
                              {getStundenEintragUntertitel(eintrag.eintragsart, eintrag.bemerkung) ? (
                                <div className="mt-1 text-sm text-zinc-400">
                                  {truncateText(
                                    getStundenEintragUntertitel(
                                      eintrag.eintragsart,
                                      eintrag.bemerkung,
                                    ) ?? "",
                                    72,
                                  )}
                                </div>
                              ) : null}
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.15em] text-zinc-500">
                                <span>
                                  {getStundenEintragsartLabel(eintrag.eintragsart)}
                                </span>
                                {eintrag.bildNotizen.length > 0 ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-1 text-[10px] font-medium tracking-[0.14em] text-sky-100">
                                    <ImageIcon size={11} />
                                    {getBildNotizLabel(eintrag.bildNotizen.length)}
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-zinc-300">
                              {getStundenEintragZeitText(
                                eintrag.eintragsart,
                                eintrag.beginnText,
                                eintrag.endeText,
                              )}
                            </td>
                            <td className="px-4 py-4 text-zinc-300">
                              {hatStundenZeiten(eintrag.eintragsart)
                                ? formatStunden(eintrag.stunden)
                                : "—"}
                            </td>
                            <td className="px-4 py-4 text-zinc-300">
                              {hatStundenZeiten(eintrag.eintragsart)
                                ? formatPause(eintrag.pauseMinuten)
                                : "—"}
                            </td>
                            <td className="px-4 py-4 text-zinc-300">
                              {hatStundenZeiten(eintrag.eintragsart)
                                ? formatEuro(eintrag.tankKosten)
                                : "—"}
                            </td>
                            <td className="px-4 py-4">
                              {eintrag.bildNotizen.length > 0 ? (
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-100 transition hover:border-white/20 hover:bg-white/10"
                                  onClick={() => setAktiveBildNotizId(eintrag.id)}
                                >
                                  <ImageIcon size={14} />
                                  {getBildNotizLabel(eintrag.bildNotizen.length)}
                                </button>
                              ) : (
                                <span className="text-zinc-500">Keine</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-100 transition hover:border-white/20 hover:bg-white/10"
                                onClick={() => setAktiveBearbeitungId(eintrag.id)}
                              >
                                <PencilLine size={14} />
                                Bearbeiten
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {aktiveBildNotiz && aktiveBildNotiz.bildNotizen.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 px-3 py-3 backdrop-blur-sm sm:px-6 sm:py-6"
            onClick={() => setAktiveBildNotizId(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,19,20,0.98),rgba(10,10,11,0.96))] shadow-[0_25px_120px_rgba(0,0,0,0.7)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-zinc-400">
                    <ImageIcon size={14} />
                    Bild-Notizen
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-white sm:text-2xl">
                    {aktiveBildNotiz.datumText} ·{" "}
                    {getStundenEintragTitel(
                      aktiveBildNotiz.eintragsart,
                      aktiveBildNotiz.bemerkung,
                    )}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                    {getBildNotizLabel(aktiveBildNotiz.bildNotizen.length)}
                    {getStundenEintragUntertitel(
                      aktiveBildNotiz.eintragsart,
                      aktiveBildNotiz.bemerkung,
                    )
                      ? ` · ${getStundenEintragUntertitel(
                          aktiveBildNotiz.eintragsart,
                          aktiveBildNotiz.bemerkung,
                        )}`
                      : ""}
                  </p>
                </div>

                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                  onClick={() => setAktiveBildNotizId(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-3 sm:p-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  {aktiveBildNotiz.bildNotizen.map((bildNotiz, index) => (
                    <div
                      key={bildNotiz.id}
                      className="overflow-hidden rounded-[28px] border border-white/10 bg-black/40"
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-white">{bildNotiz.titel}</div>
                          <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                            Bild {index + 1}
                          </div>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-zinc-300">
                          {aktiveBildNotiz.datumText}
                        </div>
                      </div>
                      <div className="relative min-h-[340px] bg-black/50">
                        <Image
                          alt={`${bildNotiz.titel} vom ${aktiveBildNotiz.datumText}`}
                          className="object-contain"
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          src={bildNotiz.url}
                          unoptimized
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {aktiveBearbeitung ? (
        <StundeEditModal
          key={aktiveBearbeitung.id}
          eintrag={aktiveBearbeitung}
          onClose={() => setAktiveBearbeitungId(null)}
          onDeleted={handleEintragGeloescht}
        />
      ) : null}
    </main>
  );
}
