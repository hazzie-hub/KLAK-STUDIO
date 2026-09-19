import Link from "next/link";

import { sahneGetir } from "@/icerik/kaynak";
import { SahneFormu } from "@/studio/sahne-formu";
import { secenekleriTopla } from "@/studio/secenekler";

export const dynamic = "force-dynamic";

export default async function SahneDuzenleSayfasi({
  params,
}: {
  params: Promise<{ kod: string }>;
}) {
  const { kod } = await params;
  const [sahne, secenekler] = await Promise.all([sahneGetir(kod), secenekleriTopla()]);

  return (
    <main className="acik-sayfa mx-auto min-h-dvh max-w-[860px] px-5 py-8 text-[#1d1d1f]">
      <Link href={`/studio/${kod}`} className="text-[13px] text-[#0071e3]">
        ← Teslim paketi
      </Link>
      <h1 className="mt-3 text-[22px] font-semibold tracking-tight">
        Sahneyi düzenle <span className="font-mono text-[15px] text-[#86868b]">{kod}</span>
      </h1>
      {sahne === null ? (
        <p className="mt-6 text-[15px]">Böyle bir sahne yok.</p>
      ) : (
        <SahneFormu baslangicSahne={sahne} secenekler={secenekler} yeniMi={false} />
      )}
    </main>
  );
}
