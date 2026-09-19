"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useSahne } from "@/engine";
import { useKutuphane } from "@/icerik/kutuphane";
import type { KonumVerisi } from "@/schema";
import { HaritaZemini } from "./zemin";

/**
 * `harita` modülü. CLAUDE.md §3.2
 *
 * Çizilmiş harita üstünde konum pini, rota ve navigasyon animasyonu.
 * Gerçek karo haritası kullanılmıyor (lisans riski + sette internet yok).
 *
 * Animasyon DETERMİNİST: süresi sabit, rastgelelik yok; her tekrar birebir
 * aynı oynar (CLAUDE.md §2.4).
 */
const ROTA_SURESI_MS = 2600;

export function HaritaModulu({ icerikRef }: { icerikRef?: string }) {
  const { olanlar, dokun } = useSahne();
  const k = useKutuphane();

  const konumlar = useMemo(
    () =>
      [...k.icerikler.values()].flatMap((i) =>
        i.tur === "konum" ? [{ id: i.id, veri: i.veri }] : [],
      ),
    [k],
  );

  const [acik, setAcik] = useState<string | null>(icerikRef ?? konumlar[0]?.id ?? null);

  const islenenRef = useRef(0);
  useEffect(() => {
    if (olanlar.length === 0) {
      islenenRef.current = 0;
      return;
    }
    for (let i = islenenRef.current; i < olanlar.length; i++) {
      const a = olanlar[i]?.aksiyon;
      if (a?.tur === "ekranAc" && a.modul === "harita" && a.icerikRef !== undefined) {
        setAcik(a.icerikRef);
      }
    }
    islenenRef.current = olanlar.length;
  }, [olanlar]);

  const konum = konumlar.find((x) => x.id === acik) ?? konumlar[0] ?? null;

  if (konum === null) {
    // CLAUDE.md §2.6: kamerada hata yazısı görünmez.
    return <div className="h-full" style={{ background: "#eef0ea" }} />;
  }

  return <Harita veri={konum.veri} anahtar={konum.id} dokun={dokun} />;
}

function Harita({
  veri,
  anahtar,
  dokun,
}: {
  veri: KonumVerisi;
  anahtar: string;
  dokun: (hedef: string) => void;
}) {
  const rotaVar = veri.rota.length >= 2;
  const [navigasyon, setNavigasyon] = useState(false);

  // Konum değişince (ya da başa sarınca) navigasyon kapanır.
  useEffect(() => setNavigasyon(false), [anahtar]);

  const rotaYolu = veri.rota.map((n, i) => `${i === 0 ? "M" : "L"} ${n.x * 100} ${n.y * 100}`).join(" ");

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: "#eef0ea" }}>
      <HaritaZemini desen={veri.desen} />

      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        {rotaVar && (
          <>
            {/* Rotanın soluk tamamı — nereye gidileceği baştan görünür. */}
            <path
              d={rotaYolu}
              fill="none"
              stroke="#4a7fd1"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.28"
            />
            {/* Navigasyon açıkken üstüne çizilen canlı rota. */}
            {navigasyon && (
              <path
                d={rotaYolu}
                fill="none"
                stroke="#2f6fd0"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={100}
                strokeDasharray="100"
                strokeDashoffset="100"
                style={{ animation: `rotaCiz ${ROTA_SURESI_MS}ms ease-in-out forwards` }}
              />
            )}
          </>
        )}
      </svg>

      {/* Pin — SVG değil, ölçeklenmesin diye normal katmanda. */}
      <div
        className="absolute"
        style={{
          left: `${veri.pin.x * 100}%`,
          top: `${veri.pin.y * 100}%`,
          transform: "translate(-50%, -100%)",
        }}
      >
        <Pin />
      </div>

      <div
        className="absolute inset-x-0 bottom-0 px-[13px] pb-[15px]"
        onPointerDown={() => dokun("harita-kart")}
      >
        <div
          className="rounded-[15px] p-[14px]"
          style={{ background: "var(--zemin)", boxShadow: "0 4px 18px rgba(0,0,0,0.18)" }}
        >
          <div className="text-[17px] font-semibold leading-tight">{veri.ad}</div>
          {veri.adres !== undefined && (
            <div className="mt-[3px] text-[13px]" style={{ color: "var(--metin-soluk)" }}>
              {veri.adres}
            </div>
          )}

          {(veri.sure !== undefined || veri.mesafe !== undefined) && (
            <div className="mt-[9px] flex items-baseline gap-[7px]">
              {veri.sure !== undefined && (
                <span className="text-[19px] font-semibold" style={{ color: "#2f6fd0" }}>
                  {veri.sure}
                </span>
              )}
              {veri.mesafe !== undefined && (
                <span className="text-[13px]" style={{ color: "var(--metin-soluk)" }}>
                  {veri.mesafe}
                </span>
              )}
            </div>
          )}

          {rotaVar && (
            <button
              onClick={() => {
                dokun("harita-basla");
                setNavigasyon(true);
              }}
              disabled={navigasyon}
              className="mt-[11px] w-full rounded-full py-[10px] text-[15px] font-medium text-white active:opacity-80"
              style={{ background: "#2f6fd0", opacity: navigasyon ? 0.55 : 1 }}
            >
              {navigasyon ? "Yol tarifi başladı" : "Yol tarifi"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Pin() {
  return (
    <svg width="28" height="36" viewBox="0 0 28 36" aria-hidden="true">
      <ellipse cx="14" cy="33.5" rx="5" ry="2" fill="rgba(0,0,0,0.18)" />
      <path
        d="M14 1.5c-5.8 0-10.5 4.6-10.5 10.3 0 7.4 9.1 18.4 10 19.4.3.3.8.3 1 0 .9-1 10-12 10-19.4C24.5 6.1 19.8 1.5 14 1.5Z"
        fill="#d8453a"
        stroke="#fff"
        strokeWidth="1.6"
      />
      <circle cx="14" cy="11.8" r="3.6" fill="#fff" />
    </svg>
  );
}
