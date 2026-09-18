"use client";

import { useEffect, useRef, useState } from "react";

import { Medya } from "@/shared/medya";
import { Avatar, Balon, Kalp, UcNokta, Ucgen, Yer, sayiYaz } from "./parcalar";
import type { GorunenPost } from "./veri";

/**
 * Feed'deki tek post. Beğeni sayısı arttığında kalp bir kez atar —
 * sayı `olanlar` listesinden geldiği için animasyon da deterministik.
 */
export function PostKarti({
  post,
  onYorumlar,
  onPost,
}: {
  post: GorunenPost;
  onYorumlar: (postId: string) => void;
  onPost?: (postId: string) => void;
}) {
  const [atiyor, setAtiyor] = useState(false);
  const oncekiRef = useRef(post.begeni);

  useEffect(() => {
    if (post.begeni > oncekiRef.current) {
      setAtiyor(true);
      const z = setTimeout(() => setAtiyor(false), 620);
      oncekiRef.current = post.begeni;
      return () => clearTimeout(z);
    }
    oncekiRef.current = post.begeni;
  }, [post.begeni]);

  return (
    <article className="pb-[10px]">
      <header className="flex items-center gap-[10px] px-[13px] py-[9px]">
        <Avatar hesap={post.hesap} boyut={33} />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[13px] font-semibold">
            {post.hesap?.kullaniciAdi ?? "—"}
          </div>
          {post.konum !== undefined && (
            <div className="truncate text-[11px]" style={{ color: "var(--metin-soluk)" }}>
              {post.konum}
            </div>
          )}
        </div>
        <button aria-label="Seçenekler" style={{ color: "var(--metin)" }}>
          <UcNokta />
        </button>
      </header>

      <button
        className="block w-full"
        onClick={() => onPost?.(post.id)}
        aria-label={post.aciklama}
      >
        <Medya
          kaynak={`/ornek/${post.gorsel}`}
          alt={post.aciklama}
          className="w-full"
          style={{ aspectRatio: "1 / 1", color: "var(--metin)" }}
        />
      </button>

      <div className="flex items-center gap-[14px] px-[13px] pt-[9px]" style={{ color: "var(--metin)" }}>
        <span className={atiyor ? "animate-[kalpAt_620ms_ease-out]" : undefined}>
          <Kalp dolu={atiyor} />
        </span>
        <button aria-label="Yorumlar" onClick={() => onYorumlar(post.id)}>
          <Balon />
        </button>
        <Ucgen />
        <span className="ml-auto">
          <Yer />
        </span>
      </div>

      <div className="px-[13px] pt-[7px] text-[13px] leading-snug">
        <div className="font-semibold">{sayiYaz(post.begeni)} beğeni</div>
        {post.aciklama !== "" && (
          <div className="mt-[3px]">
            <span className="font-semibold">{post.hesap?.kullaniciAdi} </span>
            {post.aciklama}
          </div>
        )}

        {post.yorumlar.length > 0 && (
          <button
            onClick={() => onYorumlar(post.id)}
            className="mt-[4px] block text-left"
            style={{ color: "var(--metin-soluk)" }}
          >
            {post.yorumlar.length} yorumun tümünü gör
          </button>
        )}

        {post.yorumlar.slice(-2).map((y, i) => (
          <div key={i} className={`mt-[3px] ${y.yeni ? "animate-[yorumGir_420ms_ease-out]" : ""}`}>
            <span className="font-semibold">{y.hesap?.kullaniciAdi} </span>
            {y.metin}
          </div>
        ))}

        {post.tarih !== undefined && (
          <div className="mt-[5px] text-[11px]" style={{ color: "var(--metin-soluk)" }}>
            {post.tarih}
          </div>
        )}
      </div>
    </article>
  );
}
