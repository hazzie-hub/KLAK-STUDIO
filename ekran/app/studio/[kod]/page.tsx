import Link from "next/link";

import { cihazGetir, diziGetir, karakterGetir, sahneGetir, tumSahneKodlariniGetir } from "@/icerik/kaynak";
import { TeslimPaketi } from "@/studio/teslim-paketi";
import { kodCoz } from "@/studio/teslim";

export async function generateStaticParams() {
  return (await tumSahneKodlariniGetir()).map((kod) => ({ kod }));
}

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
      <Link href="/studio" className="text-[13px] text-[#0071e3]">
        ← Stüdyo
      </Link>
      <TeslimPaketi sahne={sahne} cihaz={cihaz} dizi={dizi} karakter={karakter} />
    </main>
  );
}
