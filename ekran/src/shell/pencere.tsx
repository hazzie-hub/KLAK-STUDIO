"use client";

import type { ReactNode } from "react";

import { useHazirlik } from "@/platform/hazirlik";

/**
 * Desktop kabuğu: KURGUSAL tarayıcı penceresi. CLAUDE.md §3.1
 *
 * Not: CLAUDE.md §2.6 "tarayıcı çubuğu görünmez" derken GERÇEK tarayıcının
 * çubuğunu kasteder — set bilgisayarında F11 ile tam ekrana geçilir.
 * Buradaki çerçeve kurgunun parçasıdır, bizim çizdiğimizdir.
 */
export function Pencere({
  adresMetni,
  sekmeBasligi,
  children,
}: {
  /** Adres çubuğunda görünecek kurgusal alan adı. Adım 7'de /brands'ten gelecek. */
  adresMetni?: string;
  sekmeBasligi?: string;
  children: ReactNode;
}) {
  // Hazır göstergesi (CLAUDE.md §6): desktop'ta durum çubuğu yok, işaret
  // adres çubuğundaki kilit ikonunda bir kez yanıp söner.
  const { isaretVer } = useHazirlik();

  return (
    <div className="flex h-full w-full flex-col" style={{ background: "var(--zemin-ikincil)" }}>
      {/* Sekme şeridi */}
      <div
        className="flex shrink-0 items-end gap-2 px-3 pt-2"
        style={{ height: "40px", background: "var(--zemin-ikincil)" }}
      >
        <div className="flex items-center gap-[6px] pb-[10px] pr-1">
          <span className="block h-[11px] w-[11px] rounded-full bg-[#ff5f57]" />
          <span className="block h-[11px] w-[11px] rounded-full bg-[#febc2e]" />
          <span className="block h-[11px] w-[11px] rounded-full bg-[#28c840]" />
        </div>
        <div
          className="flex max-w-[240px] flex-1 items-center gap-2 truncate rounded-t-lg px-3 py-[7px] text-[12px]"
          style={{ background: "var(--zemin)", color: "var(--metin)" }}
        >
          <span className="h-3 w-3 shrink-0 rounded-[3px]" style={{ background: "var(--ayrac)" }} />
          <span className="truncate">{sekmeBasligi ?? " "}</span>
        </div>
      </div>

      {/* Adres çubuğu */}
      <div
        className="flex shrink-0 items-center gap-3 px-4"
        style={{ height: "44px", background: "var(--zemin)", borderBottom: "1px solid var(--ayrac)" }}
      >
        <div className="flex items-center gap-3" style={{ color: "var(--metin-soluk)" }}>
          <Ok yon="sol" />
          <Ok yon="sag" />
          <Yenile />
        </div>
        <div
          className="flex h-[30px] flex-1 items-center gap-2 rounded-full px-3 text-[12px]"
          style={{ background: "var(--zemin-ikincil)", color: "var(--metin-soluk)" }}
        >
          <Kilit />
          <span className="truncate">{adresMetni ?? "—"}</span>
        </div>
      </div>

      {/* Sayfa */}
      <div className="relative min-h-0 flex-1 overflow-hidden" style={{ background: "var(--zemin)" }}>
        {children}
      </div>
    </div>
  );
}

function Ok({ yon }: { yon: "sol" | "sag" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style={{ opacity: 0.5 }}>
      <path
        d={yon === "sol" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function Yenile() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style={{ opacity: 0.5 }}>
      <path
        d="M13 8a5 5 0 1 1-1.6-3.7M13 2.6V5.4h-2.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function Kilit() {
  return (
    <svg width="11" height="12" viewBox="0 0 11 12" aria-hidden="true" className="shrink-0">
      <rect x="1" y="5" width="9" height="6.4" rx="1.6" fill="currentColor" />
      <path d="M3.2 5V3.4a2.3 2.3 0 0 1 4.6 0V5" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  );
}
