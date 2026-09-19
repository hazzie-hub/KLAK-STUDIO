import { sahneGetir, tumSahneKodlariniGetir } from "@/icerik/kaynak";
import { Kumanda } from "@/kumanda/kumanda";

/** Kumanda sayfası — set operatörünün telefonunda açılır. CLAUDE.md §3 */
export async function generateStaticParams() {
  return (await tumSahneKodlariniGetir()).map((kod) => ({ kod }));
}

export default async function KumandaSayfasi({ params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params;
  const sahne = await sahneGetir(kod);

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
