import { AlertTriangle, Database, RefreshCw } from "lucide-react";

type DashboardUnavailableProps = {
  description: string;
  hint: string;
  technicalDetail?: string;
  title: string;
};

export function DashboardUnavailable({
  description,
  hint,
  technicalDetail,
  title,
}: DashboardUnavailableProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(226,6,19,0.18),_transparent_32%),linear-gradient(180deg,_rgb(18,18,20)_0%,_rgb(11,11,12)_100%)] px-4 py-6 text-zinc-50 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center justify-center sm:min-h-[calc(100vh-4rem)]">
        <div className="relative w-full overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur sm:rounded-[38px] sm:p-8 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:p-10">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(226,6,19,0.12)_45%,transparent_100%)]" />
          <div className="absolute -right-16 top-10 h-48 w-48 rounded-full bg-[#E20613]/20 blur-3xl" />
          <div className="absolute -left-12 bottom-0 h-36 w-36 rounded-full bg-orange-400/10 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
              <AlertTriangle size={14} />
              Übersicht pausiert
            </div>

            <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              {title}
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-300 sm:text-base">
              {description}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: "Bereich",
                  value: "Dashboard",
                  icon: Database,
                },
                {
                  label: "Status",
                  value: "Server prüfen",
                  icon: AlertTriangle,
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
              Nächster Schritt
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">Konfiguration prüfen</div>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{hint}</p>

          <div className="mt-6 flex flex-col gap-3">
              <form action="/" method="get">
                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#E20613] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b5050f]"
                  type="submit"
                >
                  <RefreshCw size={16} />
                  Erneut laden
                </button>
              </form>

              {technicalDetail ? (
                <div className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Technischer Hinweis
                  </div>
                  <div className="mt-2 break-words text-sm text-zinc-300">{technicalDetail}</div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
