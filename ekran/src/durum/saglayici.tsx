"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import type { BaglantiProfili, GorselYukleme } from "@/schema";
import type { GorunenDurum } from "@/shell/gorunen-durum";
import { etkinGorsel } from "./etkin-gorsel";

/**
 * Cihaz durumu katmanı. CLAUDE.md §3.1 (2. katman)
 *
 * TEK KAYNAK: saat, pil, sinyal, bağlantı profili, görsel yükleme.
 * Durum çubuğu da, medya bileşeni de, modüller de buradan okur.
 * Hiçbir modül kendi "yavaş yükleme" ya da "pil azaldı" mantığını yazmaz.
 *
 * Zaman çizelgesi (Adım 4) bu katmanı `guncelle` ile değiştirecek:
 * pilDegisti, baglantiDegisti aksiyonları buraya düşer.
 */

type DurumDegisikligi = Partial<GorunenDurum>;

type DurumBaglami = {
  durum: GorunenDurum;
  /** Görselin gerçekte nasıl davranacağı — bağlantı profiliyle birleştirilmiş hali. */
  gorselDavranisi: GorselYukleme;
  guncelle: (degisiklik: DurumDegisikligi) => void;
  basaSar: () => void;
};

const Baglam = createContext<DurumBaglami | null>(null);

export function DurumSaglayici({
  baslangic,
  children,
}: {
  baslangic: GorunenDurum;
  children: ReactNode;
}) {
  const [durum, setDurum] = useState<GorunenDurum>(baslangic);

  const guncelle = useCallback((degisiklik: DurumDegisikligi) => {
    setDurum((onceki) => ({ ...onceki, ...degisiklik }));
  }, []);

  // CLAUDE.md §6: başa sar, sahneyi birebir ilk haline döndürür.
  const basaSar = useCallback(() => setDurum(baslangic), [baslangic]);

  const deger = useMemo<DurumBaglami>(
    () => ({
      durum,
      gorselDavranisi: etkinGorsel(durum.baglanti, durum.gorsel),
      guncelle,
      basaSar,
    }),
    [durum, guncelle, basaSar],
  );

  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}

export function useDurum(): DurumBaglami {
  const b = useContext(Baglam);
  if (b === null) {
    throw new Error("useDurum, <DurumSaglayici> içinde çağrılmalı.");
  }
  return b;
}

/** Sinyal çubuğu sayısı — bağlantı profilinden türer. */
export function sinyalCubugu(baglanti: BaglantiProfili): number {
  switch (baglanti) {
    case "yok":
      return 0;
    case "yavas":
      return 2;
    case "normal":
      return 4;
  }
}
