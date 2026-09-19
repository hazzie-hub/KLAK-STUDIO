"use client";

import { useKutuphane } from "@/icerik/kutuphane";
import type { WebBlok } from "@/schema";
import { Avatar, sayiYaz } from "@/shared/avatar";
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

    case "profil":
      return <ProfilBasligi blok={blok} renk={renk} />;

    case "izgara":
      return (
        <div className="mb-[13px] grid auto-rows-min grid-cols-3 gap-[3px]">
          {blok.dosyalar.map((dosya, i) => (
            <Medya
              key={`${dosya}-${i}`}
              kaynak={`/ornek/${dosya}`}
              alt=""
              className="w-full"
              style={{ aspectRatio: "1 / 1", color: "var(--metin)" }}
            />
          ))}
        </div>
      );
  }
}

/**
 * Profil başlığı — hesap kütüphaneden okunur.
 *
 * Kullanıcı adı, görünen ad ve avatar `content/hesaplar` altındaki tek
 * kaynaktan gelir; sayfaya elle yazılmaz. Böylece bir karakterin adı
 * değişince uygulamada da sitede de aynı anda değişir.
 */
function ProfilBasligi({
  blok,
  renk,
}: {
  blok: Extract<WebBlok, { tur: "profil" }>;
  renk: string;
}) {
  const k = useKutuphane();
  const hesap = k.hesap(blok.hesap);
  const sayilar = [
    { sayi: blok.gonderi, etiket: "gönderi" },
    { sayi: blok.takipci, etiket: "takipçi" },
    { sayi: blok.takip, etiket: "takip" },
  ].flatMap((s) => (s.sayi === undefined ? [] : [{ sayi: s.sayi, etiket: s.etiket }]));

  return (
    <div className="mb-[15px]">
      <div className="flex items-center gap-[17px]">
        <Avatar hesap={hesap} boyut={82} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[18px] font-semibold">
            {hesap?.kullaniciAdi ?? blok.hesap}
          </div>
          {hesap?.gorunenAd !== undefined && (
            <div className="mt-[2px] truncate text-[13px]" style={{ color: "var(--metin-soluk)" }}>
              {hesap.gorunenAd}
            </div>
          )}
          {sayilar.length > 0 && (
            <div className="mt-[9px] flex flex-wrap gap-[17px] text-[13px]">
              {sayilar.map((s) => (
                <span key={s.etiket}>
                  <span className="font-semibold">{sayiYaz(s.sayi)}</span>{" "}
                  <span style={{ color: "var(--metin-soluk)" }}>{s.etiket}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {blok.biyografi !== undefined && (
        <p className="mt-[11px] text-[13px] leading-[1.55]">{blok.biyografi}</p>
      )}
      <div className="mt-[13px] h-[1px] w-full" style={{ background: renk, opacity: 0.25 }} />
    </div>
  );
}
