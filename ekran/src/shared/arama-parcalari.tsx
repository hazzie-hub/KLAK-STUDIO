"use client";

import type { ReactNode } from "react";

/**
 * Arama ekranlarının ortak parçaları.
 *
 * Gelen arama sistem katmanında (`src/system/arama-ekrani.tsx`), giden arama
 * `telefon` modülünde çizilir. İkisinin ahizesi ve düğmesi aynı görünmeli;
 * bu yüzden tek yerde durur.
 */

/** Arama ekranlarının zemini — iki ekran da aynı görünsün. */
export const ARAMA_ZEMINI = "linear-gradient(170deg, #4a4f57 0%, #2a2d33 45%, #17191d 100%)";

export function AramaDugmesi({
  renk,
  etiket,
  onBas,
  children,
}: {
  renk: string;
  etiket: string;
  onBas: () => void;
  children: ReactNode;
}) {
  return (
    <button onClick={onBas} className="flex flex-col items-center gap-[9px]" aria-label={etiket}>
      <span
        className="flex h-[68px] w-[68px] items-center justify-center rounded-full active:opacity-80"
        style={{ background: renk }}
      >
        {children}
      </span>
      <span className="text-[13px] opacity-80">{etiket}</span>
    </button>
  );
}

export function Ahize({ kapali = false, boyut = 30 }: { kapali?: boolean; boyut?: number }) {
  return (
    <svg
      width={boyut}
      height={boyut}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ transform: kapali ? "rotate(135deg)" : undefined }}
    >
      <path
        d="M6.6 3.5c.7-.3 1.5 0 1.9.7l1.5 2.7c.3.6.2 1.4-.3 1.9l-1.1 1c-.2.2-.3.6-.1.9a13 13 0 0 0 4.8 4.8c.3.2.7.1.9-.1l1-1.1c.5-.5 1.3-.6 1.9-.3l2.7 1.5c.7.4 1 1.2.7 1.9l-.8 1.9c-.3.7-1 1.2-1.8 1.1C11.6 20.6 3.4 12.4 2.5 5.6c-.1-.8.4-1.5 1.1-1.8l3-.3Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Saniyeyi "d:ss" biçiminde yazar — konuşma süresi sayacı. */
export function sureMetni(saniye: number): string {
  const dakika = Math.floor(saniye / 60);
  return `${dakika}:${String(saniye % 60).padStart(2, "0")}`;
}
