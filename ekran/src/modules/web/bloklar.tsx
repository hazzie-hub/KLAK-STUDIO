"use client";

import type { WebBlok } from "@/schema";
import { Medya } from "@/shared/medya";

/**
 * Sayfa gövdesi — şablondan bağımsız. CLAUDE.md §3.2
 *
 * Hangi şablon olursa olsun bloklar aynı bileşenlerle çizilir; şablon sadece
 * çevresini (başlık, menü, renk) değiştirir.
 */
export function Bloklar({ govde, renk }: { govde: WebBlok[]; renk: string }) {
  return (
    <>
      {govde.map((blok, i) => (
        <Blok key={i} blok={blok} renk={renk} />
      ))}
    </>
  );
}

function Blok({ blok, renk }: { blok: WebBlok; renk: string }) {
  switch (blok.tur) {
    case "baslik":
      return <h2 className="mb-[7px] mt-[17px] text-[17px] font-semibold leading-snug">{blok.metin}</h2>;

    case "paragraf":
      return (
        <p className="mb-[11px] text-[14px] leading-[1.62]" style={{ color: "var(--metin)" }}>
          {blok.metin}
        </p>
      );

    case "gorsel":
      return (
        <figure className="mb-[13px]">
          <Medya
            kaynak={`/ornek/${blok.dosya}`}
            alt={blok.altYazi ?? ""}
            className="w-full rounded-[4px]"
            style={{ aspectRatio: "16 / 10", color: "var(--metin)" }}
          />
          {blok.altYazi !== undefined && (
            <figcaption className="mt-[5px] text-[11px]" style={{ color: "var(--metin-soluk)" }}>
              {blok.altYazi}
            </figcaption>
          )}
        </figure>
      );

    case "alinti":
      return (
        <blockquote
          className="mb-[13px] py-[3px] pl-[13px] text-[15px] italic leading-[1.55]"
          style={{ borderLeft: `3px solid ${renk}` }}
        >
          {blok.metin}
          {blok.kaynak !== undefined && (
            <span className="mt-[5px] block text-[12px] not-italic" style={{ color: "var(--metin-soluk)" }}>
              — {blok.kaynak}
            </span>
          )}
        </blockquote>
      );

    case "liste":
      return (
        <ul className="mb-[13px] pl-[17px] text-[14px] leading-[1.62]">
          {blok.maddeler.map((m, i) => (
            <li key={i} className="mb-[4px] list-disc">
              {m}
            </li>
          ))}
        </ul>
      );

    case "yorum":
      return (
        <div className="mb-[11px] rounded-[7px] p-[11px]" style={{ background: "var(--zemin-ikincil)" }}>
          <div className="mb-[4px] flex items-baseline gap-[7px]">
            <span className="text-[13px] font-semibold" style={{ color: renk }}>
              {blok.yazar}
            </span>
            {blok.tarih !== undefined && (
              <span className="text-[11px]" style={{ color: "var(--metin-soluk)" }}>
                {blok.tarih}
              </span>
            )}
          </div>
          <p className="text-[13px] leading-[1.55]">{blok.metin}</p>
        </div>
      );
  }
}
