"use client";

/**
 * Elle çizilmiş ikonlar — CLAUDE.md §2.1: gerçek uygulama ikonu yok.
 *
 * Avatar ve sayı biçimi burada değil: üç modül birden kullandığı için
 * `shared/avatar`'a taşındı.
 */

export function Kalp({ dolu = false, boyut = 24 }: { dolu?: boolean; boyut?: number }) {
  return (
    <svg width={boyut} height={boyut} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20.4 3.9 12.6C1.9 10.7 2 7.5 4.1 5.7c1.9-1.6 4.7-1.3 6.4.5l1.5 1.6 1.5-1.6c1.7-1.8 4.5-2.1 6.4-.5 2.1 1.8 2.2 5 .2 6.9L12 20.4Z"
        fill={dolu ? "#e0245e" : "none"}
        stroke={dolu ? "#e0245e" : "currentColor"}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Balon({ boyut = 24 }: { boyut?: number }) {
  return (
    <svg width={boyut} height={boyut} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21 11.6c0 4.1-4 7.4-9 7.4-1 0-2-.13-2.9-.38L3.6 20.6l1.3-3.7C3.7 15.5 3 13.6 3 11.6 3 7.5 7 4.2 12 4.2s9 3.3 9 7.4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Ucgen({ boyut = 24 }: { boyut?: number }) {
  return (
    <svg width={boyut} height={boyut} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21.5 3.2 2.8 10.3l7.1 2.9 2.9 7.1 8.7-17.1Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9.9 13.2 21.5 3.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function Yer({ boyut = 24 }: { boyut?: number }) {
  return (
    <svg width={boyut} height={boyut} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5.5 4h13v16l-6.5-4.4L5.5 20V4Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

export function UcNokta({ boyut = 20 }: { boyut?: number }) {
  return (
    <svg width={boyut} height={boyut} viewBox="0 0 24 24" aria-hidden="true">
      {[5, 12, 19].map((x) => (
        <circle key={x} cx={x} cy="12" r="1.7" fill="currentColor" />
      ))}
    </svg>
  );
}

export function Geri({ boyut = 24 }: { boyut?: number }) {
  return (
    <svg width={boyut} height={boyut} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 4 7 12l8 8" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Ev({ dolu = false, boyut = 25 }: { dolu?: boolean; boyut?: number }) {
  return (
    <svg width={boyut} height={boyut} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.5 10.2 12 3.4l8.5 6.8V20h-6v-5.4h-5V20h-6v-9.8Z" fill={dolu ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

export function Buyutec({ dolu = false, boyut = 25 }: { dolu?: boolean; boyut?: number }) {
  return (
    <svg width={boyut} height={boyut} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.6" cy="10.6" r="6.6" fill={dolu ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" />
      <path d="m15.6 15.6 4.4 4.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export function Arti({ boyut = 25 }: { boyut?: number }) {
  return (
    <svg width={boyut} height={boyut} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 8.2v7.6M8.2 12h7.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
