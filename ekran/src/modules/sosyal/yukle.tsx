"use client";

import { useState } from "react";

import { markalar } from "@brands";
import { useSahne } from "@/engine";
import { useKutuphane } from "@/icerik/kutuphane";
import { Medya } from "@/shared/medya";
import { HOTSPOT } from "./hotspotlar";
import { Geri } from "./parcalar";

const MARKA = markalar.akis;

/**
 * Post yükleme akışı: fotoğraf seç → açıklama → paylaş.
 *
 * Sahnenin `postYukle` aksiyonundaki içerik hangisiyse, seçili fotoğraf odur;
 * oyuncu hangi kareye dokunursa dokunsun doğru fotoğraf paylaşılır (aynı
 * mantık ghost typing'de de var, CLAUDE.md §7).
 *
 * "Paylaş"a basınca modül sadece `yeni-post-akisi-tamam` hedefine dokunur;
 * postun gerçekten yüklenmesi sahnenin olayıdır.
 */
export function YuklemeAkisi({ kapat }: { kapat: () => void }) {
  const { sahne, dokun } = useSahne();
  const kutuphane = useKutuphane();
  const [adim, setAdim] = useState<"sec" | "aciklama">("sec");

  // Sahne hangi postu yükleyecek?
  const hedefId = sahne.olaylar.flatMap((o) =>
    o.aksiyon.tur === "postYukle" ? [o.aksiyon.icerikRef] : [],
  )[0];
  const hedef = hedefId === undefined ? null : kutuphane.post(hedefId);

  // Galeri: sahnenin fotoğrafı en başta, arkası kütüphaneden dolgu.
  const galeri = [
    ...(hedef === null ? [] : [hedef.veri.gorsel]),
    ...kutuphane.postlar.map((p) => p.veri.gorsel).filter((g) => g !== hedef?.veri.gorsel),
  ];

  const paylas = () => {
    dokun(HOTSPOT.postPaylas);
    kapat();
  };

  if (adim === "sec") {
    return (
      <div className="flex h-full flex-col" style={{ background: "var(--zemin)" }}>
        <Baslik
          sol={<button onClick={kapat} aria-label="Vazgeç"><Geri /></button>}
          orta="Yeni gönderi"
          sag={
            <button onClick={() => setAdim("aciklama")} className="text-[14px] font-semibold" style={{ color: MARKA.renk }}>
              İleri
            </button>
          }
        />
        {hedef !== null && (
          <Medya
            kaynak={`/ornek/${hedef.veri.gorsel}`}
            alt={hedef.veri.aciklama}
            className="w-full shrink-0"
            style={{ aspectRatio: "1 / 1", color: "var(--metin)" }}
          />
        )}
        <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-4 gap-[2px] overflow-auto pt-[2px]">
          {galeri.map((g, i) => (
            <div key={`${g}-${i}`} className="relative">
              <Medya
                kaynak={`/ornek/${g}`}
                alt=""
                className="w-full"
                style={{ aspectRatio: "1 / 1", color: "var(--metin)" }}
              />
              {i === 0 && (
                <span
                  className="absolute right-[5px] top-[5px] block h-[17px] w-[17px] rounded-full"
                  style={{ background: MARKA.renk, border: "2px solid #fff" }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" style={{ background: "var(--zemin)" }}>
      <Baslik
        sol={<button onClick={() => setAdim("sec")} aria-label="Geri"><Geri /></button>}
        orta="Yeni gönderi"
        sag={
          <button onClick={paylas} className="text-[14px] font-semibold" style={{ color: MARKA.renk }}>
            Paylaş
          </button>
        }
      />
      <div className="flex gap-[11px] p-[13px]">
        {hedef !== null && (
          <Medya
            kaynak={`/ornek/${hedef.veri.gorsel}`}
            alt=""
            className="w-[76px] shrink-0"
            style={{ aspectRatio: "1 / 1", color: "var(--metin)" }}
          />
        )}
        <div className="min-w-0 flex-1 text-[13px] leading-snug" style={{ color: "var(--metin)" }}>
          {hedef?.veri.aciklama}
        </div>
      </div>
      <div className="px-[13px] text-[13px]" style={{ borderTop: "1px solid var(--ayrac)" }}>
        {[["Kişileri etiketle"], ["Yer ekle"], ["Diğer uygulamalara da paylaş"]].map(([e]) => (
          <div
            key={e}
            className="flex items-center justify-between py-[13px]"
            style={{ borderBottom: "1px solid var(--ayrac)" }}
          >
            <span>{e}</span>
            <span style={{ color: "var(--metin-soluk)" }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Baslik({
  sol,
  orta,
  sag,
}: {
  sol: React.ReactNode;
  orta: string;
  sag: React.ReactNode;
}) {
  return (
    <header
      className="flex h-[46px] shrink-0 items-center justify-between px-[13px]"
      style={{ borderBottom: "1px solid var(--ayrac)", color: "var(--metin)" }}
    >
      <div className="w-[70px]">{sol}</div>
      <span className="text-[15px] font-semibold">{orta}</span>
      <div className="w-[70px] text-right">{sag}</div>
    </header>
  );
}
