"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Sahne } from "@/schema";
import { kanalAc, type Kanal } from "./kanal";
import { NonceDefteri, nonceUret, type KumandaMesaji, type MesajGirdisi } from "./mesaj";

/** Oynatıcıdan bu kadar süredir ses çıkmadıysa çevrimdışı sayılır. */
const SESSIZLIK_SINIRI = 6000;
const ADIM = 250;
/** Yerel gecikme tahminini bu kadar süre sonra bırakıp oynatıcınınkine döneriz. */
const YEREL_OMRU = 6000;

type OynaticiDurumu = {
  olanlar: string[];
  siradaki: { olayId: string; kalan: number } | null;
  gecikmeler: Record<string, number>;
  pil: number;
  sonDuyum: number;
};

/**
 * Kumanda. CLAUDE.md §6
 *
 * Operatörün kendi telefonunda açılır. Oyuncunun elindeki cihaza hiç
 * dokunmadan sahneyi yönetir: olayları tetikler, gecikme ayarlar, başa sarar.
 *
 * Bağlantı koparsa oynatıcı süreli tetikleriyle devam eder; burada sadece
 * "çevrimdışı" yazar.
 */
export function Kumanda({ sahne }: { sahne: Sahne }) {
  const [oynatici, setOynatici] = useState<OynaticiDurumu | null>(null);
  const [kanalBagli, setKanalBagli] = useState(false);
  const [kanalTuru, setKanalTuru] = useState<Kanal["tur"]>("yerel");
  const [simdi, setSimdi] = useState(() => Date.now());
  /**
   * Gecikmenin YEREL tahmini. Oynatıcı durumunu 2 saniyede bir yayınlıyor;
   * operatör arka arkaya bastığında hepsi aynı eski değeri okuyup aynı komutu
   * gönderiyordu (üç basış tek adım ediyordu). Basar basmaz burada ilerletip
   * oynatıcı doğrulayınca bırakıyoruz.
   */
  const [yerelGecikme, setYerelGecikme] = useState<Record<string, { deger: number; zaman: number }>>(
    {},
  );
  const kanalRef = useRef<Kanal | null>(null);

  useEffect(() => {
    const defter = new NonceDefteri();
    const kanal = kanalAc({
      sahneKodu: sahne.kod,
      onBaglanti: setKanalBagli,
      onMesaj: (mesaj) => {
        if (mesaj.tur !== "buradayim") return;
        if (!defter.yeniMi(mesaj.nonce)) return;
        setOynatici({
          olanlar: mesaj.olanlar,
          siradaki: mesaj.siradaki,
          gecikmeler: mesaj.gecikmeler,
          pil: mesaj.pil,
          sonDuyum: Date.now(),
        });
        // Oynatıcı bizim tahminimizi doğruladıysa (ya da tahmin eskidiyse) bırak.
        setYerelGecikme((o) => {
          const yeni: typeof o = {};
          const su = Date.now();
          for (const [id, kayit] of Object.entries(o)) {
            const dogrulandi = mesaj.gecikmeler[id] === kayit.deger;
            const eskidi = su - kayit.zaman > YEREL_OMRU;
            if (!dogrulandi && !eskidi) yeni[id] = kayit;
          }
          return yeni;
        });
      },
    });
    kanalRef.current = kanal;
    setKanalTuru(kanal.tur);

    kanal.gonder({ tur: "yoklama", nonce: nonceUret(), zaman: Date.now() });
    const yoklama = setInterval(() => {
      kanal.gonder({ tur: "yoklama", nonce: nonceUret(), zaman: Date.now() });
    }, 3000);
    const saat = setInterval(() => setSimdi(Date.now()), 250);

    return () => {
      clearInterval(yoklama);
      clearInterval(saat);
      kanal.kapat();
      kanalRef.current = null;
    };
  }, [sahne.kod]);

  const gonder = useCallback((mesaj: MesajGirdisi) => {
    kanalRef.current?.gonder({
      ...mesaj,
      nonce: nonceUret(),
      zaman: Date.now(),
    } as KumandaMesaji);
  }, []);

  const gecikmeDegistir = useCallback(
    (olayId: string, yeni: number) => {
      setYerelGecikme((o) => ({ ...o, [olayId]: { deger: yeni, zaman: Date.now() } }));
      gonder({ tur: "gecikme", olayId, gecikme: yeni });
    },
    [gonder],
  );

  const cevrimici = oynatici !== null && simdi - oynatici.sonDuyum < SESSIZLIK_SINIRI;
  const olanlar = new Set(oynatici?.olanlar ?? []);
  const sonOlay = oynatici?.olanlar.at(-1) ?? null;
  const kalanSn =
    oynatici?.siradaki === null || oynatici?.siradaki === undefined
      ? null
      : Math.max(0, oynatici.siradaki.kalan - (simdi - oynatici.sonDuyum)) / 1000;

  return (
    <main className="min-h-dvh bg-[#0e0e10] pb-8 text-white/90">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0e0e10]/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <div className="truncate text-[17px] font-semibold text-white">{sahne.kod}</div>
            <div className="truncate text-[12px] text-white/45">{sahne.cihaz}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span
              className={`h-[9px] w-[9px] rounded-full ${cevrimici ? "bg-emerald-400" : "bg-red-400"}`}
              aria-hidden="true"
            />
            <span className="text-[13px]">{cevrimici ? "çevrimiçi" : "çevrimdışı"}</span>
          </div>
        </div>

        <div className="mt-[7px] flex items-center gap-3 text-[12px] text-white/45">
          <span>{kanalTuru === "supabase" ? "Supabase" : "aynı cihaz (yerel)"}</span>
          {kanalTuru === "supabase" && <span>{kanalBagli ? "kanal açık" : "kanal kapalı"}</span>}
          {cevrimici && <span className="ml-auto">pil %{oynatici?.pil}</span>}
        </div>
      </header>

      <div className="px-4">
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <div className="text-[12px] text-white/45">Sıradaki</div>
          {oynatici?.siradaki != null ? (
            <div className="mt-[3px] flex items-baseline gap-2">
              <span className="text-[16px] font-semibold text-amber-300">
                {oynatici.siradaki.olayId}
              </span>
              <span className="ml-auto text-[15px] tabular-nums text-white/70">
                {kalanSn === null ? "" : `${kalanSn.toFixed(1)} sn`}
              </span>
            </div>
          ) : (
            <div className="mt-[3px] text-[15px] text-white/35">— bekleyen olay yok</div>
          )}
          <div className="mt-[9px] border-t border-white/10 pt-[9px] text-[12px] text-white/45">
            Son tetiklenen:{" "}
            <span className="text-emerald-300">{sonOlay ?? "— henüz yok"}</span>
          </div>
        </div>

        <button
          onClick={() => gonder({ tur: "basaSar" })}
          className="mt-3 w-full rounded-2xl bg-white/15 py-[15px] text-[16px] font-semibold active:bg-white/25"
        >
          Başa sar
        </button>

        <h2 className="mb-2 mt-5 text-[12px] uppercase tracking-wide text-white/35">Olaylar</h2>
        <div className="flex flex-col gap-2">
          {sahne.olaylar.map((olay) => {
            const oldu = olanlar.has(olay.id);
            const sirada = oynatici?.siradaki?.olayId === olay.id;
            // Oynatıcıdan gelen GEÇERLİ gecikme; yoksa sahnedeki.
            const sahnedekiGecikme =
              olay.tetik.tur === "baslangic" || olay.tetik.tur === "sonra"
                ? olay.tetik.gecikme
                : null;
            const sureli = sahnedekiGecikme !== null;
            const gecikme =
              yerelGecikme[olay.id]?.deger ??
              oynatici?.gecikmeler[olay.id] ??
              sahnedekiGecikme ??
              0;
            return (
              <div
                key={olay.id}
                className={`rounded-2xl border px-4 py-[13px] ${
                  sirada
                    ? "border-amber-400/55 bg-amber-400/10"
                    : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <button
                  onClick={() => gonder({ tur: "tetikle", olayId: olay.id })}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[16px] font-medium text-white">{olay.ad}</div>
                    <div className="truncate text-[12px] text-white/45">
                      {olay.id}
                      {oldu && <span className="text-emerald-300"> · oldu</span>}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-xl bg-sky-500/35 px-4 py-[10px] text-[15px] font-semibold">
                    Şimdi
                  </span>
                </button>

                {sureli && (
                  <div className="mt-[11px] flex items-center gap-2 border-t border-white/10 pt-[11px]">
                    <span className="text-[12px] text-white/45">gecikme</span>
                    <button
                      onClick={() => gecikmeDegistir(olay.id, Math.max(0, gecikme - ADIM))}
                      className="rounded-lg bg-white/10 px-4 py-[7px] text-[16px] active:bg-white/20"
                    >
                      −
                    </button>
                    <span className="min-w-[66px] text-center text-[14px] tabular-nums">
                      {(gecikme / 1000).toFixed(2)} sn
                    </span>
                    <button
                      onClick={() => gecikmeDegistir(olay.id, gecikme + ADIM)}
                      className="rounded-lg bg-white/10 px-4 py-[7px] text-[16px] active:bg-white/20"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-5 text-[12px] leading-relaxed text-white/35">
          Gecikmeler oynatıcıdan canlı okunur. Bağlantı koparsa oynatıcı kendi
          süreleriyle oynamaya devam eder — hiçbir şey kilitlenmez.
        </p>
      </div>
    </main>
  );
}
