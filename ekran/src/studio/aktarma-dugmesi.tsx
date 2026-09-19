"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { iceriginiAktar, type AktarimSonucu } from "./eylemler";
import { Dugme, Kart } from "./panel";

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
    <Kart
      baslik="Depodaki içeriği aktar"
      aciklama="Koda yeni sahne ya da içerik eklendiyse veritabanına taşır. Hiçbir şey silmez, onaylanmış sahnelere dokunmaz. Depoda karşılığı olan ve onaylanmamış bir sahneyi burada düzenlediyseniz üstüne yazar."
      sag={
        <Dugme
          tur="ikincil"
          kucuk
          disabled={bekliyor}
          onClick={() => {
            setSonuc(null);
            basla(async () => {
              const cevap = await iceriginiAktar();
              setSonuc(cevap);
              if (cevap.ok) router.refresh();
            });
          }}
        >
          {bekliyor ? "Aktarılıyor…" : "Aktar"}
        </Dugme>
      }
    >
      {sonuc !== null && (
        <p className={`text-[13px] ${sonuc.ok ? "text-[#1d6b3f]" : "text-[#c7392e]"}`}>
          {sonuc.ok
            ? `Aktarıldı — ${Object.entries(sonuc.sayim)
                .map(([tablo, n]) => `${tablo}: ${n}`)
                .join(", ")}`
            : sonuc.mesaj}
        </p>
      )}
    </Kart>
  );
}
