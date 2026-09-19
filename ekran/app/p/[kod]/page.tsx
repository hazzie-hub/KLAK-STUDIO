import { Suspense } from "react";

import {
  cihazOku,
  sahneOku,
  sahneVarliklari,
  tumHesaplar,
  tumIcerikler,
  tumSahneKodlari,
} from "@/icerik/yukle";
import { Oynatici } from "@/oynatici";

/** Sahneler derleme anında üretilir — sette internet gerekmez (CLAUDE.md §2.3). */
export function generateStaticParams() {
  return tumSahneKodlari().map((kod) => ({ kod }));
}

/**
 * Sayfa TAMAMEN STATİK: adres çubuğu parametreleri burada okunmaz, `Oynatici`
 * içinde istemci tarafında okunur. Böylece service worker önbelleğindeki tek
 * kopya `?skin=android` gibi parametrelerle de eşleşir ve offline açılır.
 */
export default async function OynaticiSayfasi({ params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params;
  const sahne = sahneOku(kod);

  // CLAUDE.md §2.6: kamerada hata mesajı görünmez.
  // Sahne yoksa sessizce kapalı ekran; sebep sadece konsola yazılır.
  if (sahne === null) {
    console.error(`[ekran] Sahne bulunamadı ya da geçersiz: ${kod}`);
    return <div className="fixed inset-0 bg-black" />;
  }

  const cihaz = cihazOku(sahne.cihaz);
  if (cihaz === null) {
    console.error(
      `[ekran] ${kod}: "${sahne.cihaz}" cihazı bulunamadı, varsayılan kabuk kullanılıyor.`,
    );
  }

  return (
    <Suspense fallback={<div className="fixed inset-0" style={{ background: "#000" }} />}>
      <Oynatici
        sahne={sahne}
        cihaz={cihaz}
        hesaplar={tumHesaplar()}
        icerikler={tumIcerikler()}
        varliklar={sahneVarliklari(cihaz)}
      />
    </Suspense>
  );
}
