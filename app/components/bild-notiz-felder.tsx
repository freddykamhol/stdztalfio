"use client";

import { ImageIcon, Plus, Trash2 } from "lucide-react";

export type BildNotizFeld = {
  id: string;
  titel: string;
};

type BildNotizFelderProps = {
  beschreibung?: string;
  felder: BildNotizFeld[];
  onAdd: () => void;
  onChangeTitel: (id: string, titel: string) => void;
  onRemove: (id: string) => void;
  titel?: string;
};

export function BildNotizFelder({
  beschreibung = "Optional. JPG, PNG oder WebP bis 8 MB pro Bild.",
  felder,
  onAdd,
  onChangeTitel,
  onRemove,
  titel = "Bild-Notizen",
}: BildNotizFelderProps) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-4 sm:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-zinc-100">{titel}</div>
          <div className="mt-1 text-sm text-zinc-400">{beschreibung}</div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-100 transition hover:border-white/20 hover:bg-white/10"
          onClick={onAdd}
        >
          <Plus size={14} />
          Weiteres Bild
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {felder.map((feld, index) => (
          <div
            key={feld.id}
            className="rounded-[20px] border border-white/10 bg-black/20 px-3 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                <ImageIcon size={13} />
                Bild {index + 1}
              </div>
              {felder.length > 1 ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-100 transition hover:bg-red-500/20"
                  onClick={() => onRemove(feld.id)}
                >
                  <Trash2 size={13} />
                  Entfernen
                </button>
              ) : null}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-[1.2fr_1fr]">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-200">Bildname</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-[#E20613]/50 focus:ring-2 focus:ring-[#E20613]/20"
                  name="bildNotizTitel"
                  onChange={(event) => onChangeTitel(feld.id, event.target.value)}
                  placeholder="z. B. Krankmeldung, Baustelle vorne, Tankbeleg"
                  type="text"
                  value={feld.titel}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-200">Datei</span>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="w-full rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-3 text-sm text-zinc-200 file:mr-4 file:rounded-full file:border-0 file:bg-[#E20613] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#b5050f]"
                  name="bildNotizDatei"
                  type="file"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
