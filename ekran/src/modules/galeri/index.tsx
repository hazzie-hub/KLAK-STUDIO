"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useSahne } from "@/engine";
import { useKutuphane } from "@/icerik/kutuphane";
import { Medya } from "@/shared/medya";

/**
 * `galeri` modülü. CLAUDE.md §3.2
 *
 * Fotoğraf ızgarası ve tek fotoğraf ekranı. Fotoğraflar içerik
 * kütüphanesindeki `foto` kayıtlarından gelir; modül kendi listesini tutmaz.
 *
 * Mesajdaki ya da posttaki bir fotoğraftan buraya derin link verilebilir:
 * `ekranAc { modul: "galeri", ekran: "foto", icerikRef: "..." }`.
 */
type Ekran = "izgara" | "foto";

function ekranCoz(ad: string): Ekran {
  return ad === "foto" ? "foto" : "izgara";
}

export function GaleriModulu({
  baslangicEkrani,
  icerikRef,
}: {
  baslangicEkrani: string;
  icerikRef?: string;
}) {
  const { olanlar, dokun } = useSahne();
  const k = useKutuphane();

  const fotograflar = useMemo(
    () =>
      [...k.icerikler.values()].flatMap((i) =>
        i.tur === "foto" ? [{ id: i.id, veri: i.veri }] : [],
      ),
    [k],
  );

  const [ekran, setEkran] = useState<Ekran>(ekranCoz(baslangicEkrani));
  const [acik, setAcik] = useState<string | null>(icerikRef ?? null);

  // Derin link: `ekranAc` bu modülü hedeflerse oraya geç (CLAUDE.md §3.3).
  const islenenRef = useRef(0);
  useEffect(() => {
    if (olanlar.length === 0) {
      islenenRef.current = 0;
      return;
    }
    for (let i = islenenRef.current; i < olanlar.length; i++) {
      const a = olanlar[i]?.aksiyon;
      if (a?.tur === "ekranAc" && a.modul === "galeri") {
        setEkran(ekranCoz(a.ekran));
        if (a.icerikRef !== undefined) setAcik(a.icerikRef);
      }
    }
    islenenRef.current = olanlar.length;
  }, [olanlar]);

  const secili = fotograflar.find((f) => f.id === acik) ?? null;

  if (ekran === "foto" && secili !== null) {
    return (
      <div className="flex h-full flex-col" style={{ background: "#000" }}>
        <header className="flex h-[46px] shrink-0 items-center px-[13px]">
          <button
            onClick={() => {
              dokun("galeri-geri");
              setEkran("izgara");
            }}
            className="text-[14px] text-white/85"
          >
            ‹ Galeri
          </button>
          {secili.veri.tarih !== undefined && (
            <span className="ml-auto text-[12px] text-white/55">{secili.veri.tarih}</span>
          )}
        </header>

        <div className="flex min-h-0 flex-1 items-center justify-center px-[10px]">
          <Medya
            kaynak={`/ornek/${secili.veri.dosya}`}
            alt={secili.veri.aciklama ?? ""}
            className="max-h-full w-full"
            style={{ color: "#fff" }}
          />
        </div>

        {secili.veri.aciklama !== undefined && (
          <p className="shrink-0 px-[15px] pb-[17px] pt-[11px] text-[13px] leading-snug text-white/75">
            {secili.veri.aciklama}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" style={{ background: "var(--zemin)" }}>
      <header
        className="flex h-[52px] shrink-0 items-center px-[15px]"
        style={{ borderBottom: "1px solid var(--ayrac)" }}
      >
        <span className="text-[20px] font-semibold tracking-tight">Galeri</span>
        <span className="ml-auto text-[12px]" style={{ color: "var(--metin-soluk)" }}>
          {fotograflar.length} fotoğraf
        </span>
      </header>

      {fotograflar.length === 0 ? (
        <p className="px-[15px] py-[17px] text-[13px]" style={{ color: "var(--metin-soluk)" }}>
          Galeride fotoğraf yok.
        </p>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-[2px] overflow-auto p-[2px]">
          {fotograflar.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                dokun(`galeri-${f.id}`);
                setAcik(f.id);
                setEkran("foto");
              }}
              className="block w-full"
            >
              <Medya
                kaynak={`/ornek/${f.veri.dosya}`}
                alt={f.veri.aciklama ?? ""}
                className="w-full"
                style={{ aspectRatio: "1 / 1", color: "var(--metin)" }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
