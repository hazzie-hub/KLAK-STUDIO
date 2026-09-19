import Link from "next/link";

import { sahneGetir } from "@/icerik/kaynak";
import { sahneDurumu } from "@/icerik/yazma";
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

  let kilitli = false;
  try {
    kilitli = (await sahneDurumu(kod)).kilitli;
  } catch {
    kilitli = false;
  }

  return (
    <main className="acik-sayfa mx-auto min-h-dvh max-w-[860px] px-5 py-8 text-[#1d1d1f]">
      <Link href={`/studio/${kod}`} className="text-[13px] text-[#0071e3]">
        ← Teslim paketi
      </Link>
      <h1 className="mt-3 text-[22px] font-semibold tracking-tight">
        Sahneyi düzenle <span className="font-mono text-[15px] text-[#86868b]">{kod}</span>
      </h1>
      {kilitli && (
        <div className="mt-5 rounded-2xl border border-[#cfe4d4] bg-[#f2f9f4] p-4">
          <h2 className="text-[13px] font-semibold text-[#1d6b3f]">Bu sahne onaylandı</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-[#1d6b3f]">
            Kilitli sahne kaydedilemez. Değiştirmek için teslim paketi sayfasından
            <strong> yeni versiyon</strong> açın; önceki hali arşivde kalır, link değişmez.
          </p>
        </div>
      )}
      {sahne === null ? (
        <p className="mt-6 text-[15px]">Böyle bir sahne yok.</p>
      ) : (
        <SahneFormu baslangicTaslak={sahne as unknown as Record<string, unknown>} secenekler={secenekler} yeniMi={false} />
      )}
    </main>
  );
}
