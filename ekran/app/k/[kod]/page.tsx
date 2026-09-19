import { sahneOku, tumSahneKodlari } from "@/icerik/yukle";
import { Kumanda } from "@/kumanda/kumanda";

/** Kumanda sayfası — set operatörünün telefonunda açılır. CLAUDE.md §3 */
export function generateStaticParams() {
  return tumSahneKodlari().map((kod) => ({ kod }));
}

export default async function KumandaSayfasi({ params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params;
  const sahne = sahneOku(kod);

  if (sahne === null) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#0e0e10] px-6 text-center text-white/70">
        <p className="text-[15px]">
          <strong className="block text-white">Sahne bulunamadı</strong>
          <span className="mt-1 block font-mono text-[13px] text-white/45">{kod}</span>
        </p>
      </main>
    );
  }

  return <Kumanda sahne={sahne} />;
}
