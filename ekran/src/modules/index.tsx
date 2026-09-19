"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import type { Cihaz, Modul } from "@/schema";
import { useAktifEkran, type AktifEkran } from "./aktif-ekran";
import { AnaEkranModulu } from "./anaekran";
import { AramaModulu } from "./arama";
import { GaleriModulu } from "./galeri";
import { HaritaModulu } from "./harita";
import { KilitModulu } from "./kilit";
import { MesajModulu } from "./mesaj";
import { SosyalModulu } from "./sosyal";
import { TelefonModulu } from "./telefon";
import { WebModulu } from "./web";
import { YerTutucu } from "./yer-tutucu";

/**
 * O an açık olan modülü seçer. CLAUDE.md §3.1 (3. katman)
 *
 * İKİ KAYNAK:
 *  1. Olaylar — sahnenin `baslangic`ı ve gerçekleşen `ekranAc` aksiyonları
 *     (bkz. `aktif-ekran.ts`). Asıl kaynak budur.
 *  2. Oyuncunun dokunuşu — ana ekrandan bir uygulamaya girmek gibi. Bu GEÇİCİ
 *     bir gezinmedir, olay listesine yazılmaz.
 *
 * Geçici gezinme, olaylardan gelen ekran DEĞİŞİNCE ve başa sarılınca sıfırlanır:
 * sahne tekrar oynatıldığında oyuncunun önceki turda nereye gezindiği
 * hatırlanmamalı, yoksa her tekrar birebir aynı olmaz (CLAUDE.md §2.4).
 */
export type Gezinme = (modul: Modul, ekran: string, icerikRef?: string) => void;

export function ModulSec({ cihaz }: { cihaz: Cihaz | null }) {
  const olaydan = useAktifEkran();
  const [yerel, setYerel] = useState<AktifEkran | null>(null);

  const olaydanAnahtar = `${olaydan.modul}|${olaydan.ekran}|${olaydan.icerikRef ?? ""}|${olaydan.hesap ?? ""}`;
  const oncekiRef = useRef(olaydanAnahtar);
  useEffect(() => {
    if (oncekiRef.current !== olaydanAnahtar) {
      oncekiRef.current = olaydanAnahtar;
      setYerel(null);
    }
  }, [olaydanAnahtar]);

  const git: Gezinme = (modul, ekran, icerikRef) => setYerel({ modul, ekran, icerikRef });

  const { modul, ekran, icerikRef, hesap } = yerel ?? olaydan;

  const govde = ((): ReactNode => {
  switch (modul) {
    case "kilit":
      return <KilitModulu duvarKagidi={cihaz?.kilitEkrani ?? cihaz?.duvarKagidi} />;
    case "sosyal":
      return <SosyalModulu baslangicEkrani={ekran} hesapId={hesap} />;
    case "mesaj":
      return <MesajModulu baslangicEkrani={ekran} sohbetId={icerikRef} />;
    case "arama":
      return <AramaModulu baslangicEkrani={ekran} icerikRef={icerikRef} />;
    case "web":
      return <WebModulu icerikRef={icerikRef} />;
    case "telefon":
      return <TelefonModulu baslangicEkrani={ekran} cihaz={cihaz} />;
    case "galeri":
      return <GaleriModulu baslangicEkrani={ekran} icerikRef={icerikRef} />;
    case "harita":
      return <HaritaModulu icerikRef={icerikRef} />;
    case "anaekran":
      return <AnaEkranModulu cihaz={cihaz} git={git} />;
    default:
      return <YerTutucu modul={modul} ekran={ekran} />;
  }
  })();

  // Oyuncu ana ekrandan bir uygulamaya girdiyse geri dönebilmeli. Gerçek
  // telefonlarda bu alttaki çizgidir; ekrana görünür bir "geri" düğmesi
  // koymak kamerada yanlış durur (CLAUDE.md §2.6). Şerit yalnızca geçici
  // gezinme varken vardır; sahnenin kendi ekranındayken hiç çizilmez.
  return (
    <>
      {govde}
      {yerel !== null && (
        <button
          onClick={() => setYerel(null)}
          aria-label="Ana ekran"
          className="absolute inset-x-0 bottom-0 z-[45] h-[18px]"
          style={{ background: "transparent" }}
        />
      )}
    </>
  );
}

export { KilitModulu } from "./kilit";
export { SosyalModulu } from "./sosyal";
export { MesajModulu } from "./mesaj";
export { AramaModulu } from "./arama";
export { WebModulu } from "./web";
export { TelefonModulu } from "./telefon";
export { GaleriModulu } from "./galeri";
export { HaritaModulu } from "./harita";
export { AnaEkranModulu } from "./anaekran";
export { modulGorunumu, type ModulGorunumu } from "./gorunum";
export { useAktifEkran, aktifEkranTuret, type AktifEkran } from "./aktif-ekran";
