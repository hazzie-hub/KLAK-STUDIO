import { cihazGetir, diziGetir, karakterGetir, sahneGetir } from "@/icerik/kaynak";
import { sahneDurumu } from "@/icerik/yazma";
import { KilitKutusu } from "@/studio/kilit-kutusu";
import { DugmeBaglanti, Panel, PanelUst, Yigin } from "@/studio/panel";
import { KABUK_ADI, kodCoz, sahneBasligi } from "@/studio/teslim";
import { TeslimPaketi } from "@/studio/teslim-paketi";

/** Teslim paketi her zaman taze okunur; sahne düzenlenince anında güncellenir. */
export const dynamic = "force-dynamic";

/** Stüdyo — tek sahnenin teslim paketi. CLAUDE.md §8 */
export default async function TeslimSayfasi({ params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params;
  const sahne = await sahneGetir(kod);

  if (sahne === null) {
    return (
      <Panel>
        <PanelUst geri="/studio" geriEtiketi="Stüdyo" baslik="Sahne bulunamadı" aciklama={kod} />
      </Panel>
    );
  }

  const cihaz = await cihazGetir(sahne.cihaz);
  const parca = kodCoz(sahne.kod);
  const dizi = parca === null ? null : await diziGetir(parca.dizi);
  const karakter = cihaz?.karakter === undefined ? null : await karakterGetir(cihaz.karakter);

  // Kilit/versiyon yalnızca veritabanı varken anlamlı; yerelde dosya
  // kaynağıyla çalışırken kart hiç gösterilmez.
  let kilitDurumu: { kilitli: boolean; versiyon: number } | null = null;
  try {
    const d = await sahneDurumu(kod);
    if (d.var) kilitDurumu = { kilitli: d.kilitli, versiyon: d.versiyon };
  } catch {
    kilitDurumu = null;
  }

  const cihazSatiri = [karakter?.ad ?? cihaz?.karakter, cihaz === null ? null : KABUK_ADI[cihaz.skin]]
    .filter((x) => x !== null && x !== undefined)
    .join(" · ");

  return (
    <Panel>
      <PanelUst
        geri="/studio"
        geriEtiketi="Stüdyo"
        baslik={sahneBasligi(sahne, dizi)}
        aciklama={cihazSatiri === "" ? sahne.cihaz : cihazSatiri}
        eylemler={
          <>
            <DugmeBaglanti href={`/p/${kod}?onizleme=1`} tur="sessiz" kucuk>
              Önizle
            </DugmeBaglanti>
            <DugmeBaglanti href={`/studio/yeni?kopya=${kod}`} tur="ikincil" kucuk>
              Kopyala
            </DugmeBaglanti>
            <DugmeBaglanti href={`/studio/${kod}/duzenle`} tur="birincil" kucuk>
              Düzenle
            </DugmeBaglanti>
          </>
        }
      />

      <Yigin>
        <TeslimPaketi sahne={sahne} cihaz={cihaz} dizi={dizi} karakter={karakter} />
        {kilitDurumu !== null && (
          <KilitKutusu kod={kod} kilitli={kilitDurumu.kilitli} versiyon={kilitDurumu.versiyon} />
        )}
      </Yigin>
    </Panel>
  );
}
