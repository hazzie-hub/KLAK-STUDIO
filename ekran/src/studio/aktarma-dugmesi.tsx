"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { iceriginiAktar, type AktarimSonucu } from "./eylemler";

/**
 * Depodaki içeriği veritabanına aktarır. Faz 4.6
 *
 * Veritabanına geçildikten sonra `content/` dosyaları yayını beslemiyor.
 * Depoya yeni sahne ya da içerik eklendiğinde (geliştirme sırasında olur)
 * bu düğme onları veritabanına taşır. Yalnızca ekler ve günceller; siler
 * değil, kilitli sahnelere de dokunmaz.
 */
export function AktarmaDugmesi() {
  const router = useRouter();
  const [bekliyor, basla] = useTransition();
  const [sonuc, setSonuc] = useState<AktarimSonucu | null>(null);

  return (
    <section className="mt-8 rounded-2xl border border-[#e8e8ed] bg-[#fbfbfd] p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#6e6e73]">
            Depodaki içeriği aktar
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-[#6e6e73]">
            Koda yeni sahne ya da içerik eklendiyse bu düğme onları veritabanına taşır.
            Hiçbir şey silmez, onaylanmış sahnelere dokunmaz.
          </p>
        </div>
        <button
          onClick={() => {
            setSonuc(null);
            basla(async () => {
              const cevap = await iceriginiAktar();
              setSonuc(cevap);
              if (cevap.ok) router.refresh();
            });
          }}
          disabled={bekliyor}
          className="shrink-0 rounded-full border border-[#d2d2d7] bg-white px-5 py-[9px] text-[14px] font-medium active:bg-[#f5f5f7] disabled:opacity-50"
        >
          {bekliyor ? "Aktarılıyor…" : "Aktar"}
        </button>
      </div>

      {sonuc !== null && (
        <p className={`mt-3 text-[13px] ${sonuc.ok ? "text-[#1d6b3f]" : "text-[#8c2820]"}`}>
          {sonuc.ok
            ? `Aktarıldı — ${Object.entries(sonuc.sayim)
                .map(([tablo, n]) => `${tablo}: ${n}`)
                .join(", ")}`
            : sonuc.mesaj}
        </p>
      )}
    </section>
  );
}
