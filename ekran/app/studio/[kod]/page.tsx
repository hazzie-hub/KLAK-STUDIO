import Link from "next/link";

import { cihazGetir, diziGetir, karakterGetir, sahneGetir } from "@/icerik/kaynak";
import { TeslimPaketi } from "@/studio/teslim-paketi";
import { YayinlaDugmesi } from "@/studio/yayinla-dugmesi";
import { kodCoz } from "@/studio/teslim";

/** Teslim paketi her zaman taze okunur; sahne düzenlenince anında güncellenir. */
export const dynamic = "force-dynamic";

/** Stüdyo — tek sahnenin teslim paketi. CLAUDE.md §8 */
export default async function TeslimSayfasi({ params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params;
  const sahne = await sahneGetir(kod);

  if (sahne === null) {
    return (
      <main className="acik-sayfa mx-auto min-h-dvh max-w-[760px] px-5 py-8 text-[#1d1d1f]">
        <Link href="/studio" className="text-[13px] text-[#0071e3]">
          ← Stüdyo
        </Link>
        <p className="mt-6 text-[15px]">
          <strong className="font-mono">{kod}</strong> diye bir sahne yok.
        </p>
      </main>
    );
  }

  const cihaz = await cihazGetir(sahne.cihaz);
  const parca = kodCoz(sahne.kod);
  const dizi = parca === null ? null : await diziGetir(parca.dizi);
  const karakter = cihaz?.karakter === undefined ? null : await karakterGetir(cihaz.karakter);

  return (
    <main className="acik-sayfa mx-auto min-h-dvh max-w-[760px] px-5 py-8 text-[#1d1d1f]">
      <div className="flex items-center gap-3">
        <Link href="/studio" className="text-[13px] text-[#0071e3]">
          ← Stüdyo
        </Link>
        <Link
          href={`/studio/yeni?kopya=${kod}`}
          className="ml-auto rounded-full border border-[#d2d2d7] px-4 py-[6px] text-[13px] font-medium text-[#1d1d1f] active:bg-[#f5f5f7]"
        >
          Kopyala
        </Link>
        <Link
          href={`/studio/${kod}/duzenle`}
          className="rounded-full border border-[#d2d2d7] px-4 py-[6px] text-[13px] font-medium text-[#1d1d1f] active:bg-[#f5f5f7]"
        >
          Düzenle
        </Link>
      </div>
      <TeslimPaketi sahne={sahne} cihaz={cihaz} dizi={dizi} karakter={karakter} />
      <div className="mt-5">
        <YayinlaDugmesi kod={kod} />
      </div>
    </main>
  );
}
