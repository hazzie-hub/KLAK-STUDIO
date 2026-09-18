"use client";

import { useEffect, useState } from "react";

import { gecikmeHesapla, useDurum } from "@/durum";

/**
 * Tek görsel bileşeni. CLAUDE.md §3.3
 *
 * Cihaz durumu katmanındaki görsel yükleme ayarına uyar. Hiçbir modül
 * kendi yavaş/yüklenmeyen görsel mantığını yazmaz — hepsi buradan geçer.
 *
 * CLAUDE.md §2.6: yükleniyor ikonu YOK. Beklerken sade bir gri alan durur,
 * gerçek telefonlarda olduğu gibi. Dönen çark kameraya teknik görünür.
 */

type Asama = "bekliyor" | "yuklendi" | "yuklenmedi";

export function Medya({
  kaynak,
  alt,
  className,
  style,
}: {
  kaynak: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { gorselDavranisi } = useDurum();

  const baslangicAsamasi: Asama = gorselDavranisi === "normal" ? "yuklendi" : "bekliyor";
  const [asama, setAsama] = useState<Asama>(baslangicAsamasi);

  useEffect(() => {
    if (gorselDavranisi === "normal") {
      setAsama("yuklendi");
      return;
    }

    setAsama("bekliyor");
    const sure = gecikmeHesapla(kaynak);
    const zamanlayici = setTimeout(() => {
      setAsama(gorselDavranisi === "gec" ? "yuklendi" : "yuklenmedi");
    }, sure);

    return () => clearTimeout(zamanlayici);
  }, [gorselDavranisi, kaynak]);

  if (asama === "yuklendi") {
    return (
      <img
        src={kaynak}
        alt={alt}
        className={className}
        style={{ display: "block", objectFit: "cover", ...style }}
        onError={() => setAsama("yuklenmedi")}
        draggable={false}
      />
    );
  }

  return (
    <div
      className={className}
      style={{ background: "var(--zemin-ikincil)", ...style }}
      aria-label={alt}
      role="img"
    >
      {asama === "yuklenmedi" && <KirikGorsel />}
    </div>
  );
}

/** Yüklenemeyen görselin yerinde duran işaret — gerçek uygulamalardaki gibi sade. */
function KirikGorsel() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" style={{ opacity: 0.22 }}>
        <rect x="2.5" y="5.5" width="29" height="23" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="11.5" cy="13" r="2.6" fill="currentColor" />
        <path d="M5 24.5 12.5 17l5.5 5 4-3.5 7 6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );
}
