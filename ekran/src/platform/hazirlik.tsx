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
  /** Kaç varlık indi / toplam kaç var. Gizli panelde görünür. */
  inen: number;
  toplam: number;
  /** Service worker gerçekten devrede mi? Devrede değilse offline çalışmaz. */
  swDevrede: boolean;
  /**
   * Ana ekrandan mı açıldı? iOS'ta tarayıcıdan açılınca hem Safari'nin
   * çubuğu hem iOS'un durum çubuğu görünür — kameraya iki saat çıkar.
   */
  tamEkranUygulama: boolean;
};

const Baglam = createContext<Hazirlik>({
  hazir: false,
  isaretVer: false,
  inen: 0,
  toplam: 0,
  swDevrede: false,
  tamEkranUygulama: false,
});

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
  const [inen, setInen] = useState(0);
  const [swDevrede, setSwDevrede] = useState(false);
  const [tamEkranUygulama, setTamEkranUygulama] = useState(false);

  useEffect(() => {
    const iosTamEkran =
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const digerTamEkran = window.matchMedia("(display-mode: standalone)").matches;
    setTamEkranUygulama(iosTamEkran || digerTamEkran);
  }, []);

  useEffect(() => {
    let iptal = false;

    const indir = async () => {
      // Service worker varsa devreye girmesini bekle ki indirdiklerimiz önbelleğe girsin.
      if ("serviceWorker" in navigator) {
        // 1) Kurulumu bitirmesini bekle.
        const kayit = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<null>((c) => setTimeout(() => c(null), SW_BEKLEME)),
        ]);

        // 2) SAYFAYI DEVRALMASINI bekle. İlk ziyarette kurulum biter ama
        //    sayfa henüz service worker'ın denetiminde değildir; bu yüzden
        //    "hazır" dememize rağmen uçak modunda açılmıyordu. Devralana
        //    kadar bekleyip öyle hazır diyoruz.
        if (kayit !== null && navigator.serviceWorker.controller === null) {
          await Promise.race([
            new Promise<void>((c) => {
              navigator.serviceWorker.addEventListener("controllerchange", () => c(), {
                once: true,
              });
            }),
            new Promise<void>((c) => setTimeout(c, SW_BEKLEME)),
          ]);
        }

        if (!iptal) setSwDevrede(navigator.serviceWorker.controller !== null);
      }

      await Promise.all(
        varliklar.map((yol) =>
          fetch(yol, { cache: "force-cache" })
            .then(() => {
              if (!iptal) setInen((n) => n + 1);
            })
            .catch(() => {
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

  return (
    <Baglam.Provider
      value={{
        hazir,
        isaretVer,
        inen,
        toplam: varliklar.length,
        swDevrede,
        tamEkranUygulama,
      }}
    >
      {children}
    </Baglam.Provider>
  );
}

export function useHazirlik(): Hazirlik {
  return useContext(Baglam);
}
