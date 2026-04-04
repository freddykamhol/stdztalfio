"use client";

import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Unerwarteter App-Fehler", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(226,6,19,0.18),_transparent_32%),linear-gradient(180deg,_rgb(18,18,20)_0%,_rgb(11,11,12)_100%)] px-4 py-6 text-zinc-50 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl items-center justify-center sm:min-h-[calc(100vh-4rem)]">
        <div className="w-full rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur sm:rounded-[38px] sm:p-8">
          <div className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-red-100">
            Serverfehler
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Die Seite konnte gerade nicht geladen werden.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
            Der Server hat beim Laden einen Fehler gemeldet. Bitte versuche es erneut. Wenn der
            Fehler bleibt, prüfe die Server-Logs und die Datenbank-Konfiguration.
          </p>

          {error.digest ? (
            <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Digest</div>
              <div className="mt-2 text-sm text-zinc-300">{error.digest}</div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex items-center justify-center rounded-2xl bg-[#E20613] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b5050f]"
              onClick={reset}
              type="button"
            >
              Erneut versuchen
            </button>
            <button
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
              onClick={() => window.location.assign("/")}
              type="button"
            >
              Zur Startseite
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
