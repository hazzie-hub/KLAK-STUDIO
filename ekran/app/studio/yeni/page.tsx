import Link from "next/link";

import { sahneGetir } from "@/icerik/kaynak";
import { SABLONLAR, sablonAl } from "@/studio/sablonlar";
import { SahneFormu } from "@/studio/sahne-formu";
import { secenekleriTopla } from "@/studio/secenekler";

export const dynamic = "force-dynamic";

/**
 * Yeni sahne. CLAUDE.md §8
 *
 * Üç yoldan başlanabilir:
 *  - Boş sahne
 *  - Şablondan (`?sablon=`)
 *  - Var olan bir sahnenin kopyasından (`?kopya=`) — başka bölüme taşımak için
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
  let altBaslik: string | null = null;

  if (kopya !== undefined) {
    const kaynak = await sahneGetir(kopya);
    if (kaynak !== null) {
      // Kod BOŞ bırakılır: kopya yeni bir sahne kodu almalı, yoksa
      // kaydedince kaynağın üstüne yazar.
      taslak = { ...(structuredClone(kaynak) as unknown as Record<string, unknown>), kod: "" };
      baslik = "Sahneyi kopyala";
      altBaslik = `${kopya} sahnesinin kopyası — yeni sahne kodu verin`;
    }
  } else if (sablon !== null) {
    taslak = sablon.uret("", "");
    baslik = sablon.ad;
    altBaslik = sablon.aciklama;
  }

  // Ne şablon ne kopya seçilmişse önce seçim ekranı gösterilir.
  const secimEkrani = kopya === undefined && sablonId === undefined;

  return (
    <main className="acik-sayfa mx-auto min-h-dvh max-w-[860px] px-5 py-8 text-[#1d1d1f]">
      <Link href="/studio" className="text-[13px] text-[#0071e3]">
        ← Stüdyo
      </Link>
      <h1 className="mt-3 text-[22px] font-semibold tracking-tight">{baslik}</h1>
      {altBaslik !== null && <p className="mt-1 text-[14px] text-[#6e6e73]">{altBaslik}</p>}

      {secimEkrani ? (
        <SablonSecimi />
      ) : (
        <>
          {sablon !== null && sablon.doldurulacak.length > 0 && (
            <div className="mt-5 rounded-2xl border border-[#d8e4f5] bg-[#f2f7fd] p-4">
              <h2 className="text-[13px] font-semibold text-[#1d4e8f]">Doldurmanız gerekenler</h2>
              <ul className="mt-2 flex flex-col gap-1">
                {sablon.doldurulacak.map((d) => (
                  <li key={d} className="text-[13px] text-[#1d4e8f]">
                    • {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <SahneFormu baslangicTaslak={taslak} secenekler={secenekler} yeniMi />
        </>
      )}
    </main>
  );
}

function SablonSecimi() {
  return (
    <div className="mt-6">
      <p className="text-[14px] text-[#6e6e73]">
        Hazır bir iskeletten başlayın; olayları ve gecikmeleri sonra
        değiştirebilirsiniz.
      </p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {SABLONLAR.map((s) => (
          <li key={s.id}>
            <Link
              href={`/studio/yeni?sablon=${s.id}`}
              className="block h-full rounded-2xl border border-[#d2d2d7] p-4 active:bg-[#f5f5f7]"
            >
              <span className="block text-[15px] font-semibold">{s.ad}</span>
              <span className="mt-1 block text-[13px] leading-snug text-[#6e6e73]">
                {s.aciklama}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/studio/yeni?sablon=bos"
        className="mt-4 inline-block text-[13px] text-[#0071e3]"
      >
        Şablonsuz, boş sahne ile başla →
      </Link>
    </div>
  );
}
