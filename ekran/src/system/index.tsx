"use client";

import type { Modul } from "@/schema";
import { AramaEkrani } from "./arama-ekrani";
import { BannerKatmani } from "./banner-katmani";
import { KapanmaEkrani } from "./kapanma";
import { PilUyarisi } from "./pil-uyarisi";

export { BildirimKarti } from "./bildirim-karti";
export { useBildirimler, uygulamaAdi, uygulamaRengi, type Bildirim } from "./bildirimler";
export { GizliKatman } from "./gizli-panel";

/**
 * Sistem katmanı. CLAUDE.md §3.1 (4. katman)
 * Hangi modül açık olursa olsun modülün ÜSTÜNDE görünür.
 */
export function SistemKatmani({ aktifModul }: { aktifModul: Modul }) {
  // Kilit ekranı açıkken banner düşmez; bildirimler kilit ekranında birikir.
  const bannerGoster = aktifModul !== "kilit";

  return (
    <>
      {bannerGoster && <BannerKatmani />}
      <PilUyarisi />
      <AramaEkrani />
      <KapanmaEkrani />
    </>
  );
}
