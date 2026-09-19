"use client";

import type { KonumVerisi } from "@/schema";

/**
 * Çizilmiş harita zemini. CLAUDE.md §3.2 (harita notu)
 *
 * Gerçek karo haritası (OSM vb.) KULLANILMIYOR: lisans ve atıf riski var ve
 * sette internet olmayabilir. Bunun yerine zemin burada, kodla çiziliyor.
 *
 * TAMAMEN DETERMİNİST (CLAUDE.md §2.4): rastgelelik yok, aynı desen her
 * tekrarda birebir aynı çiziliyor.
 */
type Desen = KonumVerisi["desen"];

const RENKLER = {
  zemin: "#eef0ea",
  ada: "#e2e6dc",
  yol: "#ffffff",
  anaYol: "#fbe9b7",
  su: "#b9d4e3",
  yesil: "#cfe0c3",
  cizgi: "#d8dcd2",
};

/** Şehir dokusu: ızgara yollar ve aralarındaki adalar. */
function Sehir() {
  const dikey = [8, 24, 41, 58, 76, 92];
  const yatay = [10, 26, 44, 62, 80, 94];
  return (
    <>
      <rect x="0" y="0" width="100" height="100" fill={RENKLER.ada} />
      {/* Parklar — sabit konumlar */}
      <rect x="26" y="12" width="14" height="12" fill={RENKLER.yesil} rx="1" />
      <rect x="60" y="64" width="16" height="14" fill={RENKLER.yesil} rx="1" />
      {dikey.map((x) => (
        <rect key={`d${x}`} x={x} y="0" width={x === 41 ? 3.2 : 1.8} height="100" fill={x === 41 ? RENKLER.anaYol : RENKLER.yol} />
      ))}
      {yatay.map((y) => (
        <rect key={`y${y}`} x="0" y={y} width="100" height={y === 62 ? 3.2 : 1.8} fill={y === 62 ? RENKLER.anaYol : RENKLER.yol} />
      ))}
    </>
  );
}

/** Sahil dokusu: bir yanda su, kıyı boyunca ana yol. */
function Sahil() {
  return (
    <>
      <rect x="0" y="0" width="100" height="100" fill={RENKLER.ada} />
      <path d="M0 62 Q 22 56, 44 63 T 100 58 L100 100 L0 100 Z" fill={RENKLER.su} />
      <path
        d="M0 57 Q 22 51, 44 58 T 100 53"
        fill="none"
        stroke={RENKLER.anaYol}
        strokeWidth="3.4"
      />
      <rect x="12" y="16" width="18" height="14" fill={RENKLER.yesil} rx="1" />
      {[14, 32, 52, 72, 88].map((x) => (
        <rect key={x} x={x} y="0" width="1.8" height="58" fill={RENKLER.yol} />
      ))}
      {[18, 34].map((y) => (
        <rect key={y} x="0" y={y} width="100" height="1.8" fill={RENKLER.yol} />
      ))}
    </>
  );
}

/** Kırsal doku: yeşil alanlar ve kıvrımlı tek yol. */
function Kirsal() {
  return (
    <>
      <rect x="0" y="0" width="100" height="100" fill={RENKLER.yesil} />
      <path d="M0 18 Q 30 26, 52 14 T 100 22 L100 0 L0 0 Z" fill={RENKLER.ada} />
      <path d="M0 84 Q 28 74, 56 86 T 100 78 L100 100 L0 100 Z" fill={RENKLER.ada} />
      <path
        d="M-2 70 Q 24 52, 46 58 T 78 34 T 102 30"
        fill="none"
        stroke={RENKLER.anaYol}
        strokeWidth="3"
      />
      <path d="M20 100 Q 26 74, 44 60" fill="none" stroke={RENKLER.yol} strokeWidth="1.8" />
    </>
  );
}

export function HaritaZemini({ desen }: { desen: Desen }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <rect x="0" y="0" width="100" height="100" fill={RENKLER.zemin} />
      {desen === "sahil" ? <Sahil /> : desen === "kirsal" ? <Kirsal /> : <Sehir />}
    </svg>
  );
}
