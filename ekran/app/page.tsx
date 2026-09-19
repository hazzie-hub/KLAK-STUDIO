import Link from "next/link";

import { tumSahneler } from "@/icerik/yukle";

/**
 * Sahne listesi. Sette operatör kök adresi açıp sahneyi seçer.
 *
 * Bu sayfa kameraya GİRMEZ — oyuncuya doğrudan sahne linki verilir.
 * Burası bizim ve operatörün sayfası, o yüzden teknik bilgi göstermesi sorun değil.
 */
export default function AnaSayfa() {
  const sahneler = tumSahneler();

  const kabukAdi: Record<string, string> = {
    ios: "iPhone",
    android: "Android",
    desktop: "Bilgisayar",
  };

  return (
    <main className="mx-auto min-h-dvh max-w-[680px] px-5 py-8 text-[#1d1d1f]">
      <h1 className="text-[22px] font-semibold tracking-tight">Ekran</h1>
      <p className="mt-1 text-[14px] text-[#6e6e73]">
        Set ekran sistemi · {sahneler.length} sahne
      </p>

      <ul className="mt-6 flex flex-col gap-2">
        {sahneler.map(({ sahne, cihaz }) => (
          <li key={sahne.kod}>
            <Link
              href={`/p/${sahne.kod}`}
              className="block rounded-2xl border border-[#d2d2d7] px-4 py-[14px] active:bg-[#f5f5f7]"
            >
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
          </li>
        ))}
      </ul>

      <div className="mt-7 rounded-2xl bg-[#f5f5f7] px-4 py-[14px] text-[13px] leading-relaxed text-[#3a3a3c]">
        <strong className="block text-[#1d1d1f]">Sete hazırlık</strong>
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
