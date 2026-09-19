import type { Cihaz } from "@/schema";
import { useAktifEkran } from "./aktif-ekran";
import { AramaModulu } from "./arama";
import { KilitModulu } from "./kilit";
import { MesajModulu } from "./mesaj";
import { SosyalModulu } from "./sosyal";
import { WebModulu } from "./web";
import { YerTutucu } from "./yer-tutucu";

/**
 * O an açık olan modülü seçer. CLAUDE.md §3.1 (3. katman)
 *
 * Hangi modülün açık olduğu sahnenin `baslangic`ından ve gerçekleşen `ekranAc`
 * olaylarından türer (bkz. `aktif-ekran.ts`), böylece modüller ARASI derin link
 * çalışır: arama sonucundan siteye geçilebilir. Henüz yazılmamış modüller yer
 * tutucuya düşer.
 */
export function ModulSec({ cihaz }: { cihaz: Cihaz | null }) {
  const { modul, ekran, icerikRef, hesap } = useAktifEkran();

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
    default:
      return <YerTutucu modul={modul} ekran={ekran} />;
  }
}

export { KilitModulu } from "./kilit";
export { SosyalModulu } from "./sosyal";
export { MesajModulu } from "./mesaj";
export { AramaModulu } from "./arama";
export { WebModulu } from "./web";
export { modulGorunumu, type ModulGorunumu } from "./gorunum";
export { useAktifEkran, aktifEkranTuret, type AktifEkran } from "./aktif-ekran";
