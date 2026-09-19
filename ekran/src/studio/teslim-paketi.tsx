"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

import type { Cihaz, Dizi, Karakter, Sahne } from "@/schema";
import { KABUK_ADI, kumandaLinki, oynaticiLinki, sahneBasligi, teslimMetni } from "./teslim";

/**
 * Teslim paketi ekranı. CLAUDE.md §8
 *
 * Adres tabanı TARAYICIDAN okunur (`window.location.origin`): sayfa statik
 * üretildiği için derleme anında hangi adreste yayınlanacağı bilinmiyor.
 * Böylece localhost'ta da, Vercel'de de doğru link çıkar.
 */
export function TeslimPaketi({
  sahne,
  cihaz,
  dizi,
  karakter,
}: {
  sahne: Sahne;
  cihaz: Cihaz | null;
  dizi: Dizi | null;
  karakter: Karakter | null;
}) {
  const [taban, setTaban] = useState("");
  const [kumandaVar, setKumandaVar] = useState(true);
  const [qr, setQr] = useState<string | null>(null);
  const [kopyalandi, setKopyalandi] = useState(false);

  useEffect(() => {
    setTaban(window.location.origin);
  }, []);

  const link = taban === "" ? "" : oynaticiLinki(taban, sahne.kod);

  const metin = useMemo(
    () =>
      taban === ""
        ? ""
        : teslimMetni({ sahne, cihaz, dizi, karakter, taban, kumandaVar }),
    [sahne, cihaz, dizi, karakter, taban, kumandaVar],
  );

  useEffect(() => {
    if (link === "") return;
    let iptal = false;
    // QR tarayıcıda üretilir; dışarıya istek gitmez.
    void QRCode.toDataURL(link, { width: 480, margin: 1, errorCorrectionLevel: "M" }).then((d) => {
      if (!iptal) setQr(d);
    });
    return () => {
      iptal = true;
    };
  }, [link]);

  const kopyala = async () => {
    try {
      await navigator.clipboard.writeText(metin);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    } catch {
      // Pano izni yoksa kullanıcı metni elle seçebilir; sessizce geç.
      setKopyalandi(false);
    }
  };

  return (
    <div className="mt-6 flex flex-col gap-5">
      <section className="rounded-2xl border border-[#d2d2d7] p-4">
        <h2 className="text-[15px] font-semibold">{sahneBasligi(sahne, dizi)}</h2>
        <p className="mt-[3px] text-[13px] text-[#6e6e73]">
          {karakter?.ad ?? cihaz?.karakter ?? sahne.cihaz}
          {cihaz !== null && ` · ${KABUK_ADI[cihaz.skin]}`}
        </p>

        <label className="mt-4 flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={kumandaVar}
            onChange={(e) => setKumandaVar(e.target.checked)}
            className="h-4 w-4"
          />
          Operatör kumanda kullanacak
        </label>
      </section>

      <section className="rounded-2xl border border-[#d2d2d7] p-4">
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[#6e6e73]">
          Oyuncunun cihazı
        </h3>
        <div className="mt-2 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          {qr !== null && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qr}
              alt="Sahne linkinin QR kodu"
              className="h-[136px] w-[136px] shrink-0 rounded-lg border border-[#e8e8ed]"
            />
          )}
          <div className="min-w-0">
            <p className="break-all font-mono text-[12px] text-[#3a3a3c]">{link}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-[#6e6e73]">
              Set telefonunun kamerasını QR koda tutun, link açılsın. Sonra bir kez
              yenileyip birkaç saniye bekleyin.
            </p>
          </div>
        </div>
      </section>

      {kumandaVar && (
        <section className="rounded-2xl border border-[#d2d2d7] p-4">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[#6e6e73]">
            Operatörün telefonu (kumanda)
          </h3>
          <p className="mt-2 break-all font-mono text-[12px] text-[#3a3a3c]">
            {taban === "" ? "" : kumandaLinki(taban, sahne.kod)}
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-[#d2d2d7] p-4">
        <div className="flex items-center gap-3">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[#6e6e73]">
            Sete gönderilecek metin
          </h3>
          <button
            onClick={() => void kopyala()}
            className="ml-auto rounded-full bg-[#0071e3] px-4 py-[6px] text-[13px] font-medium text-white active:opacity-80"
          >
            {kopyalandi ? "Kopyalandı ✓" : "Kopyala"}
          </button>
        </div>
        <pre className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-[#f5f5f7] p-3 text-[12px] leading-relaxed text-[#1d1d1f]">
          {metin}
        </pre>
      </section>
    </div>
  );
}
