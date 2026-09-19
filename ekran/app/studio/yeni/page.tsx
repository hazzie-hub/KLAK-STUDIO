import Link from "next/link";

import { SahneFormu } from "@/studio/sahne-formu";
import { secenekleriTopla } from "@/studio/secenekler";

/** Stüdyo her zaman taze veri gösterir; önbelleğe alınmaz. */
export const dynamic = "force-dynamic";

export default async function YeniSahneSayfasi() {
  const secenekler = await secenekleriTopla();

  return (
    <main className="acik-sayfa mx-auto min-h-dvh max-w-[860px] px-5 py-8 text-[#1d1d1f]">
      <Link href="/studio" className="text-[13px] text-[#0071e3]">
        ← Stüdyo
      </Link>
      <h1 className="mt-3 text-[22px] font-semibold tracking-tight">Yeni sahne</h1>
      <SahneFormu baslangicSahne={null} secenekler={secenekler} yeniMi />
    </main>
  );
}
