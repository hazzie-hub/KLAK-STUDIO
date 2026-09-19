"use client";

import { useMemo } from "react";

import { useSahne } from "@/engine";
import type { Modul, Olay, Sahne } from "@/schema";

/**
 * O an ekranda hangi modülün, hangi ekranının açık olduğu. CLAUDE.md §3.3
 *
 * Sahne `baslangic` ile açılır; sonra `ekranAc` aksiyonu gelirse oraya geçilir.
 * BAŞKA BİR MODÜLE de geçebilir — arama sonucundan siteye, posttan haritaya.
 *
 * Mimari gereği durum burada TUTULMAZ, gerçekleşen olaylardan TÜRETİLİR:
 * başa sarınca olay listesi boşalır ve sahne kendiliğinden başlangıca döner.
 */
export type AktifEkran = {
  modul: Modul;
  ekran: string;
  icerikRef?: string;
  hesap?: string;
};

export function aktifEkranTuret(sahne: Sahne, olanlar: Olay[]): AktifEkran {
  let aktif: AktifEkran = {
    modul: sahne.baslangic.modul,
    ekran: sahne.baslangic.ekran,
    icerikRef: sahne.baslangic.icerikRef,
    hesap: sahne.baslangic.hesap,
  };

  for (const olay of olanlar) {
    const a = olay.aksiyon;
    if (a.tur !== "ekranAc") continue;
    aktif = { modul: a.modul, ekran: a.ekran, icerikRef: a.icerikRef, hesap: a.hesap };
  }

  return aktif;
}

export function useAktifEkran(): AktifEkran {
  const { sahne, olanlar } = useSahne();
  return useMemo(() => aktifEkranTuret(sahne, olanlar), [sahne, olanlar]);
}
