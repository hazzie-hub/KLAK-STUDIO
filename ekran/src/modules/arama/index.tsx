"use client";

import { useEffect, useRef, useState } from "react";

import { useSahne } from "@/engine";
import type { AramaSonucu } from "@/schema";
import { Klavye, useFizikselKlavye, useGhostTyping } from "@/shared/ghost-typing";
import { Medya } from "@/shared/medya";
import { useSkin } from "@/shell";
import { GHOST_HEDEF, MARKA, useAramalar, type GorunenArama } from "./veri";

/**
 * `arama` modülü — LOOK. CLAUDE.md §3.2
 *
 * Arama çubuğu, sonuç listesi, görsel sonuçlar. Arama çubuğuna yazılan metin
 * ghost typing'ten gelir (CLAUDE.md §7); modül kendi yazma mantığını yazmaz.
 *
 * Ekranda ne varsa gerçekleşen olaylardan türer: hangi sonuç sayfasının açık
 * olduğu `baslangic` ya da `ekranAc` aksiyonuyla belirlenir.
 */
type Ekran = "ana" | "sonuclar" | "gorseller";

function ekranCoz(ad: string): Ekran {
  return ad === "sonuclar" || ad === "gorseller" ? ad : "ana";
}

export function AramaModulu({
  baslangicEkrani,
  icerikRef,
}: {
  baslangicEkrani: string;
  icerikRef?: string;
}) {
  const { olanlar } = useSahne();
  const aramalar = useAramalar();

  const [ekran, setEkran] = useState<Ekran>(ekranCoz(baslangicEkrani));
  const [aktifId, setAktifId] = useState<string | null>(icerikRef ?? aramalar[0]?.id ?? null);

  // Derin link: `ekranAc` aksiyonu bu modülü hedeflerse oraya geç (CLAUDE.md §3.3).
  const islenenRef = useRef(0);
  useEffect(() => {
    if (olanlar.length === 0) {
      islenenRef.current = 0;
      return;
    }
    for (let i = islenenRef.current; i < olanlar.length; i++) {
      const a = olanlar[i]?.aksiyon;
      if (a?.tur === "ekranAc" && a.modul === "arama") {
        setEkran(ekranCoz(a.ekran));
        if (a.icerikRef !== undefined) setAktifId(a.icerikRef);
      }
    }
    islenenRef.current = olanlar.length;
  }, [olanlar]);

  const arama = aramalar.find((a) => a.id === aktifId) ?? aramalar[0] ?? null;

  if (ekran === "ana") {
    return <AnaEkran arama={arama} ara={() => setEkran("sonuclar")} />;
  }
  return (
    <SonucEkrani
      arama={arama}
      sekme={ekran}
      sekmeSec={setEkran}
      basaDon={() => setEkran("ana")}
    />
  );
}

/** LOOK yazısı — iki "O" daire olarak çizilir. */
function Logo({ boyut = 34 }: { boyut?: number }) {
  return (
    <div
      className="flex items-center font-semibold tracking-[0.02em]"
      style={{ fontSize: boyut, color: "var(--metin)", lineHeight: 1 }}
      aria-label={MARKA.ad}
    >
      <span>L</span>
      <span
        className="mx-[0.04em] inline-block rounded-full border-[0.13em]"
        style={{ width: "0.66em", height: "0.66em", borderColor: MARKA.renk }}
      />
      <span
        className="mr-[0.04em] inline-block rounded-full border-[0.13em]"
        style={{ width: "0.66em", height: "0.66em", borderColor: MARKA.renkAcik }}
      />
      <span>K</span>
    </div>
  );
}

function Buyutec({ boyut = 15 }: { boyut?: number }) {
  return (
    <svg width={boyut} height={boyut} viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      <circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.4 10.4 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Arama çubuğu — yazan taraf ghost typing.
 * `salt` true ise sonuç sayfasındaki pasif hali (klavye yok).
 */
function AramaCubugu({
  metin,
  imlec,
  yerTutucu = "Ara",
}: {
  metin: string;
  imlec: boolean;
  yerTutucu?: string;
}) {
  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-[9px] rounded-full px-[14px] py-[9px]"
      style={{ background: "var(--zemin-ikincil)", border: "1px solid var(--ayrac)" }}
    >
      <span style={{ color: "var(--metin-soluk)" }}>
        <Buyutec />
      </span>
      <span className="min-w-0 flex-1 truncate text-[14px]">
        {metin === "" ? (
          <span style={{ color: "var(--metin-soluk)" }}>{yerTutucu}</span>
        ) : (
          <span style={{ color: "var(--metin)" }}>{metin}</span>
        )}
        {imlec && (
          <span
            className="ml-[1px] inline-block animate-[imlec_1100ms_steps(1,end)_infinite] align-[-2px]"
            style={{ width: "1.5px", height: "15px", background: MARKA.renk }}
          />
        )}
      </span>
    </div>
  );
}

function AnaEkran({ arama, ara }: { arama: GorunenArama | null; ara: () => void }) {
  const { dokun } = useSahne();
  const ghost = useGhostTyping(GHOST_HEDEF);
  const skin = useSkin();
  useFizikselKlavye(ghost, ara);

  const klavyeGoster = ghost.aktif && ghost.mod !== "serbest" && ghost.mod !== "otomatik" && skin !== "desktop";

  return (
    <div className="flex h-full flex-col" style={{ background: "var(--zemin)" }}>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-[26px]">
        <div className="mb-[26px]">
          <Logo />
        </div>
        <div className="flex w-full items-center" onPointerDown={() => dokun("arama-alani")}>
          <AramaCubugu metin={ghost.yazilan} imlec={ghost.aktif && !ghost.tamamlandi} />
        </div>
        <button
          onPointerDown={() => dokun("arama-yapildi")}
          onClick={ara}
          disabled={!ghost.tamamlandi}
          className="mt-[18px] rounded-[7px] px-[17px] py-[8px] text-[13px] font-medium"
          style={{
            background: "var(--zemin-ikincil)",
            border: "1px solid var(--ayrac)",
            color: "var(--metin)",
            opacity: ghost.tamamlandi ? 1 : 0.4,
          }}
        >
          {MARKA.ad}'ta ara
        </button>
        {arama !== null && arama.veri.oneriler.length > 0 && !ghost.aktif && (
          <div className="mt-[22px] w-full">
            {arama.veri.oneriler.slice(0, 3).map((o) => (
              <div
                key={o}
                className="flex items-center gap-[10px] py-[7px] text-[13px]"
                style={{ color: "var(--metin-soluk)" }}
              >
                <Buyutec boyut={13} />
                <span className="truncate">{o}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {klavyeGoster && (
        <Klavye onTus={ghost.tusaBas} onGeriAl={ghost.geriAl} etkin={!ghost.tamamlandi} />
      )}
    </div>
  );
}

const SEKME_ADLARI: Array<{ id: "sonuclar" | "gorseller"; ad: string }> = [
  { id: "sonuclar", ad: "Tümü" },
  { id: "gorseller", ad: "Görseller" },
];

function SonucEkrani({
  arama,
  sekme,
  sekmeSec,
  basaDon,
}: {
  arama: GorunenArama | null;
  sekme: "sonuclar" | "gorseller";
  sekmeSec: (e: Ekran) => void;
  basaDon: () => void;
}) {
  const { dokun } = useSahne();

  if (arama === null) {
    return <div className="h-full" style={{ background: "var(--zemin)" }} />;
  }

  return (
    <div className="flex h-full flex-col" style={{ background: "var(--zemin)" }}>
      <header
        className="shrink-0 px-[13px] pb-[6px] pt-[10px]"
        style={{ borderBottom: "1px solid var(--ayrac)" }}
      >
        <div className="flex items-center gap-[11px]">
          <button onClick={basaDon} aria-label={`${MARKA.ad} ana sayfa`} className="shrink-0">
            <Logo boyut={17} />
          </button>
          <AramaCubugu metin={arama.veri.sorgu} imlec={false} />
        </div>
        <div className="mt-[8px] flex gap-[19px] text-[13px]">
          {SEKME_ADLARI.map((s) => {
            const etkin = s.id === sekme;
            return (
              <button
                key={s.id}
                onClick={() => sekmeSec(s.id)}
                className="pb-[6px]"
                style={{
                  color: etkin ? MARKA.renk : "var(--metin-soluk)",
                  borderBottom: etkin ? `2px solid ${MARKA.renk}` : "2px solid transparent",
                  fontWeight: etkin ? 600 : 400,
                }}
              >
                {s.ad}
              </button>
            );
          })}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        {sekme === "gorseller" ? (
          <GorselSonuclar gorseller={arama.veri.gorseller} sorgu={arama.veri.sorgu} />
        ) : (
          <>
            {arama.veri.bilgi !== undefined && (
              <div className="px-[15px] pb-[4px] pt-[9px] text-[11px]" style={{ color: "var(--metin-soluk)" }}>
                {arama.veri.bilgi}
              </div>
            )}
            {arama.veri.sonuclar.map((s, i) => (
              <SonucSatiri key={i} sonuc={s} onDokun={() => dokun(`arama-sonuc-${i + 1}`)} />
            ))}
            {arama.veri.oneriler.length > 0 && (
              <div className="px-[15px] py-[15px]" style={{ borderTop: "1px solid var(--ayrac)" }}>
                <div className="mb-[9px] text-[14px] font-medium">İlgili aramalar</div>
                {arama.veri.oneriler.map((o) => (
                  <div
                    key={o}
                    className="flex items-center gap-[10px] py-[7px] text-[13px]"
                    style={{ color: "var(--metin-soluk)" }}
                  >
                    <Buyutec boyut={13} />
                    <span className="truncate">{o}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SonucSatiri({ sonuc, onDokun }: { sonuc: AramaSonucu; onDokun: () => void }) {
  return (
    <button
      onPointerDown={onDokun}
      className="flex w-full items-start gap-[11px] px-[15px] py-[12px] text-left"
      style={{ borderBottom: "1px solid var(--ayrac)" }}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px]" style={{ color: "var(--metin-soluk)" }}>
          {sonuc.adres}
        </div>
        <div className="mt-[2px] text-[15px] leading-snug" style={{ color: MARKA.renkAcik }}>
          {sonuc.baslik}
        </div>
        {sonuc.ozet !== "" && (
          <div className="mt-[3px] text-[12px] leading-snug" style={{ color: "var(--metin-soluk)" }}>
            {sonuc.ozet}
          </div>
        )}
      </div>
      {sonuc.gorsel !== undefined && (
        <Medya
          kaynak={`/ornek/${sonuc.gorsel}`}
          alt=""
          className="mt-[2px] w-[68px] shrink-0 rounded-[7px]"
          style={{ aspectRatio: "1 / 1", color: "var(--metin)" }}
        />
      )}
    </button>
  );
}

function GorselSonuclar({ gorseller, sorgu }: { gorseller: string[]; sorgu: string }) {
  if (gorseller.length === 0) {
    return (
      <div className="px-[15px] py-[19px] text-[13px]" style={{ color: "var(--metin-soluk)" }}>
        Görsel sonuç yok.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-[3px] p-[3px]">
      {gorseller.map((g, i) => (
        <Medya
          key={`${g}-${i}`}
          kaynak={`/ornek/${g}`}
          alt={sorgu}
          className="w-full"
          style={{ aspectRatio: "1 / 1", color: "var(--metin)" }}
        />
      ))}
    </div>
  );
}
