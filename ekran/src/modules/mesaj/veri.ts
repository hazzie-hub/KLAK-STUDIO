"use client";

import { useMemo } from "react";

import { markalar } from "@brands";
import { useDurum } from "@/durum";
import { useSahne } from "@/engine";
import { useKutuphane } from "@/icerik/kutuphane";
import type { Hesap, Olay, Sahne, SohbetVerisi } from "@/schema";

export const MARKA = markalar.mesaj;

export type GorunenMesaj = {
  kim: "ben" | string;
  benMi: boolean;
  metin?: string;
  gorsel?: string;
  saat?: string;
  durum?: "gonderildi" | "iletildi" | "goruldu";
  /** Sahne sırasında geldi mi? (animasyon için) */
  yeni: boolean;
};

export type GorunenSohbet = {
  id: string;
  hesap: Hesap | null;
  mesajlar: GorunenMesaj[];
  /** Karşı taraf şu an yazıyor mu? */
  yaziyor: boolean;
  okunmamis: number;
};

type KutuphaneGorunumu = {
  hesap: (id: string) => Hesap | null;
  sohbetler: Array<{ id: string; veri: SohbetVerisi }>;
};

/**
 * `mesaj` modülünün verisi — sosyal modülündeki mantığın aynısı:
 * ekran, GERÇEKLEŞEN OLAYLARDAN türer, modül kendi listesini tutmaz.
 */
export function mesajVeriTuret(
  _sahne: Sahne,
  olanlar: Olay[],
  kutuphane: KutuphaneGorunumu,
  /** Cihazın o anki saati — sahne içinde gelen mesajlara bu yazılır. */
  saat: string,
): GorunenSohbet[] {
  return kutuphane.sohbetler.map(({ id, veri }) => {
    const gelenler: GorunenMesaj[] = [];
    let yaziyor = false;
    let sonDurum: GorunenMesaj["durum"] | undefined;

    for (const olay of olanlar) {
      const a = olay.aksiyon;
      if (a.tur === "mesajGeldi" && a.sohbet === id) {
        gelenler.push({
          kim: veri.hesap,
          benMi: false,
          metin: a.metin,
          gorsel: a.gorselRef,
          saat,
          yeni: true,
        });
        yaziyor = false;
      } else if (a.tur === "yaziyor" && a.sohbet === id) {
        yaziyor = true;
      } else if (a.tur === "mesajDurumu" && a.sohbet === id) {
        sonDurum = a.durum;
      }
    }

    const temel: GorunenMesaj[] = veri.mesajlar.map((m) => ({
      kim: m.kim,
      benMi: m.kim === "ben",
      metin: m.metin,
      gorsel: m.gorsel,
      saat: m.saat,
      durum: m.durum,
      yeni: false,
    }));

    // Son "ben" mesajının durumu sahne içinde değişebilir.
    if (sonDurum !== undefined) {
      for (let i = temel.length - 1; i >= 0; i--) {
        if (temel[i]?.benMi === true) {
          temel[i] = { ...temel[i]!, durum: sonDurum };
          break;
        }
      }
    }

    return {
      id,
      hesap: kutuphane.hesap(veri.hesap),
      mesajlar: [...temel, ...gelenler],
      yaziyor,
      okunmamis: gelenler.length,
    };
  });
}

export function useMesajVeri(): GorunenSohbet[] {
  const { sahne, olanlar } = useSahne();
  const { durum } = useDurum();
  const k = useKutuphane();

  return useMemo(() => {
    const sohbetler = [...k.icerikler.values()].flatMap((i) =>
      i.tur === "sohbet" ? [{ id: i.id, veri: i.veri }] : [],
    );
    return mesajVeriTuret(sahne, olanlar, { hesap: k.hesap, sohbetler }, durum.saat);
  }, [sahne, olanlar, k, durum.saat]);
}
