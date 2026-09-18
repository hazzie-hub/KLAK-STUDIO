import type { Cihaz, Sahne } from "@/schema";
import { KilitModulu } from "./kilit";
import { SosyalModulu } from "./sosyal";
import { YerTutucu } from "./yer-tutucu";

/**
 * Sahnenin açılış modülünü seçer. CLAUDE.md §3.1 (3. katman)
 * Henüz yazılmamış modüller yer tutucuya düşer.
 */
export function ModulSec({ sahne, cihaz }: { sahne: Sahne; cihaz: Cihaz | null }) {
  const { modul, ekran } = sahne.baslangic;

  switch (modul) {
    case "kilit":
      return <KilitModulu duvarKagidi={cihaz?.kilitEkrani ?? cihaz?.duvarKagidi} />;
    case "sosyal":
      return <SosyalModulu baslangicEkrani={ekran} hesapId={sahne.baslangic.hesap} />;
    default:
      return <YerTutucu modul={modul} ekran={ekran} />;
  }
}

export { KilitModulu } from "./kilit";
export { SosyalModulu } from "./sosyal";
export { modulGorunumu, type ModulGorunumu } from "./gorunum";
