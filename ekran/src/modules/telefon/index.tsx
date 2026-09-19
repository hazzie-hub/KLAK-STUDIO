"use client";

import { useEffect, useRef, useState } from "react";

import { useSahne } from "@/engine";
import type { AramaKaydi, Cihaz } from "@/schema";
import { ARAMA_ZEMINI, Ahize, AramaDugmesi, sureMetni } from "@/shared/arama-parcalari";
import { useGhostTyping } from "@/shared/ghost-typing";
import { basHarf, rehberAdiMi, rehberSirala, useTelefonVeri } from "./veri";

/**
 * `telefon` modülü. CLAUDE.md §3.2
 *
 * Son aramalar, rehber, tuş takımı ve giden arama ekranı. Gelen arama bu
 * modülde DEĞİL, sistem katmanındadır (`src/system/arama-ekrani.tsx`):
 * hangi modül açık olursa olsun üstte görünmesi gerekir.
 *
 * Geçmiş ve rehber cihazdan gelir; sahne içinde gelen aramalar geçmişin
 * başına olaylardan türetilerek eklenir (bkz. `veri.ts`).
 */
type Ekran = "gecmis" | "rehber" | "tus";

const GHOST_HEDEF = "telefon-numara";

function ekranCoz(ad: string): Ekran {
  return ad === "rehber" || ad === "tus" ? ad : "gecmis";
}

const SEKMELER: Array<{ id: Ekran; ad: string }> = [
  { id: "gecmis", ad: "Son Aramalar" },
  { id: "rehber", ad: "Rehber" },
  { id: "tus", ad: "Tuş Takımı" },
];

export function TelefonModulu({
  baslangicEkrani,
  cihaz,
}: {
  baslangicEkrani: string;
  cihaz: Cihaz | null;
}) {
  const { dokun } = useSahne();
  const veri = useTelefonVeri(cihaz);
  const [ekran, setEkran] = useState<Ekran>(ekranCoz(baslangicEkrani));
  const [aranan, setAranan] = useState<{ ad: string; numara?: string } | null>(null);

  const ara = (ad: string, numara?: string) => {
    dokun("telefon-ara");
    setAranan({ ad, numara });
  };

  if (aranan !== null) {
    return <GidenArama ad={aranan.ad} numara={aranan.numara} bitir={() => setAranan(null)} />;
  }

  return (
    <div className="flex h-full flex-col" style={{ background: "var(--zemin)" }}>
      <div className="min-h-0 flex-1 overflow-auto">
        {ekran === "gecmis" && <Gecmis gecmis={veri.gecmis} ara={ara} />}
        {ekran === "rehber" && <Rehber rehber={veri.rehber} ara={ara} />}
        {ekran === "tus" && <TusTakimi ara={ara} />}
      </div>

      <nav
        className="flex shrink-0"
        style={{ background: "var(--zemin-ikincil)", borderTop: "1px solid var(--ayrac)" }}
      >
        {SEKMELER.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              // Sahne sekme değişimine tetik bağlayabilsin (örn. tuş takımı
              // açılınca numara yazılmaya başlasın).
              dokun(`telefon-${s.id}`);
              setEkran(s.id);
            }}
            className="flex-1 py-[9px] text-[11px]"
            style={{
              color: s.id === ekran ? "#0a84ff" : "var(--metin-soluk)",
              fontWeight: s.id === ekran ? 600 : 400,
            }}
          >
            {s.ad}
          </button>
        ))}
      </nav>
    </div>
  );
}

function YonIsareti({ yon }: { yon: AramaKaydi["yon"] }) {
  // Gelen: içeri dönük ok, giden: dışarı, cevapsız: kırmızı içeri.
  const kirmizi = yon === "cevapsiz";
  const disari = yon === "giden";
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden="true"
      className="shrink-0"
      style={{ color: kirmizi ? "#ff453a" : "var(--metin-soluk)" }}
    >
      <path
        d={disari ? "M2.5 9.5 9.5 2.5" : "M9.5 2.5 2.5 9.5"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d={disari ? "M5.5 2.5h4v4" : "M6.5 9.5h-4v-4"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function Gecmis({
  gecmis,
  ara,
}: {
  gecmis: TelefonKaydi[];
  ara: (ad: string, numara?: string) => void;
}) {
  return (
    <>
      <h1 className="px-[15px] pb-[9px] pt-[15px] text-[26px] font-bold tracking-tight">
        Son Aramalar
      </h1>
      {gecmis.length === 0 && (
        <p className="px-[15px] py-[11px] text-[13px]" style={{ color: "var(--metin-soluk)" }}>
          Arama geçmişi yok.
        </p>
      )}
      {gecmis.map((k, i) => (
        <button
          key={i}
          onClick={() => ara(k.ad, k.numara)}
          className={`flex w-full items-center gap-[11px] px-[15px] py-[11px] text-left ${
            k.yeni ? "animate-[yorumGir_420ms_ease-out]" : ""
          }`}
          style={{ borderBottom: "1px solid var(--ayrac)" }}
        >
          <YonIsareti yon={k.yon} />
          <div className="min-w-0 flex-1">
            <div
              className="truncate text-[15px]"
              style={{ color: k.yon === "cevapsiz" ? "#ff453a" : "var(--metin)" }}
            >
              {k.ad}
            </div>
            <div className="truncate text-[12px]" style={{ color: "var(--metin-soluk)" }}>
              {k.yon === "cevapsiz" ? "Cevapsız" : k.yon === "giden" ? "Giden arama" : "Gelen arama"}
              {k.sure !== undefined && ` · ${k.sure}`}
            </div>
          </div>
          <span className="shrink-0 text-[12px]" style={{ color: "var(--metin-soluk)" }}>
            {k.zaman}
          </span>
        </button>
      ))}
    </>
  );
}

type TelefonKaydi = AramaKaydi & { yeni: boolean };

function Rehber({
  rehber,
  ara,
}: {
  rehber: Cihaz["rehber"];
  ara: (ad: string, numara?: string) => void;
}) {
  const sirali = rehberSirala(rehber);
  return (
    <>
      <h1 className="px-[15px] pb-[9px] pt-[15px] text-[26px] font-bold tracking-tight">Rehber</h1>
      {sirali.length === 0 && (
        <p className="px-[15px] py-[11px] text-[13px]" style={{ color: "var(--metin-soluk)" }}>
          Rehber boş.
        </p>
      )}
      {sirali.map((kisi) => (
        <button
          key={kisi.ad}
          onClick={() => ara(kisi.ad, kisi.numara)}
          className="flex w-full items-center gap-[11px] px-[15px] py-[9px] text-left"
          style={{ borderBottom: "1px solid var(--ayrac)" }}
        >
          <span
            className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full text-[14px] font-medium"
            style={{ background: "var(--zemin-ikincil)", color: "var(--metin-soluk)" }}
          >
            {basHarf(kisi.ad)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px]">{kisi.ad}</div>
            {kisi.numara !== undefined && (
              <div className="truncate text-[12px]" style={{ color: "var(--metin-soluk)" }}>
                {kisi.numara}
              </div>
            )}
          </div>
        </button>
      ))}
    </>
  );
}

const TUSLAR: Array<[string, string]> = [
  ["1", ""],
  ["2", "ABC"],
  ["3", "DEF"],
  ["4", "GHI"],
  ["5", "JKL"],
  ["6", "MNO"],
  ["7", "PQRS"],
  ["8", "TUV"],
  ["9", "WXYZ"],
  ["*", ""],
  ["0", "+"],
  ["#", ""],
];

function TusTakimi({ ara }: { ara: (ad: string, numara?: string) => void }) {
  const ghost = useGhostTyping(GHOST_HEDEF);
  const [elleYazilan, setElleYazilan] = useState("");

  // Sahne bir numara yazdırıyorsa o geçerli; yoksa basılan tuşlar yazılır.
  const numara = ghost.aktif ? ghost.yazilan : elleYazilan;

  const tusaBas = (tus: string) => {
    if (ghost.aktif) {
      ghost.tusaBas();
      return;
    }
    setElleYazilan((n) => (n.length >= 18 ? n : n + tus));
  };

  return (
    <div className="flex h-full flex-col items-center justify-end pb-[19px]">
      <div className="flex h-[58px] items-center text-[30px] font-light tracking-[0.02em]">
        {numara}
      </div>

      <div className="grid grid-cols-3 gap-x-[26px] gap-y-[13px] py-[15px]">
        {TUSLAR.map(([tus, harfler]) => (
          <button
            key={tus}
            onPointerDown={() => tusaBas(tus)}
            className="flex h-[64px] w-[64px] flex-col items-center justify-center rounded-full active:opacity-70"
            style={{ background: "var(--zemin-ikincil)" }}
          >
            <span className="text-[26px] font-light leading-none">{tus}</span>
            {harfler !== "" && (
              <span className="mt-[2px] text-[9px] tracking-[0.12em]" style={{ color: "var(--metin-soluk)" }}>
                {harfler}
              </span>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={() => numara !== "" && ara(numara)}
        disabled={numara === ""}
        aria-label="Ara"
        className="mt-[7px] flex h-[64px] w-[64px] items-center justify-center rounded-full text-white active:opacity-80"
        style={{ background: "#34c759", opacity: numara === "" ? 0.35 : 1 }}
      >
        <Ahize />
      </button>
    </div>
  );
}

function KisiIkonu() {
  return (
    <svg width="46" height="46" viewBox="0 0 24 24" aria-hidden="true" style={{ opacity: 0.75 }}>
      <circle cx="12" cy="8.2" r="3.9" fill="#fff" />
      <path d="M4.4 20.2c0-4 3.4-6.4 7.6-6.4s7.6 2.4 7.6 6.4Z" fill="#fff" />
    </svg>
  );
}

/** Giden arama ekranı — gelen aramanın aynası. */
function GidenArama({
  ad,
  numara,
  bitir,
}: {
  ad: string;
  numara?: string;
  bitir: () => void;
}) {
  const [saniye, setSaniye] = useState(0);
  const [baglandi, setBaglandi] = useState(false);
  const zamanlayiciRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rehberdeMi = rehberAdiMi(ad);

  // "Aranıyor…" birkaç saniye sürer, sonra sayaç başlar. Süre sabit:
  // sahne her tekrarda birebir aynı olmalı (CLAUDE.md §2.4).
  useEffect(() => {
    zamanlayiciRef.current = setTimeout(() => setBaglandi(true), 3000);
    return () => {
      if (zamanlayiciRef.current !== null) clearTimeout(zamanlayiciRef.current);
    };
  }, []);

  useEffect(() => {
    if (!baglandi) return;
    const z = setInterval(() => setSaniye((n) => n + 1), 1000);
    return () => clearInterval(z);
  }, [baglandi]);

  return (
    <div
      className="absolute inset-0 z-[50] flex flex-col items-center text-white"
      style={{ background: ARAMA_ZEMINI }}
    >
      <div className="mt-[16%] flex flex-col items-center px-8 text-center">
        <div className="flex h-[104px] w-[104px] items-center justify-center rounded-full bg-white/15 text-[38px] font-light">
          {rehberdeMi ? basHarf(ad) : <KisiIkonu />}
        </div>
        <div className="mt-[18px] text-[30px] font-light leading-tight">{ad}</div>
        {/* Bağlanınca sayaç; bağlanmadan önce varsa numara. Numara yoksa bu
            satır hiç çizilmez, yoksa alttaki "aranıyor…" iki kez görünür. */}
        {(baglandi || numara !== undefined) && (
          <div className="mt-[5px] text-[15px] opacity-65">
            {baglandi ? sureMetni(saniye) : numara}
          </div>
        )}
        {!baglandi && <div className="mt-[3px] text-[14px] opacity-45">aranıyor…</div>}
      </div>

      <div className="mb-[13%] mt-auto flex w-full items-center justify-center px-12">
        <AramaDugmesi renk="#ff3b30" etiket="Bitir" onBas={bitir}>
          <Ahize kapali />
        </AramaDugmesi>
      </div>
    </div>
  );
}
