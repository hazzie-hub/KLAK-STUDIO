import Link from "next/link";

import { tumSahneleriGetir } from "@/icerik/kaynak";

/**
 * Sahne listesi. Sette operatör bu adresi açıp sahneyi seçer.
 *
 * Bu sayfa kameraya GİRMEZ — oyuncuya doğrudan sahne linki verilir.
 * Burası bizim ve operatörün sayfası, o yüzden teknik bilgi göstermesi sorun değil.
 * Giriş ister (CLAUDE.md §8): talimat metinleri senaryodan geliyor.
 */
export default async function SahneListesi() {
  const sahneler = await tumSahneleriGetir();

  const kabukAdi: Record<string, string> = {
    ios: "iPhone",
    android: "Android",
    desktop: "Bilgisayar",
  };

  return (
    <main className="acik-sayfa mx-auto min-h-dvh max-w-[680px] px-5 py-8 text-[#1d1d1f]">
      <Link href="/" className="text-[13px] font-medium text-[#0071e3]">
        <span aria-hidden="true">‹</span> Diziler
      </Link>
      <h1 className="mt-3 text-[22px] font-semibold tracking-tight">Sahne listesi</h1>
      <p className="mt-1 text-[14px] text-[#6e6e73]">
        Set ekran sistemi · {sahneler.length} sahne
      </p>

      <ul className="mt-6 flex flex-col gap-2">
        {sahneler.map(({ sahne, cihaz }) => (
          <li key={sahne.kod} className="rounded-2xl border border-[#d2d2d7]">
            <Link href={`/p/${sahne.kod}`} className="block px-4 py-[14px] active:bg-[#f5f5f7]">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[15px] font-semibold">{sahne.kod}</span>
                <span className="ml-auto shrink-0 text-[12px] text-[#6e6e73]">
                  {kabukAdi[cihaz?.skin ?? ""] ?? cihaz?.skin ?? "—"}
                </span>
              </div>
              <p className="mt-[5px] text-[13px] leading-snug text-[#3a3a3c]">{sahne.talimat}</p>
              <p className="mt-[6px] text-[12px] text-[#86868b]">
                {sahne.cihaz} · {sahne.olaylar.length} olay
              </p>
            </Link>
            <div className="flex border-t border-[#e8e8ed] text-[13px]">
              <Link
                href={`/p/${sahne.kod}`}
                className="flex-1 py-[11px] text-center font-medium text-[#0071e3] active:bg-[#f5f5f7]"
              >
                Oynatıcı
              </Link>
              <Link
                href={`/k/${sahne.kod}`}
                className="flex-1 border-l border-[#e8e8ed] py-[11px] text-center font-medium text-[#0071e3] active:bg-[#f5f5f7]"
              >
                Kumanda
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-7 rounded-2xl bg-[#f5f5f7] px-4 py-[14px] text-[13px] leading-relaxed text-[#3a3a3c]">
        <strong className="block text-[#1d1d1f]">Oynatıcı ve kumanda</strong>
        <strong>Oynatıcı</strong> oyuncunun eline verilen cihazda açılır.{" "}
        <strong>Kumanda</strong> operatörün kendi telefonunda: olayları tetikler,
        gecikme ayarlar, başa sarar — oyuncunun cihazına hiç dokunmadan.
        <br />
        <br />
        <strong className="block text-[#1d1d1f]">Sete hazırlık</strong>
        <strong>Telefonda önce sahneyi ana ekrana ekleyin</strong> (iPhone: Paylaş →
        &quot;Ana Ekrana Ekle&quot;, Android: ⋮ → &quot;Ana ekrana ekle&quot;) ve sahneyi{" "}
        <strong>o ikondan açın</strong>. Tarayıcının adres çubuğu ancak böyle kaybolur;
        tarayıcı içinden açarsanız çubuk kameraya girer. Bilgisayarda F11 ile tam ekran.
        <br />
        <br />
        Sahneyi açın, <strong>bir kez yenileyin</strong> ve birkaç saniye bekleyin.
        Saatin iki noktası bir kez yanıp sönünce her şey indi demektir; internet
        kesilebilir.
        <br />
        <br />
        Gizli panel: sağ üst köşeye 2 saniye içinde 5 dokunuş
        <span className="text-[#86868b]"> (bilgisayarda Ctrl+Shift+nokta)</span>.
        Panelde &quot;Sete hazır mı?&quot; satırı çevrimdışı desteğinin kurulduğunu
        gösterir. Başa sarmak için sol üst köşeye 5 dokunuş.
        <br />
        <br />
        <span className="text-[#86868b]">
          Bilgisayarda cihaz çerçevesiyle bakmak için adresin sonuna{" "}
          <code>?onizleme=1</code> ekleyin.
        </span>
      </div>
    </main>
  );
}
