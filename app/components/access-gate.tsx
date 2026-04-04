"use client";

import { useActionState } from "react";
import { CalendarRange, LockKeyhole, ShieldCheck } from "lucide-react";
import { type AuthState, unlockSite } from "../actions/auth";

const initialState: AuthState = { error: null };

export function AccessGate() {
  const config = {
    action: unlockSite,
    area: "Alle Stundenzettel",
    description: "Gib das vereinbarte Passwort ein, um die Stundenzettel-Übersicht zu öffnen.",
    title: "Diese Seite ist nur mit Passwort erreichbar.",
  };
  const [state, formAction, pending] = useActionState(config.action, initialState);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(226,6,19,0.2),_transparent_32%),linear-gradient(180deg,_rgb(18,18,20)_0%,_rgb(11,11,12)_100%)] px-4 py-6 text-zinc-50 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center justify-center sm:min-h-[calc(100vh-4rem)]">
        <div className="relative w-full overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur sm:rounded-[38px] sm:p-8 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:p-10">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(226,6,19,0.12)_45%,transparent_100%)]" />
          <div className="absolute -right-16 top-10 h-48 w-48 rounded-full bg-[#E20613]/20 blur-3xl" />
          <div className="absolute -left-12 bottom-0 h-36 w-36 rounded-full bg-orange-400/10 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E20613]/20 bg-[#E20613]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-red-100">
              <ShieldCheck size={14} />
              Geschützter Zugang
            </div>

            <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              {config.title}
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-300 sm:text-base">
              {config.description}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: "Bereich",
                  value: config.area,
                  icon: CalendarRange,
                },
                {
                  label: "Sicherheit",
                  value: "Passwortgeschützt",
                  icon: LockKeyhole,
                },
              ].map((karte) => {
                const Icon = karte.icon;

                return (
                  <div
                    key={karte.label}
                    className="rounded-[24px] border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                          {karte.label}
                        </div>
                        <div className="mt-2 text-lg font-medium text-white">{karte.value}</div>
                      </div>
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#E20613]/10 text-[#ffb4ba]">
                        <Icon size={18} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative mt-8 rounded-[28px] border border-white/10 bg-black/25 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] lg:mt-0 lg:p-6">
            <div className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
              Passwort eingeben
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">Zugang freischalten</div>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Nach erfolgreicher Eingabe bleibt die Seite auf diesem Gerät freigeschaltet.
            </p>

            <form action={formAction} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-200">Passwort</span>
                <input
                  autoComplete="current-password"
                  autoFocus
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white outline-none transition placeholder:text-zinc-500 focus:border-[#E20613]/50 focus:ring-2 focus:ring-[#E20613]/20"
                  name="password"
                  placeholder="Passwort eingeben"
                  type="password"
                />
              </label>

              {state.error ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {state.error}
                </div>
              ) : null}

              <button
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[#E20613] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b5050f] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={pending}
                type="submit"
              >
                {pending ? "Prüfe Passwort..." : "Seite öffnen"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
