"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { sahneyiKilitle, yeniVersiyon, type KayitSonucu } from "./eylemler";

/**
 * Onay ve versiyon kutusu. CLAUDE.md §8
 *
 * Kilitli = onaylanmış. Kilitli sahne değiştirilemez; revizyon YENİ VERSİYON
 * açar ve önceki hali arşivlenir. Sahnenin linki hiç değişmez — sete
 * gönderilen QR ve adres geçerliliğini korur.
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
  const [sonuc, setSonuc] = useState<KayitSonucu | null>(null);

  const calistir = (is: () => Promise<KayitSonucu>) => {
    setSonuc(null);
    basla(async () => {
      const cevap = await is();
      setSonuc(cevap);
      if (cevap.ok) router.refresh();
    });
  };

  return (
    <div
      className={`rounded-2xl border p-4 ${
        kilitli ? "border-[#cfe4d4] bg-[#f2f9f4]" : "border-[#d2d2d7]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[#6e6e73]">
            Onay · versiyon {versiyon}
          </h3>
          <p className="mt-1 text-[12px] leading-relaxed text-[#6e6e73]">
            {kilitli
              ? "Sahne onaylandı ve kilitli. Değiştirmek için yeni versiyon açın; önceki hali arşivde kalır, link değişmez."
              : "Sahne henüz onaylanmadı. Onaylayınca kilitlenir ve yanlışlıkla değiştirilemez."}
          </p>
        </div>

        {kilitli ? (
          <button
            onClick={() => calistir(() => yeniVersiyon(kod))}
            disabled={bekliyor}
            className="shrink-0 rounded-full border border-[#d2d2d7] bg-white px-5 py-[9px] text-[14px] font-medium active:bg-[#f5f5f7] disabled:opacity-50"
          >
            {bekliyor ? "Açılıyor…" : `Yeni versiyon (${versiyon + 1})`}
          </button>
        ) : (
          <button
            onClick={() => calistir(() => sahneyiKilitle(kod))}
            disabled={bekliyor}
            className="shrink-0 rounded-full bg-[#1d6b3f] px-5 py-[9px] text-[14px] font-medium text-white active:opacity-80 disabled:opacity-50"
          >
            {bekliyor ? "Onaylanıyor…" : "Onayla ve kilitle"}
          </button>
        )}
      </div>

      {sonuc !== null && !sonuc.ok && (
        <p className="mt-3 text-[13px] text-[#8c2820]">{sonuc.hatalar[0]?.mesaj}</p>
      )}
    </div>
  );
}
