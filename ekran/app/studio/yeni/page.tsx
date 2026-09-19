import Link from "next/link";

import { sahneGetir } from "@/icerik/kaynak";
import { Kart, Panel, PanelUst, Yigin } from "@/studio/panel";
import { SABLONLAR, sablonAl } from "@/studio/sablonlar";
import { SahneFormu } from "@/studio/sahne-formu";
import { secenekleriTopla } from "@/studio/secenekler";

export const dynamic = "force-dynamic";

/**
 * Yeni sahne. CLAUDE.md §8
 *
 * Üç yoldan başlanabilir: şablondan (`?sablon=`), var olan bir sahnenin
 * kopyasından (`?kopya=`) ya da boş sayfadan.
 */
export default async function YeniSahneSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ sablon?: string; kopya?: string }>;
}) {
  const { sablon: sablonId, kopya } = await searchParams;
  const secenekler = await secenekleriTopla();
  const sablon = sablonId === undefined ? null : sablonAl(sablonId);

  let taslak: Record<string, unknown> | null = null;
  let baslik = "Yeni sahne";
  let aciklama: string | undefined;

  if (kopya !== undefined) {
    const kaynak = await sahneGetir(kopya);
    if (kaynak !== null) {
      // Kod BOŞ bırakılır: kopya yeni bir sahne kodu almalı, yoksa kaydedince
      // kaynağın üstüne yazar.
      taslak = { ...(structuredClone(kaynak) as unknown as Record<string, unknown>), kod: "" };
      baslik = "Sahneyi kopyala";
      aciklama = `${kopya} sahnesinin kopyası. Yeni bir sahne kodu verin.`;
    }
  } else if (sablon !== null) {
    taslak = sablon.uret("", "");
    baslik = sablon.ad;
    aciklama = sablon.aciklama;
  }

  if (kopya === undefined && sablonId === undefined) {
    return (
      <Panel>
        <PanelUst
          geri="/studio"
          geriEtiketi="Stüdyo"
          baslik="Yeni sahne"
          aciklama="Hazır bir iskeletten başlayın; olayları ve süreleri sonra değiştirebilirsiniz."
        />
        <ul className="grid gap-3 sm:grid-cols-2">
          {SABLONLAR.map((s) => (
            <li key={s.id}>
              <Link
                href={`/studio/yeni?sablon=${s.id}`}
                className="block h-full rounded-[18px] border border-[#e4e4e7] bg-white p-[18px] transition-colors hover:border-[#c9c9ce] hover:bg-[#fcfcfd]"
              >
                <span className="block text-[15px] font-semibold text-[#1d1d1f]">{s.ad}</span>
                <span className="mt-[5px] block text-[13px] leading-snug text-[#6e6e73]">
                  {s.aciklama}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/studio/yeni?sablon=bos"
          className="mt-5 inline-block text-[13px] font-medium text-[#0071e3]"
        >
          Şablonsuz, boş sahneyle başla →
        </Link>
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelUst geri="/studio/yeni" geriEtiketi="Şablonlar" baslik={baslik} aciklama={aciklama} />
      <Yigin>
        {sablon !== null && sablon.doldurulacak.length > 0 && (
          <Kart vurgu="mavi" baslik="Doldurmanız gerekenler">
            <ul className="flex list-disc flex-col gap-[5px] pl-5">
              {sablon.doldurulacak.map((d) => (
                <li key={d} className="text-[13px] text-[#0058b0]">
                  {d}
                </li>
              ))}
            </ul>
          </Kart>
        )}
        <SahneFormu baslangicTaslak={taslak} secenekler={secenekler} yeniMi />
      </Yigin>
    </Panel>
  );
}
