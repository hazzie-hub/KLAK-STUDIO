import Link from "next/link";

import { tumDizileriGetir, tumSahneleriGetir } from "@/icerik/kaynak";
import { cikisYap } from "@/studio/giris-eylemi";
import { Dugme, DugmeBaglanti, Kart, Panel, PanelUst, Rozet, Yigin } from "@/studio/panel";
import { kodCoz } from "@/studio/teslim";

/** Her zaman taze veri: yeni eklenen dizi ve sahne anında görünmeli. */
export const dynamic = "force-dynamic";

/**
 * Diziler. CLAUDE.md §8
 *
 * Girişten sonraki ilk sayfa. Sistem diziye özel değil: her dizinin kendi
 * paneli var, buradan o panele girilir.
 */
export default async function DizilerSayfasi() {
  const [diziler, sahneler] = await Promise.all([tumDizileriGetir(), tumSahneleriGetir()]);

  /** Hangi dizide kaç sahne var — sahne kodunun ilk parçasından. */
  const sahneSayisi = new Map<string, number>();
  for (const { sahne } of sahneler) {
    const dizi = kodCoz(sahne.kod)?.dizi;
    if (dizi === undefined) continue;
    sahneSayisi.set(dizi, (sahneSayisi.get(dizi) ?? 0) + 1);
  }

  return (
    <Panel>
      <PanelUst
        baslik="Diziler"
        aciklama="Çalışmak istediğiniz diziyi seçin."
        eylemler={
          <form action={cikisYap}>
            <Dugme type="submit" kucuk>
              Çıkış
            </Dugme>
          </form>
        }
      />

      <Yigin>
        {diziler.length === 0 && (
          <Kart baslik="Henüz dizi yok">
            <p className="text-[13px] leading-snug text-[#48484a]">
              Depodaki içerik aktarılmamış olabilir. Bir dizi paneline girip
              &quot;Depodaki içeriği aktar&quot; düğmesine basın.
            </p>
          </Kart>
        )}

        {diziler.map((dizi) => {
          const sayi = sahneSayisi.get(dizi.kod) ?? 0;
          return (
            <Kart key={dizi.kod}>
              <Link href={`/studio/dizi/${dizi.kod}`} className="-m-5 block p-5">
                <div className="flex flex-wrap items-center gap-x-[10px] gap-y-2">
                  <span className="text-[17px] font-semibold text-[#1d1d1f]">{dizi.ad}</span>
                  {dizi.kanal !== undefined && <Rozet>{dizi.kanal}</Rozet>}
                </div>
                <p className="mt-[6px] text-[13px] text-[#6e6e73]">
                  {sayi === 0 ? "Henüz sahne yok" : `${sayi} sahne`}
                </p>
              </Link>
            </Kart>
          );
        })}

        <Kart
          baslik="Sahne listesi"
          aciklama="Sette operatörün açtığı sayfa: her sahnenin oynatıcı ve kumanda linki."
          sag={<DugmeBaglanti href="/sahneler" kucuk>Aç</DugmeBaglanti>}
        />
      </Yigin>
    </Panel>
  );
}
