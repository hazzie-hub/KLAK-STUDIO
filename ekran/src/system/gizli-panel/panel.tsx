"use client";

import { useDurum } from "@/durum";
import { useSahne } from "@/engine";
import type { BaglantiProfili, GorselYukleme, Skin } from "@/schema";
import { useHazirlik } from "@/platform/hazirlik";
import { useSkin } from "@/shell";

/** Gecikme ayar adımı. CLAUDE.md §6 */
const ADIM = 250;

/**
 * Gizli ayar paneli. CLAUDE.md §6
 *
 * Operatörün sette kullandığı yer: olayları elle tetikle, gecikmeleri ayarla,
 * cihaz durumunu değiştir, başa sar.
 *
 * "Bu ayarları kalıcı yap" burada YOK — Stüdyo'ya geri yazması gerekiyor,
 * Stüdyo Faz 4'te geliyor. Çalışmayan buton koymak sette yanıltır.
 */
export function GizliPanel({ kapat }: { kapat: () => void }) {
  const { sahne, olanlar, bekleyenler, siradaki, elleTetikle, dokun, basaSar, gecikmeAl, gecikmeAyarla } =
    useSahne();
  const { durum, guncelle } = useDurum();
  const skin = useSkin();
  const hazirlik = useHazirlik();

  const gerceklesenler = new Set(olanlar.map((o) => o.id));
  const bekleyenKume = new Map(bekleyenler.map((b) => [b.olayId, b]));

  const dokunmaHedefleri = [
    ...new Set(sahne.olaylar.flatMap((o) => (o.tetik.tur === "dokunma" ? [o.tetik.hedef] : []))),
  ];

  const skinDegistir = (yeni: Skin) => {
    const u = new URL(window.location.href);
    u.searchParams.set("skin", yeni);
    window.location.href = u.toString();
  };

  return (
    <div className="absolute inset-0 z-[60] flex flex-col bg-[#0e0e10] text-[13px] text-white/90">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <div className="truncate font-semibold text-white">{sahne.kod}</div>
          <div className="truncate text-[11px] text-white/45">{sahne.cihaz} · {skin}</div>
        </div>
        <button
          onClick={basaSar}
          className="ml-auto rounded-lg bg-white/15 px-3 py-[7px] font-medium hover:bg-white/25"
        >
          Başa sar
        </button>
        <button
          onClick={kapat}
          aria-label="Paneli kapat"
          className="rounded-lg bg-white/10 px-3 py-[7px] hover:bg-white/20"
        >
          Kapat
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
        <Baslik>Sete hazır mı?</Baslik>
        <div
          className={`mb-1 rounded-xl border px-3 py-[10px] ${
            hazirlik.hazir && hazirlik.swDevrede
              ? "border-emerald-400/40 bg-emerald-400/10"
              : "border-amber-400/40 bg-amber-400/10"
          }`}
        >
          <div className="font-medium text-white">
            {hazirlik.hazir && hazirlik.swDevrede
              ? "Hazır — internet kesilebilir"
              : hazirlik.hazir
                ? "Görseller indi, ama çevrimdışı desteği yok"
                : "İndiriliyor…"}
          </div>
          <div className="mt-[2px] text-[11px] text-white/55">
            {hazirlik.inen}/{hazirlik.toplam} görsel ·{" "}
            {hazirlik.swDevrede ? "çevrimdışı hazır" : "çevrimdışı HAZIR DEĞİL"}
          </div>
          {!hazirlik.swDevrede && (
            <div className="mt-[6px] text-[11px] leading-snug text-white/45">
              Sayfayı bir kez yenileyin ve birkaç saniye bekleyin. iOS&apos;ta
              uygulamayı ana ekrana ekledikten sonra İNTERNETLİ olarak bir kez
              açın; çevrimdışı desteği o zaman kurulur.
            </div>
          )}
        </div>

        <Baslik>Olaylar</Baslik>
        <div className="flex flex-col gap-[6px]">
          {sahne.olaylar.map((olay) => {
            const bekliyor = bekleyenKume.get(olay.id);
            const oldu = gerceklesenler.has(olay.id);
            const sureli = olay.tetik.tur === "baslangic" || olay.tetik.tur === "sonra";
            const gecikme = gecikmeAl(olay.id);

            return (
              <div
                key={olay.id}
                className={`rounded-xl border px-3 py-[10px] ${
                  siradaki?.olayId === olay.id
                    ? "border-amber-400/50 bg-amber-400/10"
                    : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-white">{olay.ad}</div>
                    <div className="truncate text-[11px] text-white/45">
                      {olay.id} · {olay.tetik.tur}
                      {oldu && <span className="text-emerald-300"> · oldu</span>}
                      {bekliyor !== undefined && <span className="text-amber-300"> · bekliyor</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => elleTetikle(olay.id)}
                    className="shrink-0 rounded-lg bg-sky-500/30 px-3 py-[7px] font-medium hover:bg-sky-500/45"
                  >
                    Şimdi
                  </button>
                </div>

                {sureli && (
                  <div className="mt-[9px] flex items-center gap-2 border-t border-white/10 pt-[9px]">
                    <span className="text-[11px] text-white/45">gecikme</span>
                    <button
                      onClick={() => gecikmeAyarla(olay.id, gecikme - ADIM)}
                      disabled={gecikme <= 0}
                      className="rounded-md bg-white/10 px-[11px] py-1 disabled:opacity-30 hover:bg-white/20"
                    >
                      −
                    </button>
                    <span className="min-w-[62px] text-center tabular-nums">
                      {(gecikme / 1000).toFixed(2)} sn
                    </span>
                    <button
                      onClick={() => gecikmeAyarla(olay.id, gecikme + ADIM)}
                      className="rounded-md bg-white/10 px-[11px] py-1 hover:bg-white/20"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {dokunmaHedefleri.length > 0 && (
          <>
            <Baslik>Dokunma hedefleri</Baslik>
            <div className="flex flex-wrap gap-2">
              {dokunmaHedefleri.map((h) => (
                <button
                  key={h}
                  onClick={() => dokun(h)}
                  className="rounded-lg bg-white/10 px-3 py-[7px] hover:bg-white/20"
                >
                  {h}
                </button>
              ))}
            </div>
          </>
        )}

        <Baslik>Cihaz durumu</Baslik>
        <Satir etiket="Bağlantı">
          {(["normal", "yavas", "yok"] as BaglantiProfili[]).map((b) => (
            <Secim key={b} secili={durum.baglanti === b} onClick={() => guncelle({ baglanti: b })}>
              {b}
            </Secim>
          ))}
        </Satir>
        <Satir etiket="Görsel">
          {(["normal", "gec", "yuklenmez"] as GorselYukleme[]).map((g) => (
            <Secim key={g} secili={durum.gorsel === g} onClick={() => guncelle({ gorsel: g })}>
              {g}
            </Secim>
          ))}
        </Satir>
        <Satir etiket="Pil">
          {[100, 42, 20, 10, 5, 1, 0].map((p) => (
            <Secim key={p} secili={durum.pil === p} onClick={() => guncelle({ pil: p })}>
              %{p}
            </Secim>
          ))}
          <Secim secili={durum.sarjda} onClick={() => guncelle({ sarjda: !durum.sarjda })}>
            şarjda
          </Secim>
        </Satir>
        <Satir etiket="Kabuk">
          {(["ios", "android", "desktop"] as Skin[]).map((s) => (
            <Secim key={s} secili={skin === s} onClick={() => skinDegistir(s)}>
              {s}
            </Secim>
          ))}
        </Satir>
        <p className="mt-2 text-[11px] leading-snug text-white/35">
          Kabuk değiştirmek sayfayı yeniler ve sahneyi baştan başlatır. Gecikme
          ayarları başa sardıktan sonra da geçerli kalır.
        </p>
      </div>
    </div>
  );
}

function Baslik({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-[7px] mt-4 text-[11px] uppercase tracking-wide text-white/35 first:mt-0">
      {children}
    </div>
  );
}

function Satir({ etiket, children }: { etiket: string; children: React.ReactNode }) {
  return (
    <div className="mb-[7px] flex flex-wrap items-center gap-[6px]">
      <span className="w-[62px] shrink-0 text-[11px] text-white/45">{etiket}</span>
      {children}
    </div>
  );
}

function Secim({
  secili,
  onClick,
  children,
}: {
  secili: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-[11px] py-[6px] ${
        secili ? "bg-sky-500/45 text-white" : "bg-white/10 hover:bg-white/20"
      }`}
    >
      {children}
    </button>
  );
}
