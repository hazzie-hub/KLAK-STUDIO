'use client';

import { useEffect, useState } from 'react';

type KlakLogoProps = {
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * PNG'deki düz siyah zemini kaldırır (luminance eşiği altı = şeffaf).
 * Gerçek alpha'lı export kullanılırsa işlem atlanır (yeşil tonları korunur).
 */
export default function KlakLogo({
  alt = 'KLAK AI & Tech Studio',
  className,
  style,
}: KlakLogoProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (cancelled) return;
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) return;

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, w, h);
        const d = imageData.data;

        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum < 32) {
            d[i + 3] = 0;
          } else if (lum < 52) {
            d[i + 3] = Math.round(((lum - 32) / 20) * d[i + 3]);
          }
        }

        ctx.putImageData(imageData, 0, 0);
        setDataUrl(canvas.toDataURL('image/png'));
      } catch {
        /* canvas tainted vb. */
      }
    };
    img.onerror = () => {
      if (!cancelled) setDataUrl(null);
    };
    img.src = '/klak-logo.png';

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={dataUrl ?? '/klak-logo.png'}
      alt={alt}
      style={style}
    />
  );
}
