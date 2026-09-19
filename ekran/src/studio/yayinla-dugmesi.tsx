"use client";

import { useState, useTransition } from "react";

import { yayinla, type YayinSonucu } from "./eylemler";

/**
 * Yayınla. CLAUDE.md §8
 *
 * Kaydetmek sahneyi veritabanına yazar ama SETE ÇIKARMAZ; sahne sayfaları
 * statik üretildiği için sitenin yeniden kurulması gerekir. Bu ayrım bilerek
 * görünür tutuldu: operatör neyin yayında olduğunu bilmeli.
 */
export function YayinlaDugmesi({ kod }: { kod: string }) {
  const [bekliyor, basla] = useTransition();
  const [sonuc, setSonuc] = useState<YayinSonucu | null>(null);

  return (
    <div className="rounded-2xl border border-[#d2d2d7] p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[#6e6e73]">
            Yayın
          </h3>
          <p className="mt-1 text-[12px] leading-relaxed text-[#6e6e73]">
            Kaydedince sahne linki kendiliğinden güncellenir. Bu düğme aynı şeyi elle
            yapar: emin olmak istediğinizde kullanın, birkaç saniye sürer.
          </p>
        </div>
        <button
          onClick={() => {
            setSonuc(null);
            basla(async () => setSonuc(await yayinla(kod)));
          }}
          disabled={bekliyor}
          className="shrink-0 rounded-full bg-[#1d1d1f] px-5 py-[9px] text-[14px] font-medium text-white active:opacity-80 disabled:opacity-50"
        >
          {bekliyor ? "Başlatılıyor…" : "Yayınla"}
        </button>
      </div>

      {sonuc !== null && (
        <p
          className={`mt-3 text-[13px] ${sonuc.ok ? "text-[#1d6b3f]" : "text-[#8c2820]"}`}
        >
          {sonuc.ok
            ? "Yayınlandı. Sahne linki artık güncel."
            : sonuc.mesaj}
        </p>
      )}
    </div>
  );
}
