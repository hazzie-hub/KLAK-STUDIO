"use client";

import { useSahne } from "@/engine";
import type { Cihaz } from "@/schema";
import { Medya } from "@/shared/medya";
import type { Gezinme } from "@/modules";
import { RIHTIM, UYGULAMALAR, type Uygulama } from "./uygulamalar";

/**
 * `anaekran` modülü. CLAUDE.md §3.2
 *
 * İkon ızgarası. Oyuncu bir uygulamaya dokununca o modül açılır — bu GEÇİCİ
 * bir gezinmedir, olay listesine yazılmaz (bkz. `src/modules/index.tsx`).
 * Ayrıca her dokunuş bir hotspot tetikler, böylece sahne "galeriye girince
 * şu olsun" diyebilir.
 */
export function AnaEkranModulu({ cihaz, git }: { cihaz: Cihaz | null; git: Gezinme }) {
  const { dokun } = useSahne();
  const duvar = cihaz?.duvarKagidi;

  const ac = (uygulama: Uygulama) => {
    dokun(uygulama.hedef);
    git(uygulama.modul, uygulama.ekran);
  };

  const izgara = UYGULAMALAR.filter((u) => !RIHTIM.includes(u.modul));
  const rihtim = RIHTIM.flatMap((m) => UYGULAMALAR.filter((u) => u.modul === m));

  return (
    <div className="relative h-full w-full overflow-hidden">
      {duvar !== undefined && (
        <Medya
          kaynak={`/duvar/${duvar}.svg`}
          alt=""
          className="absolute inset-0 h-full w-full"
          style={{ objectFit: "cover" }}
        />
      )}
      {/* Duvar kâğıdı koyu ya da açık olabilir; ikon yazıları her ikisinde de
          okunsun diye hafif bir karartma. */}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.22)" }} />

      <div className="relative flex h-full flex-col px-[22px] pb-[14px] pt-[26px]">
        <div className="grid grid-cols-4 gap-x-[18px] gap-y-[20px]">
          {izgara.map((u) => (
            <Ikon key={u.modul} uygulama={u} ac={ac} />
          ))}
        </div>

        <div
          className="mt-auto grid grid-cols-4 gap-x-[18px] rounded-[26px] px-[14px] py-[12px]"
          style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(12px)" }}
        >
          {rihtim.map((u) => (
            <Ikon key={u.modul} uygulama={u} ac={ac} etiketsiz />
          ))}
        </div>
      </div>
    </div>
  );
}

function Ikon({
  uygulama,
  ac,
  etiketsiz = false,
}: {
  uygulama: Uygulama;
  ac: (u: Uygulama) => void;
  etiketsiz?: boolean;
}) {
  return (
    <button onClick={() => ac(uygulama)} className="flex flex-col items-center gap-[5px]">
      <span
        className="flex h-[56px] w-[56px] items-center justify-center rounded-[14px] text-white active:opacity-75"
        style={{ background: uygulama.renk, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
      >
        <UygulamaIkonu modul={uygulama.modul} />
      </span>
      {!etiketsiz && (
        <span
          className="max-w-[64px] truncate text-[11px] text-white"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
        >
          {uygulama.ad}
        </span>
      )}
    </button>
  );
}

/** Basit, markadan bağımsız simgeler. */
function UygulamaIkonu({ modul }: { modul: string }) {
  const ortak = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (modul) {
    case "telefon":
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M6.6 3.5c.7-.3 1.5 0 1.9.7l1.5 2.7c.3.6.2 1.4-.3 1.9l-1.1 1c-.2.2-.3.6-.1.9a13 13 0 0 0 4.8 4.8c.3.2.7.1.9-.1l1-1.1c.5-.5 1.3-.6 1.9-.3l2.7 1.5c.7.4 1 1.2.7 1.9l-.8 1.9c-.3.7-1 1.2-1.8 1.1C11.6 20.6 3.4 12.4 2.5 5.6c-.1-.8.4-1.5 1.1-1.8l3-.3Z"
            fill="currentColor"
          />
        </svg>
      );
    case "mesaj":
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 5.5h16v11H9.5L5 20v-3.5H4Z" {...ortak} />
        </svg>
      );
    case "sosyal":
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="4.5" {...ortak} />
          <circle cx="12" cy="12" r="4" {...ortak} />
          <circle cx="17" cy="7" r="1.1" fill="currentColor" />
        </svg>
      );
    case "arama":
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" {...ortak} />
          <path d="M15.5 15.5 21 21" {...ortak} />
        </svg>
      );
    case "galeri":
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="14" rx="2.5" {...ortak} />
          <circle cx="9" cy="10" r="1.6" fill="currentColor" />
          <path d="M5 17l4.5-4.5 3.5 3.5 2.5-2.5L19 17" {...ortak} />
        </svg>
      );
    case "harita":
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6Z" {...ortak} />
          <path d="M9 4v14M15 6v14" {...ortak} />
        </svg>
      );
    default:
      return <span className="text-[20px] font-semibold">•</span>;
  }
}
