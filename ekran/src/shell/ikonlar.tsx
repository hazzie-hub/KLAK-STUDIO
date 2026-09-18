/**
 * Durum çubuğu ikonları — hepsi elle çizilmiş SVG.
 * CLAUDE.md §2.1: hiçbir gerçek marka ikonu kullanılmaz.
 */
import type { Skin } from "@/schema";

export function SinyalIkonu({ cubuk = 4 }: { cubuk?: number }) {
  return (
    <svg width="17" height="11" viewBox="0 0 17 11" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={i * 4.4}
          y={8 - i * 2.4}
          width="3"
          height={3 + i * 2.4}
          rx="0.8"
          fill="currentColor"
          opacity={i < cubuk ? 1 : 0.28}
        />
      ))}
    </svg>
  );
}

export function WifiIkonu({ acik = true }: { acik?: boolean }) {
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" aria-hidden="true" opacity={acik ? 1 : 0.28}>
      <path
        d="M8 10.2 6.1 8.1a2.8 2.8 0 0 1 3.8 0L8 10.2Z"
        fill="currentColor"
      />
      <path
        d="M3.4 5.4a6.6 6.6 0 0 1 9.2 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M5.4 7.4a3.8 3.8 0 0 1 5.2 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M1.4 3.4a9.4 9.4 0 0 1 13.2 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function PilIkonu({
  seviye,
  sarjda = false,
  skin,
}: {
  seviye: number;
  sarjda?: boolean;
  skin: Skin;
}) {
  const oran = Math.max(0, Math.min(100, seviye)) / 100;
  const genislik = 21;
  const icGenislik = (genislik - 4) * oran;

  // Kritik seviyede kırmızı — gerçek cihazlar da böyle davranır.
  const dolguRengi = !sarjda && seviye <= 20 ? "#ff3b30" : sarjda ? "#34c759" : "currentColor";

  return (
    <svg width="25" height="13" viewBox="0 0 25 13" aria-hidden="true">
      <rect
        x="0.5"
        y="0.5"
        width={genislik}
        height="12"
        rx={skin === "android" ? "2.5" : "3.8"}
        stroke="currentColor"
        strokeOpacity="0.38"
        fill="none"
      />
      <rect x="2" y="2" width={icGenislik} height="9" rx="2" fill={dolguRengi} />
      <path
        d="M22.4 4.7c.9.35 1.4 1.05 1.4 1.8s-.5 1.45-1.4 1.8V4.7Z"
        fill="currentColor"
        fillOpacity="0.38"
      />
      {sarjda && (
        <path d="M12.4 2.4 8.6 7.2h2.4l-1 3.6 3.8-4.8h-2.4l1-3.6Z" fill="#ffffff" stroke="#00000022" strokeWidth="0.4" />
      )}
    </svg>
  );
}
