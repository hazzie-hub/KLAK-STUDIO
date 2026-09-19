"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

import type { Cihaz, Dizi, Karakter, Sahne } from "@/schema";
import { Dugme, Kart, Yigin } from "./panel";
import { kumandaLinki, oynaticiLinki, teslimMetni } from "./teslim";

/**
 * Teslim paketi. CLAUDE.md §8
 *
 * Adres tabanı TARAYICIDAN okunur: sayfa statik üretildiği için derleme
 * anında hangi adreste yayınlanacağı bilinmiyor. Böylece localhost'ta da,
 * yayında da doğru link çıkar.
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

  useEffect(() => setTaban(window.location.origin), []);

  const link = taban === "" ? "" : oynaticiLinki(taban, sahne.kod);

  const metin = useMemo(
    () => (taban === "" ? "" : teslimMetni({ sahne, cihaz, dizi, karakter, taban, kumandaVar })),
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
    <Yigin>
      <Kart
        baslik="Oyuncunun cihazı"
        aciklama="Set telefonunun kamerasını QR koda tutun. Sonra sahneyi ana ekrana ekleyip ikondan açın."
      >
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {qr !== null && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qr}
              alt="Sahne linkinin QR kodu"
              className="h-[150px] w-[150px] shrink-0 rounded-[12px] border border-[#e4e4e7]"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="break-all font-mono text-[12px] leading-relaxed text-[#48484a]">{link}</p>

            <label className="mt-4 flex items-center gap-[9px] text-[13px] text-[#1d1d1f]">
              <input
                type="checkbox"
                checked={kumandaVar}
                onChange={(e) => setKumandaVar(e.target.checked)}
                className="h-[15px] w-[15px] accent-[#0071e3]"
              />
              Operatör kumanda kullanacak
            </label>

            {kumandaVar && (
              <p className="mt-2 break-all font-mono text-[11px] leading-relaxed text-[#8e8e93]">
                Kumanda: {taban === "" ? "" : kumandaLinki(taban, sahne.kod)}
              </p>
            )}
          </div>
        </div>
      </Kart>

      <Kart
        baslik="Sete gönderilecek metin"
        aciklama="Linki, ne olacağını ve cihaz hazırlığını içerir."
        sag={
          <Dugme tur={kopyalandi ? "onay" : "birincil"} kucuk onClick={() => void kopyala()}>
            {kopyalandi ? "Kopyalandı" : "Kopyala"}
          </Dugme>
        }
      >
        <pre className="max-h-[340px] overflow-auto whitespace-pre-wrap break-words rounded-[12px] bg-[#f5f5f7] p-[13px] font-sans text-[12px] leading-relaxed text-[#1d1d1f]">
          {metin}
        </pre>
      </Kart>
    </Yigin>
  );
}
