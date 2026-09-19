"use client";

import { useState } from "react";

import { useSkin } from "@/shell";
import { Klavye } from "./klavye";
import { useFizikselKlavye } from "./fiziksel-klavye";
import { useGhostTyping } from "./kullan";

export { harflereBol, harfSayisi, ilkHarfler } from "./harfler";
export { useGhostTyping, type GhostDurumu } from "./kullan";
export { useFizikselKlavye } from "./fiziksel-klavye";
export { Klavye } from "./klavye";

/**
 * Yazma alanı + klavye. CLAUDE.md §7
 *
 * `senaryolu` (varsayılan): sahte klavye; hangi tuşa basılırsa basılsın
 *   senaryodaki sıradaki harf yazılır. Masaüstünde fiziksel klavye dinlenir.
 * `otomatik`: kimse dokunmadan kendi kendine yazar (insert çekimler).
 * `serbest`: gerçek klavye/input — sahnede açıkça seçilirse.
 */
export function GhostYaziAlani({
  hedef,
  yerTutucu = "Yorum ekle…",
  gonderEtiketi = "Paylaş",
  onGonder,
  sol,
  vurguRengi,
}: {
  hedef: string;
  yerTutucu?: string;
  gonderEtiketi?: string;
  onGonder?: (metin: string) => void;
  /** Alanın solunda görünecek şey (avatar gibi). */
  sol?: React.ReactNode;
  /** Gönder butonunun rengi — modül kendi markasının rengini verir. */
  vurguRengi?: string;
}) {
  const vurgu = vurguRengi ?? "var(--vurgu)";
  const skin = useSkin();
  const ghost = useGhostTyping(hedef);
  const [serbestMetin, setSerbestMetin] = useState("");

  const serbest = ghost.mod === "serbest";
  const metin = serbest ? serbestMetin : ghost.yazilan;
  const gonderilebilir = serbest ? serbestMetin.trim() !== "" : ghost.tamamlandi;
  const klavyeGoster = ghost.aktif && !serbest && skin !== "desktop" && ghost.mod !== "otomatik";

  // Masaüstünde fiziksel klavye — mantık `fiziksel-klavye.ts`'te (CLAUDE.md §7).
  useFizikselKlavye(ghost, onGonder);

  return (
    <div className="shrink-0">
      <div
        className="flex items-center gap-[9px] px-[13px] py-[9px]"
        style={{ borderTop: "1px solid var(--ayrac)", background: "var(--zemin)" }}
      >
        {sol}
        <div className="min-w-0 flex-1 text-[13px]">
          {serbest ? (
            <input
              value={serbestMetin}
              onChange={(e) => setSerbestMetin(e.target.value)}
              placeholder={yerTutucu}
              className="w-full bg-transparent outline-none"
              style={{ color: "var(--metin)" }}
            />
          ) : metin === "" ? (
            <span style={{ color: "var(--metin-soluk)" }}>{yerTutucu}</span>
          ) : (
            <span style={{ color: "var(--metin)" }}>
              {metin}
              <span className="ml-[1px] inline-block animate-[imlec_1100ms_steps(1,end)_infinite] align-[-2px]"
                style={{ width: "1.5px", height: "15px", background: vurgu }} />
            </span>
          )}
        </div>
        <button
          disabled={!gonderilebilir}
          onClick={() => onGonder?.(metin)}
          className="shrink-0 text-[13px] font-semibold"
          style={{ color: vurgu, opacity: gonderilebilir ? 1 : 0.35 }}
        >
          {gonderEtiketi}
        </button>
      </div>

      {klavyeGoster && (
        <Klavye onTus={ghost.tusaBas} onGeriAl={ghost.geriAl} etkin={!ghost.tamamlandi} />
      )}
    </div>
  );
}
