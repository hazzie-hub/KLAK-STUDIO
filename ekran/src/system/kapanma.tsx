"use client";

import { useEffect, useState } from "react";

import { useDurum } from "@/durum";

/** Boş pil işareti ne kadar görünür, sonrası tamamen siyah. Sabit süre. */
const ISARET_SURESI = 3400;

/**
 * Pil bitince kapanma ekranı. CLAUDE.md §3.1 (4. katman)
 *
 * Gerçek telefonlarda olduğu gibi: ekran kararır, kısa süre boş pil işareti
 * görünür, sonra tamamen siyah kalır. Hiçbir teknik metin yok (CLAUDE.md §2.6).
 */
export function KapanmaEkrani() {
  const { durum } = useDurum();
  const kapandi = durum.pil === 0 && !durum.sarjda;
  const [isaretGorunur, setIsaretGorunur] = useState(true);

  useEffect(() => {
    if (!kapandi) {
      setIsaretGorunur(true);
      return;
    }
    const z = setTimeout(() => setIsaretGorunur(false), ISARET_SURESI);
    return () => clearTimeout(z);
  }, [kapandi]);

  if (!kapandi) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
      {isaretGorunur && (
        <svg width="52" height="94" viewBox="0 0 52 94" aria-hidden="true">
          {/* Boş pil, dikey — şarja tak işareti */}
          <rect x="17" y="6" width="18" height="5" rx="2" fill="#4a4a4f" />
          <rect x="11" y="11" width="30" height="62" rx="6" stroke="#4a4a4f" strokeWidth="3" fill="none" />
          <rect x="15" y="64" width="22" height="5" rx="2" fill="#ff3b30" />
          <path d="M26 79l-5 8h4l-1.4 6 5.4-8h-4l1-6Z" fill="#4a4a4f" />
        </svg>
      )}
    </div>
  );
}
