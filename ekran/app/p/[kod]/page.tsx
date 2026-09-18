import { Kabuk, gorunenDurum, skinSec } from "@/shell";
import { cihazOku, sahneOku, tumSahneKodlari } from "@/icerik/yukle";

/** Sahneler derleme anında üretilir — sette internet gerekmez (CLAUDE.md §2.3). */
export function generateStaticParams() {
  return tumSahneKodlari().map((kod) => ({ kod }));
}

type Aramalar = Record<string, string | string[] | undefined>;

function tekDeger(a: Aramalar, ad: string): string | undefined {
  const d = a[ad];
  return Array.isArray(d) ? d[0] : d;
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
  const durum = gorunenDurum(sahne, cihaz);

  return (
    <Kabuk skin={skin} durum={durum} onizleme={onizleme}>
      <ModulYeri modul={sahne.baslangic.modul} ekran={sahne.baslangic.ekran} />
    </Kabuk>
  );
}

/**
 * Geçici: modüller Adım 5 (kilit) ve Adım 7 (sosyal) ile gelecek.
 * O zaman burası modül seçicisine dönüşecek.
 */
function ModulYeri({ modul, ekran }: { modul: string; ekran: string }) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-1 text-center"
      style={{ background: "var(--zemin-ikincil)", color: "var(--metin-soluk)" }}
    >
      <p className="text-[13px] tracking-wide">
        {modul} · {ekran}
      </p>
      <p className="text-[11px] opacity-60">modül burada açılacak</p>
    </div>
  );
}
