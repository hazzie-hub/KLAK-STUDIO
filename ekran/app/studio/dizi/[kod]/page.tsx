import Link from "next/link";
import { notFound } from "next/navigation";

import { diziGetir, tumSahneleriGetir } from "@/icerik/kaynak";
import { AktarmaDugmesi } from "@/studio/aktarma-dugmesi";
import { DugmeBaglanti, Kart, Panel, PanelUst, Rozet, Yigin } from "@/studio/panel";
import { kodCoz } from "@/studio/teslim";

/** Stüdyo her zaman taze veri gösterir — kaydedilen sahne anında görünmeli. */
export const dynamic = "force-dynamic";

/**
 * Dizi paneli — o dizinin sahne ağacı. CLAUDE.md §8
 *
 * Bizim sayfamız; kameraya girmez. Yine de sade tutuldu: sette acele
 * ederken okunacak. Sistem diziye özel değil: her dizi kendi panelinde
 * durur, sahneler bölüm bölüm gruplanır.
 */
export default async function DiziPaneli({ params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params;
  const dizi = await diziGetir(kod);
  if (dizi === null) notFound();

  const tumSahneler = await tumSahneleriGetir();
  const sahneler = tumSahneler.filter((s) => kodCoz(s.sahne.kod)?.dizi === kod);

  const gruplar = new Map<string, typeof sahneler>();
  for (const kayit of sahneler) {
    const parca = kodCoz(kayit.sahne.kod);
    const anahtar = parca === null ? "000" : String(parca.bolum).padStart(3, "0");
    gruplar.set(anahtar, [...(gruplar.get(anahtar) ?? []), kayit]);
  }

  const onayli = sahneler.filter((s) => s.kilitli === true).length;

  return (
    <Panel>
      <PanelUst
        geri="/"
        geriEtiketi="Diziler"
        baslik={dizi.ad}
        aciklama={
          onayli > 0
            ? `${sahneler.length} sahne · ${onayli} tanesi onaylı`
            : `${sahneler.length} sahne`
        }
        eylemler={
          <DugmeBaglanti href={`/studio/yeni?dizi=${dizi.kod}`} tur="birincil">
            Yeni sahne
          </DugmeBaglanti>
        }
      />

      <Yigin>
        {sahneler.length === 0 && (
          <Kart baslik="Bu dizide henüz sahne yok">
            <p className="text-[13px] leading-snug text-[#48484a]">
              &quot;Yeni sahne&quot; ile başlayın. Depoda hazır sahneler varsa
              aşağıdaki aktarma düğmesi onları getirir.
            </p>
          </Kart>
        )}

        {[...gruplar.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([bolum, kayitlar]) => {
            return (
              <Kart
                key={bolum}
                baslik={`Bölüm ${Number(bolum)}`}
                aciklama={`${kayitlar.length} sahne`}
              >
                <ul className="-mx-5 -mb-5">
                  {kayitlar.map(({ sahne, cihaz, kilitli, versiyon }, i) => {
                    const parca = kodCoz(sahne.kod);
                    return (
                      <li
                        key={sahne.kod}
                        className={i === 0 ? "" : "border-t border-[#f0f0f2]"}
                      >
                        <div className="flex items-start gap-3 px-5 py-[13px]">
                          <Link href={`/studio/${sahne.kod}`} className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="text-[15px] font-semibold text-[#1d1d1f]">
                                Sahne {parca?.sahne ?? sahne.kod}
                              </span>
                              <Rozet>{sahne.baslangic.modul}</Rozet>
                              {kilitli === true && <Rozet renk="yesil">onaylı v{versiyon}</Rozet>}
                            </div>
                            <p className="mt-[5px] line-clamp-2 text-[13px] leading-snug text-[#48484a]">
                              {sahne.talimat}
                            </p>
                            <p className="mt-[5px] text-[11px] text-[#8e8e93]">
                              {cihaz?.kod ?? sahne.cihaz} · {sahne.olaylar.length} olay ·{" "}
                              <span className="font-mono">{sahne.kod}</span>
                            </p>
                          </Link>

                          <Link
                            href={`/p/${sahne.kod}?onizleme=1`}
                            className="shrink-0 rounded-full px-[11px] py-[5px] text-[12px] font-medium text-[#0071e3] transition-colors hover:bg-[#ecf3fd]"
                          >
                            Önizle
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Kart>
            );
          })}

        <AktarmaDugmesi />
      </Yigin>
    </Panel>
  );
}
