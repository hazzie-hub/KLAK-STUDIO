import Link from "next/link";

import { kodCoz } from "@/studio/teslim";
import { tumDizileriGetir, tumSahneleriGetir } from "@/icerik/kaynak";

/**
 * Stüdyo — sahne listesi. CLAUDE.md §8
 *
 * Bizim sayfamız; kameraya girmez, teknik bilgi göstermesi sorun değil.
 * Faz 4.1'de yalnızca OKUR: veri hâlâ `content/` altındaki dosyalardan gelir.
 * Düzenleme ekranları Supabase'e geçişten sonra (4.2–4.3).
 */
/** Stüdyo her zaman taze veri gösterir — kaydedilen sahne anında görünmeli. */
export const dynamic = "force-dynamic";

export default async function StudioSayfasi() {
  const sahneler = await tumSahneleriGetir();
  const diziler = await tumDizileriGetir();
  const diziAdi = (kod: string) => diziler.find((d) => d.kod === kod)?.ad ?? kod;

  // Diziye ve bölüme göre grupla — Stüdyo'nun ana ağacı bu (dizi → bölüm → sahne).
  const gruplar = new Map<string, typeof sahneler>();
  for (const kayit of sahneler) {
    const parca = kodCoz(kayit.sahne.kod);
    const anahtar =
      parca === null ? "tanımsız" : `${parca.dizi}|${String(parca.bolum).padStart(3, "0")}`;
    const mevcut = gruplar.get(anahtar) ?? [];
    mevcut.push(kayit);
    gruplar.set(anahtar, mevcut);
  }

  return (
    <main className="acik-sayfa mx-auto min-h-dvh max-w-[760px] px-5 py-8 text-[#1d1d1f]">
      <div className="flex items-baseline gap-3">
        <h1 className="text-[22px] font-semibold tracking-tight">Stüdyo</h1>
        <Link href="/" className="ml-auto text-[13px] text-[#0071e3]">
          Sahne listesi →
        </Link>
        <Link
          href="/studio/yeni"
          className="rounded-full bg-[#0071e3] px-4 py-[6px] text-[13px] font-medium text-white active:opacity-80"
        >
          + Yeni sahne
        </Link>
      </div>
      <p className="mt-1 text-[14px] text-[#6e6e73]">
        {sahneler.length} sahne · {gruplar.size} bölüm
      </p>

      {[...gruplar.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([anahtar, kayitlar]) => {
          const [dizi, bolum] = anahtar.split("|");
          return (
            <section key={anahtar} className="mt-7">
              <h2 className="text-[15px] font-semibold">
                {diziAdi(dizi ?? "")}
                <span className="ml-2 font-normal text-[#6e6e73]">
                  Bölüm {Number(bolum ?? 0)}
                </span>
              </h2>

              <ul className="mt-3 flex flex-col gap-2">
                {kayitlar.map(({ sahne, cihaz, kilitli, versiyon }) => {
                  const parca = kodCoz(sahne.kod);
                  return (
                    <li key={sahne.kod} className="rounded-2xl border border-[#d2d2d7]">
                      <Link
                        href={`/studio/${sahne.kod}`}
                        className="block px-4 py-[13px] active:bg-[#f5f5f7]"
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="text-[15px] font-semibold">
                            Sahne {parca?.sahne ?? sahne.kod}
                          </span>
                          <span className="font-mono text-[11px] text-[#86868b]">{sahne.kod}</span>
                          <span className="ml-auto shrink-0 text-[12px] text-[#6e6e73]">
                            {sahne.baslangic.modul}
                          </span>
                          {kilitli === true && (
                            <span className="shrink-0 rounded-full bg-[#e6f4ea] px-[8px] py-[2px] text-[11px] font-medium text-[#1d6b3f]">
                              onaylı v{versiyon}
                            </span>
                          )}
                        </div>
                        <p className="mt-[5px] line-clamp-2 text-[13px] leading-snug text-[#3a3a3c]">
                          {sahne.talimat}
                        </p>
                        <p className="mt-[6px] text-[12px] text-[#86868b]">
                          {cihaz?.kod ?? sahne.cihaz} · {sahne.olaylar.length} olay
                        </p>
                      </Link>
                      <div className="flex border-t border-[#e8e8ed] text-[13px]">
                        <Link
                          href={`/studio/${sahne.kod}`}
                          className="flex-1 py-[10px] text-center font-medium text-[#0071e3] active:bg-[#f5f5f7]"
                        >
                          Teslim paketi
                        </Link>
                        <Link
                          href={`/p/${sahne.kod}?onizleme=1`}
                          className="flex-1 border-l border-[#e8e8ed] py-[10px] text-center font-medium text-[#0071e3] active:bg-[#f5f5f7]"
                        >
                          Önizleme
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
    </main>
  );
}
