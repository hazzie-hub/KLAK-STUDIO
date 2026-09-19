"use client";

import type { Alan } from "./alanlar";

export type Secenekler = {
  hesap: Array<{ deger: string; etiket: string }>;
  icerik: Array<{ deger: string; etiket: string }>;
  sohbet: Array<{ deger: string; etiket: string }>;
  post: Array<{ deger: string; etiket: string }>;
  modul: Array<{ deger: string; etiket: string }>;
  cihaz: Array<{ deger: string; etiket: string }>;
};

/**
 * Tek bir form alanı. Alan tanımına (`alanlar.ts`) bakıp kendini çizer.
 * Yeni bir aksiyon eklendiğinde buraya dokunulmaz.
 */
export function AlanGirdisi({
  alan,
  deger,
  degistir,
  secenekler,
}: {
  alan: Alan;
  deger: unknown;
  degistir: (yeni: unknown) => void;
  secenekler: Secenekler;
}) {
  const metin = deger === undefined || deger === null ? "" : String(deger);
  const ortak =
    "w-full rounded-lg border border-[#d2d2d7] px-3 py-[7px] text-[14px] outline-none focus:border-[#0071e3]";

  return (
    <label className="block">
      <span className="mb-[3px] block text-[12px] font-medium text-[#3a3a3c]">
        {alan.etiket}
        {alan.zorunlu === true && <span className="ml-1 text-[#c7392e]">*</span>}
      </span>

      {alan.tur === "onay" ? (
        <input
          type="checkbox"
          checked={deger === true}
          onChange={(e) => degistir(e.target.checked ? true : undefined)}
          className="h-4 w-4"
        />
      ) : alan.tur === "uzunMetin" ? (
        <textarea
          value={metin}
          rows={2}
          onChange={(e) => degistir(e.target.value === "" ? undefined : e.target.value)}
          className={ortak}
        />
      ) : alan.tur === "sayi" ? (
        <input
          type="number"
          value={metin}
          min={alan.en_az}
          max={alan.en_cok}
          onChange={(e) =>
            degistir(e.target.value === "" ? undefined : Number(e.target.value))
          }
          className={ortak}
        />
      ) : alan.tur === "secim" ? (
        <select
          value={metin}
          onChange={(e) => degistir(e.target.value === "" ? undefined : e.target.value)}
          className={ortak}
        >
          <option value="">—</option>
          {(alan.secenekler ?? []).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
          {alan.kaynak !== undefined &&
            secenekler[alan.kaynak].map((s) => (
              <option key={s.deger} value={s.deger}>
                {s.etiket}
              </option>
            ))}
        </select>
      ) : (
        <input
          type="text"
          value={metin}
          onChange={(e) => degistir(e.target.value === "" ? undefined : e.target.value)}
          className={`${ortak} ${alan.tur === "slug" ? "font-mono text-[13px]" : ""}`}
        />
      )}

      {alan.ipucu !== undefined && (
        <span className="mt-[3px] block text-[11px] text-[#86868b]">{alan.ipucu}</span>
      )}
    </label>
  );
}
