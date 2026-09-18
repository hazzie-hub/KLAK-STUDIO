"use client";

import { useSkin } from "@/shell";
import { uygulamaAdi, uygulamaRengi, type Bildirim } from "./bildirimler";

/**
 * Tek bildirim kartı. Hem üstteki banner hem kilit ekranı listesi bunu kullanır.
 * CLAUDE.md §2.1: gerçek uygulama ikonu yok — yer tutucu kare.
 */
export function BildirimKarti({ bildirim, saat }: { bildirim: Bildirim; saat?: string }) {
  const skin = useSkin();
  const yuvarlak = skin === "android" ? "rounded-[18px]" : "rounded-[20px]";

  return (
    <div
      className={`flex w-full items-start gap-[10px] px-[13px] py-[11px] ${yuvarlak}`}
      style={{
        background: skin === "android" ? "rgba(255,255,255,0.94)" : "rgba(250,250,252,0.86)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 6px 22px rgba(0,0,0,0.13)",
        color: "#14141a",
      }}
    >
      <span
        className="mt-[1px] block h-[22px] w-[22px] shrink-0 rounded-[6px]"
        style={{ background: uygulamaRengi(bildirim.uygulama) }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-[12px] font-medium uppercase tracking-wide opacity-55">
            {uygulamaAdi(bildirim.uygulama)}
          </span>
          {saat !== undefined && (
            <span className="ml-auto shrink-0 text-[12px] opacity-45">{saat}</span>
          )}
        </div>
        <div className="mt-[2px] text-[14px] font-semibold leading-tight">{bildirim.baslik}</div>
        <div className="text-[14px] leading-snug opacity-85">{bildirim.metin}</div>
      </div>
    </div>
  );
}
