"use client";

import { useEffect, useRef, useState } from "react";

import { useDurum } from "@/durum";
import { useSkin } from "@/shell";

/** Uyarının eşikleri ve ekranda kalma süresi — sabit (CLAUDE.md §2.4). */
const ESIKLER = [20, 10, 5];
const UYARI_SURESI = 3200;

/**
 * Düşük pil uyarısı. CLAUDE.md §3.1 (4. katman)
 *
 * Sahneye özel değil GENEL bir yetenek (CLAUDE.md §2.2): sahne pili düşürür,
 * uyarıyı sistem katmanı kendisi çıkarır — tıpkı gerçek telefonda olduğu gibi.
 */
export function PilUyarisi() {
  const { durum } = useDurum();
  const [gorunenSeviye, setGorunenSeviye] = useState<number | null>(null);
  const oncekiRef = useRef<number | null>(null);

  useEffect(() => {
    const onceki = oncekiRef.current;
    oncekiRef.current = durum.pil;

    if (onceki === null || durum.sarjda || durum.pil === 0) return;

    // Bir eşiğin altına YENİ düştüyse uyar.
    const asilan = ESIKLER.find((e) => onceki > e && durum.pil <= e);
    if (asilan === undefined) return;

    setGorunenSeviye(durum.pil);
    const z = setTimeout(() => setGorunenSeviye(null), UYARI_SURESI);
    return () => clearTimeout(z);
  }, [durum.pil, durum.sarjda]);

  const skin = useSkin();
  if (gorunenSeviye === null) return null;

  if (skin === "android") {
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-[14%] z-40 flex justify-center px-6">
        <div
          className="rounded-full px-4 py-[10px] text-[13px]"
          style={{ background: "rgba(32,33,36,0.92)", color: "#fff" }}
        >
          Pil %{gorunenSeviye} · Pil tasarrufu açılsın mı?
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center px-10">
      <div
        className="w-[270px] overflow-hidden rounded-[14px] text-center"
        style={{ background: "rgba(249,249,250,0.94)", backdropFilter: "blur(20px)", color: "#000" }}
      >
        <div className="px-4 pb-4 pt-[18px]">
          <div className="text-[17px] font-semibold">Düşük Pil</div>
          <div className="mt-1 text-[13px] leading-snug opacity-80">
            Pilin %{gorunenSeviye} kaldı.
          </div>
        </div>
        <div className="grid grid-cols-2 text-[17px]" style={{ borderTop: "1px solid rgba(0,0,0,0.12)" }}>
          <div className="py-[11px]" style={{ borderRight: "1px solid rgba(0,0,0,0.12)", color: "#007aff" }}>
            Düşük Güç Modu
          </div>
          <div className="py-[11px] font-semibold" style={{ color: "#007aff" }}>
            Tamam
          </div>
        </div>
      </div>
    </div>
  );
}
