"use client";

import { useEffect, useRef, useState } from "react";

import { useSahne } from "@/engine";
import { Medya } from "@/shared/medya";
import { Avatar, Geri } from "@/modules/sosyal/parcalar";
import { MARKA, useMesajVeri, type GorunenMesaj, type GorunenSohbet } from "./veri";

/**
 * `mesaj` modülü. CLAUDE.md §3.2
 * Sohbet listesi, sohbet ekranı, "yazıyor…", görüldü, fotoğraf.
 *
 * Sosyal modülündeki mimari: ekranda ne varsa gerçekleşen olaylardan türer.
 */
export function MesajModulu({ baslangicEkrani, sohbetId }: { baslangicEkrani: string; sohbetId?: string }) {
  const sohbetler = useMesajVeri();
  const [acik, setAcik] = useState<string | null>(
    baslangicEkrani === "sohbet" ? (sohbetId ?? sohbetler[0]?.id ?? null) : null,
  );

  const sohbet = sohbetler.find((s) => s.id === acik) ?? null;

  if (sohbet !== null) {
    return <SohbetEkrani sohbet={sohbet} geri={() => setAcik(null)} />;
  }
  return <SohbetListesi sohbetler={sohbetler} ac={setAcik} />;
}

function SohbetListesi({
  sohbetler,
  ac,
}: {
  sohbetler: GorunenSohbet[];
  ac: (id: string) => void;
}) {
  return (
    <div className="flex h-full flex-col" style={{ background: "var(--zemin)" }}>
      <header
        className="flex h-[52px] shrink-0 items-center px-[15px]"
        style={{ borderBottom: "1px solid var(--ayrac)" }}
      >
        <span className="text-[20px] font-semibold tracking-tight" style={{ color: MARKA.renk }}>
          {MARKA.ad}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        {sohbetler.map((s) => {
          const son = s.mesajlar.at(-1);
          return (
            <button
              key={s.id}
              onClick={() => ac(s.id)}
              className="flex w-full items-center gap-[11px] px-[15px] py-[11px] text-left"
              style={{ borderBottom: "1px solid var(--ayrac)" }}
            >
              <Avatar hesap={s.hesap} boyut={48} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-[15px] font-medium">
                    {s.hesap?.gorunenAd ?? s.id}
                  </span>
                  <span className="ml-auto shrink-0 text-[11px]" style={{ color: "var(--metin-soluk)" }}>
                    {son?.saat ?? ""}
                  </span>
                </div>
                <div className="truncate text-[13px]" style={{ color: "var(--metin-soluk)" }}>
                  {s.yaziyor ? "yazıyor…" : (son?.metin ?? (son?.gorsel !== undefined ? "Fotoğraf" : ""))}
                </div>
              </div>
              {s.okunmamis > 0 && (
                <span
                  className="ml-1 shrink-0 rounded-full px-[7px] py-[2px] text-[11px] font-semibold text-white"
                  style={{ background: MARKA.renk }}
                >
                  {s.okunmamis}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SohbetEkrani({ sohbet, geri }: { sohbet: GorunenSohbet; geri: () => void }) {
  const { dokun } = useSahne();
  const altRef = useRef<HTMLDivElement | null>(null);

  // Yeni mesaj gelince en alta kay — gerçek uygulamalar böyle yapar.
  useEffect(() => {
    altRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [sohbet.mesajlar.length, sohbet.yaziyor]);

  return (
    <div className="flex h-full flex-col" style={{ background: "var(--zemin-ikincil)" }}>
      <header
        className="flex h-[52px] shrink-0 items-center gap-[10px] px-[13px]"
        style={{ background: "var(--zemin)", borderBottom: "1px solid var(--ayrac)" }}
      >
        <button onClick={geri} aria-label="Geri" style={{ color: MARKA.renk }}>
          <Geri />
        </button>
        <Avatar hesap={sohbet.hesap} boyut={34} />
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[15px] font-medium">{sohbet.hesap?.gorunenAd}</div>
          <div className="truncate text-[11px]" style={{ color: "var(--metin-soluk)" }}>
            {sohbet.yaziyor ? "yazıyor…" : "çevrimiçi"}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto px-[11px] py-[11px]">
        {sohbet.mesajlar.map((m, i) => (
          <Balon key={i} mesaj={m} />
        ))}
        {sohbet.yaziyor && <YaziyorBalonu />}
        <div ref={altRef} />
      </div>

      <div
        className="flex shrink-0 items-center gap-[9px] px-[13px] py-[9px]"
        style={{ background: "var(--zemin)", borderTop: "1px solid var(--ayrac)" }}
        onPointerDown={() => dokun("mesaj-alani")}
      >
        <div
          className="flex-1 rounded-full px-[13px] py-[8px] text-[13px]"
          style={{ background: "var(--zemin-ikincil)", color: "var(--metin-soluk)" }}
        >
          Mesaj
        </div>
      </div>
    </div>
  );
}

function Balon({ mesaj }: { mesaj: GorunenMesaj }) {
  return (
    <div
      className={`mb-[7px] flex ${mesaj.benMi ? "justify-end" : "justify-start"} ${
        mesaj.yeni ? "animate-[yorumGir_420ms_ease-out]" : ""
      }`}
    >
      <div
        className="max-w-[78%] overflow-hidden rounded-[15px] px-[11px] py-[7px] text-[14px] leading-snug"
        style={{
          background: mesaj.benMi ? MARKA.renkAcik : "var(--zemin)",
          color: mesaj.benMi ? "#0d1b2a" : "var(--metin)",
          boxShadow: "0 1px 1px rgba(0,0,0,0.08)",
        }}
      >
        {mesaj.gorsel !== undefined && (
          <Medya
            kaynak={`/ornek/${mesaj.gorsel}`}
            alt="Fotoğraf"
            className="mb-[5px] -mx-[11px] -mt-[7px] w-[210px]"
            style={{ aspectRatio: "1 / 1", color: "var(--metin)" }}
          />
        )}
        {mesaj.metin}
        <span className="ml-[7px] inline-flex items-baseline gap-[3px] text-[10px] opacity-55">
          {mesaj.saat}
          {mesaj.benMi && mesaj.durum !== undefined && <Tikler durum={mesaj.durum} />}
        </span>
      </div>
    </div>
  );
}

function Tikler({ durum }: { durum: NonNullable<GorunenMesaj["durum"]> }) {
  const ciftMi = durum !== "gonderildi";
  const mavi = durum === "goruldu";
  return (
    <svg width={ciftMi ? 16 : 11} height="9" viewBox={`0 0 ${ciftMi ? 16 : 11} 9`} aria-hidden="true">
      <path
        d="M0.8 5 3.4 7.6 9.4 1"
        stroke={mavi ? "#2f7fd6" : "currentColor"}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {ciftMi && (
        <path
          d="M6 5 8.6 7.6 14.6 1"
          stroke={mavi ? "#2f7fd6" : "currentColor"}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function YaziyorBalonu() {
  return (
    <div className="mb-[7px] flex justify-start">
      <div
        className="flex items-center gap-[4px] rounded-[15px] px-[13px] py-[11px]"
        style={{ background: "var(--zemin)", boxShadow: "0 1px 1px rgba(0,0,0,0.08)" }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block h-[6px] w-[6px] rounded-full"
            style={{
              background: "var(--metin-soluk)",
              animation: `yaziyorNokta 1200ms ${i * 160}ms ease-in-out infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
