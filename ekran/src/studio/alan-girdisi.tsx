"use client";

import type { Alan } from "./alanlar";
import { kimlikBitir, kimlikYaz } from "./kimlik";
import { Alan as AlanKutusu, GIRDI_SINIFI } from "./panel";

/**
 * Kimlik yazılan alanlarda tarayıcı yardımı KAPALI: ilk harfi büyütmek,
 * otomatik düzeltmek ya da geçmişten öneri getirmek hep bozuk kimlik üretiyor.
 */
const KIMLIK_OZELLIKLERI = {
  autoCapitalize: "none",
  autoCorrect: "off",
  autoComplete: "off",
  spellCheck: false,
} as const;

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
  alanId,
  hata,
}: {
  alan: Alan;
  deger: unknown;
  degistir: (yeni: unknown) => void;
  secenekler: Secenekler;
  alanId?: string;
  hata?: string | null;
}) {
  const metin = deger === undefined || deger === null ? "" : String(deger);

  if (alan.tur === "onay") {
    return (
      <label className="flex items-center gap-[9px] text-[13px] text-[#1d1d1f]">
        <input
          type="checkbox"
          checked={deger === true}
          onChange={(e) => degistir(e.target.checked ? true : undefined)}
          className="h-[15px] w-[15px] accent-[#0071e3]"
        />
        {alan.etiket}
      </label>
    );
  }

  return (
    <AlanKutusu
      etiket={alan.etiket}
      zorunlu={alan.zorunlu}
      ipucu={alan.ipucu}
      alanId={alanId}
      hata={hata}
    >
      {alan.tur === "uzunMetin" ? (
        <textarea
          value={metin}
          rows={2}
          onChange={(e) => degistir(e.target.value === "" ? undefined : e.target.value)}
          className={GIRDI_SINIFI}
        />
      ) : alan.tur === "sayi" ? (
        <input
          type="number"
          value={metin}
          min={alan.en_az}
          max={alan.en_cok}
          onChange={(e) => degistir(e.target.value === "" ? undefined : Number(e.target.value))}
          className={GIRDI_SINIFI}
        />
      ) : alan.tur === "secim" ? (
        <select
          value={metin}
          onChange={(e) => degistir(e.target.value === "" ? undefined : e.target.value)}
          className={GIRDI_SINIFI}
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
      ) : alan.tur === "slug" ? (
        // Kimlik alanları YAZARKEN düzeltilir: hata göstermek yerine
        // kullanıcının yazdığını geçerli hale getiriyoruz.
        <input
          type="text"
          value={metin}
          {...KIMLIK_OZELLIKLERI}
          onChange={(e) => {
            const temiz = kimlikYaz(e.target.value);
            degistir(temiz === "" ? undefined : temiz);
          }}
          onBlur={(e) => {
            const son = kimlikBitir(e.target.value);
            degistir(son === "" ? undefined : son);
          }}
          className={`${GIRDI_SINIFI} font-mono text-[13px]`}
        />
      ) : (
        <input
          type="text"
          value={metin}
          onChange={(e) => degistir(e.target.value === "" ? undefined : e.target.value)}
          className={GIRDI_SINIFI}
        />
      )}
    </AlanKutusu>
  );
}
