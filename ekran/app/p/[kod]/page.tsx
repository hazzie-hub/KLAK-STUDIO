import { Suspense } from "react";

import {
  cihazGetir,
  sahneGetir,
  tumHesaplariGetir,
  tumIcerikleriGetir,
  tumSahneKodlariniGetir,
} from "@/icerik/kaynak";
import { sahneVarliklari } from "@/icerik/yukle";
import { Oynatici } from "@/oynatici";

/** Sahneler derleme anında üretilir — sette internet gerekmez (CLAUDE.md §2.3). */
export async function generateStaticParams() {
  return (await tumSahneKodlariniGetir()).map((kod) => ({ kod }));
}

/**
 * Sayfa TAMAMEN STATİK: adres çubuğu parametreleri burada okunmaz, `Oynatici`
 * içinde istemci tarafında okunur. Böylece service worker önbelleğindeki tek
 * kopya `?skin=android` gibi parametrelerle de eşleşir ve offline açılır.
 */
export default async function OynaticiSayfasi({ params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params;
  const sahne = await sahneGetir(kod);

  // CLAUDE.md §2.6: kamerada hata mesajı görünmez.
  // Sahne yoksa sessizce kapalı ekran; sebep sadece konsola yazılır.
  if (sahne === null) {
    console.error(`[ekran] Sahne bulunamadı ya da geçersiz: ${kod}`);
    return <div className="fixed inset-0 bg-black" />;
  }

  const cihaz = await cihazGetir(sahne.cihaz);
  if (cihaz === null) {
    console.error(
      `[ekran] ${kod}: "${sahne.cihaz}" cihazı bulunamadı, varsayılan kabuk kullanılıyor.`,
    );
  }

  const hesaplar = await tumHesaplariGetir();
  const icerikler = await tumIcerikleriGetir();

  return (
    <Suspense fallback={<div className="fixed inset-0" style={{ background: "#000" }} />}>
      <Oynatici
        sahne={sahne}
        cihaz={cihaz}
        hesaplar={hesaplar}
        icerikler={icerikler}
        varliklar={sahneVarliklari(cihaz, icerikler, hesaplar)}
      />
    </Suspense>
  );
}
