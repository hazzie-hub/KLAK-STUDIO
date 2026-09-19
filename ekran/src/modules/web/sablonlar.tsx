"use client";

import { markalar, modulMarkasi } from "@brands";
import type { WebSayfasiVerisi } from "@/schema";
import { Bloklar } from "./bloklar";

/**
 * Sahte site şablonları. CLAUDE.md §3.2
 *
 * Dördü de aynı gövdeyi (blok listesi) çizer; farkları başlık düzeni, menü ve
 * tipografi. Yeni bir site eklemek için kod değil, içerik dosyası yazılır.
 */
export type SablonAdi = WebSayfasiVerisi["sablon"];

/** Şablonun kendi varsayılan rengi — içerik `renk` vermezse bu kullanılır. */
export const SABLON_RENKLERI: Record<SablonAdi, string> = {
  haber: "#a8322d",
  blog: "#2f6f4f",
  kurumsal: "#2a5b8c",
  forum: "#6a5230",
  /** Sosyal uygulamanın web hâli — rengi markadan gelir, elle yazılmaz. */
  sosyal: markalar[modulMarkasi.sosyal].renk,
};

function Menu({ menu, renk }: { menu: string[]; renk: string }) {
  if (menu.length === 0) return null;
  return (
    <nav className="flex flex-wrap gap-[15px] text-[11px] uppercase tracking-[0.06em]">
      {menu.map((m, i) => (
        <span key={m} style={{ color: i === 0 ? renk : "var(--metin-soluk)" }}>
          {m}
        </span>
      ))}
    </nav>
  );
}

function Kunye({ veri }: { veri: WebSayfasiVerisi }) {
  const parcalar = [veri.yazar, veri.tarih].filter((p) => p !== undefined);
  if (parcalar.length === 0) return null;
  return (
    <div className="mb-[13px] text-[12px]" style={{ color: "var(--metin-soluk)" }}>
      {parcalar.join(" · ")}
    </div>
  );
}

export function Sablon({ veri }: { veri: WebSayfasiVerisi }) {
  const renk = veri.renk ?? SABLON_RENKLERI[veri.sablon];

  switch (veri.sablon) {
    case "haber":
      return (
        <article className="px-[17px] pb-[26px] pt-[15px]">
          <div className="mb-[11px] pb-[9px]" style={{ borderBottom: `2px solid ${renk}` }}>
            <div className="text-[19px] font-bold tracking-tight" style={{ color: renk }}>
              {veri.siteAdi}
            </div>
            <div className="mt-[7px]">
              <Menu menu={veri.menu} renk={renk} />
            </div>
          </div>
          {veri.ustBaslik !== undefined && (
            <div className="mb-[5px] text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: renk }}>
              {veri.ustBaslik}
            </div>
          )}
          <h1 className="mb-[9px] text-[23px] font-bold leading-[1.22]">{veri.baslik}</h1>
          <Kunye veri={veri} />
          <Bloklar govde={veri.govde} renk={renk} />
        </article>
      );

    case "blog":
      return (
        <article className="mx-auto max-w-[620px] px-[21px] pb-[26px] pt-[23px]">
          <div className="mb-[19px] text-[12px] uppercase tracking-[0.13em]" style={{ color: renk }}>
            {veri.siteAdi}
          </div>
          <h1 className="mb-[9px] text-[24px] font-semibold leading-[1.28]">{veri.baslik}</h1>
          <Kunye veri={veri} />
          <div className="mb-[17px] h-[1px] w-[46px]" style={{ background: renk }} />
          <Bloklar govde={veri.govde} renk={renk} />
        </article>
      );

    case "kurumsal":
      return (
        <article className="pb-[26px]">
          <div className="px-[17px] py-[15px]" style={{ background: renk }}>
            <div className="text-[18px] font-semibold text-white">{veri.siteAdi}</div>
            {veri.menu.length > 0 && (
              <nav className="mt-[7px] flex flex-wrap gap-[15px] text-[11px] uppercase tracking-[0.06em] text-white/80">
                {veri.menu.map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </nav>
            )}
          </div>
          <div className="px-[17px] pt-[17px]">
            <h1 className="mb-[9px] text-[21px] font-semibold leading-[1.28]">{veri.baslik}</h1>
            <Kunye veri={veri} />
            <Bloklar govde={veri.govde} renk={renk} />
          </div>
        </article>
      );

    case "forum":
      return (
        <article className="pb-[26px]">
          <div
            className="flex items-center justify-between px-[15px] py-[11px] text-[13px]"
            style={{ background: "var(--zemin-ikincil)", borderBottom: "1px solid var(--ayrac)" }}
          >
            <span className="font-semibold" style={{ color: renk }}>
              {veri.siteAdi}
            </span>
            <Menu menu={veri.menu} renk={renk} />
          </div>
          <div className="px-[15px] pt-[15px]">
            <h1 className="mb-[7px] text-[18px] font-semibold leading-[1.32]">{veri.baslik}</h1>
            <Kunye veri={veri} />
            <Bloklar govde={veri.govde} renk={renk} />
          </div>
        </article>
      );

    /**
     * Sosyal uygulamanın web hâli: tarayıcıda açılan Akış.
     *
     * Uygulamanın kendisi `sosyal` modülü; bu, aynı markanın tarayıcıdan
     * görünen yüzü. Üstte uygulama adı, altında gövde — `profil` ve `izgara`
     * blokları burada anlamını bulur ama gövde yine sıradan blok listesidir.
     * Sayfa başlığı ayrı bir satır olarak çizilmez: profil bloğu zaten kimin
     * sayfası olduğunu söyler, iki kere yazılmış gibi durur.
     */
    case "sosyal":
      return (
        <article className="pb-[26px]">
          <div
            className="flex items-center justify-between px-[15px] py-[11px]"
            style={{ background: "var(--zemin)", borderBottom: "1px solid var(--ayrac)" }}
          >
            <span className="text-[17px] font-semibold tracking-tight" style={{ color: renk }}>
              {veri.siteAdi}
            </span>
            <Menu menu={veri.menu} renk={renk} />
          </div>
          <div className="mx-auto max-w-[620px] px-[17px] pt-[17px]">
            <Bloklar govde={veri.govde} renk={renk} />
          </div>
        </article>
      );
  }
}
