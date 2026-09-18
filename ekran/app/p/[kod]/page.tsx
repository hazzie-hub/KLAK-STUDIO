import { DurumSaglayici, durumEzmeleri, tekDeger, type Aramalar } from "@/durum";
import { MotorIzleyici, SahneSaglayici } from "@/engine";
import { YerTutucu } from "@/modules/yer-tutucu";
import { Kabuk, gorunenDurum, skinSec } from "@/shell";
import { cihazOku, sahneOku, tumSahneKodlari } from "@/icerik/yukle";

/** Sahneler derleme anında üretilir — sette internet gerekmez (CLAUDE.md §2.3). */
export function generateStaticParams() {
  return tumSahneKodlari().map((kod) => ({ kod }));
}

export default async function OynaticiSayfasi({
  params,
  searchParams,
}: {
  params: Promise<{ kod: string }>;
  searchParams: Promise<Aramalar>;
}) {
  const { kod } = await params;
  const aramalar = await searchParams;

  const sahne = sahneOku(kod);

  // CLAUDE.md §2.6: kamerada hata mesajı görünmez.
  // Sahne yoksa sessizce kapalı ekran; sebep sadece konsola yazılır.
  if (sahne === null) {
    console.error(`[ekran] Sahne bulunamadı ya da geçersiz: ${kod}`);
    return <div className="fixed inset-0 bg-black" />;
  }

  const cihaz = cihazOku(sahne.cihaz);
  if (cihaz === null) {
    console.error(`[ekran] ${kod}: "${sahne.cihaz}" cihazı bulunamadı, varsayılan kabuk kullanılıyor.`);
  }

  const skin = skinSec(tekDeger(aramalar, "skin"), cihaz?.skin);
  const onizleme = tekDeger(aramalar, "onizleme") === "1";
  const durum = durumEzmeleri(aramalar, gorunenDurum(sahne, cihaz));

  // Sadece açıkça istenirse; asla kendiliğinden (CLAUDE.md §2.6).
  const motorIzleyici = tekDeger(aramalar, "motor") === "1";

  return (
    <DurumSaglayici baslangic={durum}>
      <SahneSaglayici sahne={sahne}>
        <Kabuk skin={skin} onizleme={onizleme}>
          <YerTutucu modul={sahne.baslangic.modul} ekran={sahne.baslangic.ekran} />
        </Kabuk>
        {motorIzleyici && <MotorIzleyici />}
      </SahneSaglayici>
    </DurumSaglayici>
  );
}
