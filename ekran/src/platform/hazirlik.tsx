"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Sahnenin sete hazır olması. CLAUDE.md §2.3 ve §6
 *
 * Oynatıcı açılır açılmaz sahnenin tüm görsellerini indirir; service worker
 * bunları önbelleğe alır. Hepsi inince "hazır" olur ve operatöre SADECE
 * ONUN ANLAYACAĞI bir işaret verilir (saatin iki noktası bir kez yanıp söner).
 *
 * CLAUDE.md §2.6: kameraya fark edilir hiçbir şey çıkmaz — yükleniyor çarkı,
 * yüzde, metin yok.
 */

type Hazirlik = {
  hazir: boolean;
  /** Hazır olma ANI — işaret yalnızca bir kez yanıp söner. */
  isaretVer: boolean;
};

const Baglam = createContext<Hazirlik>({ hazir: false, isaretVer: false });

const ISARET_SURESI = 900;
/** Service worker gelmezse sonsuza kadar beklemeyiz. */
const SW_BEKLEME = 4000;

export function HazirlikSaglayici({
  varliklar,
  children,
}: {
  varliklar: string[];
  children: ReactNode;
}) {
  const [hazir, setHazir] = useState(false);
  const [isaretVer, setIsaretVer] = useState(false);

  useEffect(() => {
    let iptal = false;

    const indir = async () => {
      // Service worker varsa devreye girmesini bekle ki indirdiklerimiz önbelleğe girsin.
      if ("serviceWorker" in navigator) {
        await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((c) => setTimeout(c, SW_BEKLEME)),
        ]);
      }

      await Promise.all(
        varliklar.map((yol) =>
          fetch(yol, { cache: "force-cache" }).catch(() => {
            // Bir varlık inmezse sahne yine oynar; sadece o görsel eksik kalır.
            console.error(`[ekran] Önbelleğe alınamadı: ${yol}`);
          }),
        ),
      );

      if (iptal) return;
      setHazir(true);
      setIsaretVer(true);
      setTimeout(() => {
        if (!iptal) setIsaretVer(false);
      }, ISARET_SURESI);
    };

    void indir();
    return () => {
      iptal = true;
    };
  }, [varliklar]);

  return <Baglam.Provider value={{ hazir, isaretVer }}>{children}</Baglam.Provider>;
}

export function useHazirlik(): Hazirlik {
  return useContext(Baglam);
}
