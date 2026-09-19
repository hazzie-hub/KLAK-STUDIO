"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { sahneyiKilitle, yayinla, yeniVersiyon, type KayitSonucu } from "./eylemler";
import { Dugme, Kart } from "./panel";

/**
 * Onay ve versiyon. CLAUDE.md §8
 *
 * Kilitli = onaylanmış. Kilitli sahne değiştirilemez; revizyon YENİ VERSİYON
 * açar ve önceki hali arşivlenir. Sahnenin linki hiç değişmez — sete
 * gönderilen QR ve adres geçerliliğini korur.
 *
 * "Sayfaları tazele" buraya sessiz bir bağlantı olarak kondu: kaydetmek zaten
 * sayfaları tazeliyor, bu yalnızca emin olmak isteyenler için.
 */
export function KilitKutusu({
  kod,
  kilitli,
  versiyon,
}: {
  kod: string;
  kilitli: boolean;
  versiyon: number;
}) {
  const router = useRouter();
  const [bekliyor, basla] = useTransition();
  const [hata, setHata] = useState<string | null>(null);
  const [tazelendi, setTazelendi] = useState(false);

  const calistir = (is: () => Promise<KayitSonucu>) => {
    setHata(null);
    basla(async () => {
      const cevap = await is();
      if (cevap.ok) router.refresh();
      else setHata(cevap.hatalar[0]?.mesaj ?? "İşlem tamamlanamadı.");
    });
  };

  return (
    <Kart
      vurgu={kilitli ? "yesil" : undefined}
      baslik={kilitli ? `Onaylandı · versiyon ${versiyon}` : `Onaylanmadı · versiyon ${versiyon}`}
      aciklama={
        kilitli
          ? "Sahne kilitli, yanlışlıkla değişmez. Düzeltmek için yeni versiyon açın; önceki hali arşivde kalır ve link değişmez."
          : "Onaylayınca sahne kilitlenir ve yanlışlıkla değiştirilemez."
      }
      sag={
        kilitli ? (
          <Dugme tur="ikincil" kucuk disabled={bekliyor} onClick={() => calistir(() => yeniVersiyon(kod))}>
            {bekliyor ? "Açılıyor…" : `Yeni versiyon (${versiyon + 1})`}
          </Dugme>
        ) : (
          <Dugme tur="onay" kucuk disabled={bekliyor} onClick={() => calistir(() => sahneyiKilitle(kod))}>
            {bekliyor ? "Onaylanıyor…" : "Onayla"}
          </Dugme>
        )
      }
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          onClick={() => {
            setHata(null);
            basla(async () => {
              const cevap = await yayinla(kod);
              if (cevap.ok) {
                setTazelendi(true);
                setTimeout(() => setTazelendi(false), 2500);
              } else setHata(cevap.mesaj);
            });
          }}
          disabled={bekliyor}
          className="text-[12px] font-medium text-[#0071e3] disabled:opacity-45"
        >
          {tazelendi ? "Sahne sayfaları tazelendi" : "Sahne sayfalarını tazele"}
        </button>
        <span className="text-[11px] text-[#8e8e93]">
          Kaydedince zaten tazelenir; bu yalnızca emin olmak içindir.
        </span>
      </div>
      {hata !== null && <p className="mt-3 text-[13px] text-[#c7392e]">{hata}</p>}
    </Kart>
  );
}
