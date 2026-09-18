"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { BildirimKarti } from "./bildirim-karti";
import { useBildirimler, type Bildirim } from "./bildirimler";

/** Banner ekranda ne kadar durur. Sabit — her tekrarda aynı (CLAUDE.md §2.4). */
const BANNER_SURESI = 4600;

/**
 * Üstten düşen bildirim bannerları. CLAUDE.md §3.1 (4. katman)
 * Hangi modül açık olursa olsun üstte görünür.
 *
 * Kilit ekranı açıkken banner düşmez — bildirimler kilit ekranının kendi
 * listesinde birikir, gerçek telefonlardaki gibi.
 */
export function BannerKatmani() {
  const bildirimler = useBildirimler();
  const [gorunen, setGorunen] = useState<Bildirim[]>([]);
  const islenenRef = useRef(new Set<string>());

  // Dizi her render'da yeniden üretiliyor; efekt kimliğe değil İÇERİĞE baksın,
  // yoksa React her render'da temizleyip banner hiç kalkmıyor.
  const anahtarlar = useMemo(() => bildirimler.map((b) => b.anahtar).join("|"), [bildirimler]);

  const kaldir = useCallback((anahtar: string) => {
    setGorunen((o) => o.filter((g) => g.anahtar !== anahtar));
  }, []);

  useEffect(() => {
    // Başa sarıldıysa liste boşalır; her şeyi temizle.
    if (bildirimler.length === 0) {
      islenenRef.current.clear();
      setGorunen([]);
      return;
    }
    const yeniler = bildirimler.filter((b) => !islenenRef.current.has(b.anahtar));
    if (yeniler.length === 0) return;
    for (const b of yeniler) islenenRef.current.add(b.anahtar);
    setGorunen((o) => [...o, ...yeniler]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anahtarlar]);

  if (gorunen.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex flex-col gap-[6px] px-[10px] pt-[8px]">
      {gorunen.map((b) => (
        <Banner key={b.anahtar} bildirim={b} kaldir={kaldir} />
      ))}
    </div>
  );
}

/** Her banner kendi süresini tutar — böylece listedeki değişiklikler süreyi sıfırlamaz. */
function Banner({ bildirim, kaldir }: { bildirim: Bildirim; kaldir: (anahtar: string) => void }) {
  useEffect(() => {
    const z = setTimeout(() => kaldir(bildirim.anahtar), BANNER_SURESI);
    return () => clearTimeout(z);
  }, [bildirim.anahtar, kaldir]);

  return (
    <div className="animate-[bannerIn_360ms_ease-out]">
      <BildirimKarti bildirim={bildirim} />
    </div>
  );
}
