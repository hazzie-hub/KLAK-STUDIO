"use client";

import { useEffect, useMemo } from "react";

import { useKutuphane } from "@/icerik/kutuphane";
import type { WebSayfasiVerisi } from "@/schema";
import { useSkin, useTarayici } from "@/shell";
import { Sablon } from "./sablonlar";

/**
 * `web` modülü — sahte web siteleri. CLAUDE.md §3.2
 *
 * Hangi sayfanın açık olduğu `ekranAc` ile gelir (arama sonucundan siteye
 * geçiş böyle olur, CLAUDE.md §3.3). Modül kendi gezinme geçmişini tutmaz:
 * ekran, gerçekleşen olaylardan türer.
 *
 * Adres çubuğu: desktop'ta kabuğun kurgusal tarayıcı penceresine yazılır
 * (`useTarayici`); telefonda o çerçeve olmadığı için modül kendi ince adres
 * şeridini çizer.
 */
export function WebModulu({ icerikRef }: { icerikRef?: string }) {
  const k = useKutuphane();
  const skin = useSkin();
  const { ayarla } = useTarayici();

  const sayfalar = useMemo(
    () =>
      [...k.icerikler.values()].flatMap((i) =>
        i.tur === "webSayfasi" ? [{ id: i.id, veri: i.veri }] : [],
      ),
    [k],
  );

  const sayfa = sayfalar.find((s) => s.id === icerikRef) ?? sayfalar[0] ?? null;

  // Adres çubuğu sayfayla birlikte değişsin.
  useEffect(() => {
    ayarla({ adres: sayfa?.veri.adres, baslik: sayfa?.veri.baslik });
  }, [ayarla, sayfa?.veri.adres, sayfa?.veri.baslik]);

  if (sayfa === null) {
    // CLAUDE.md §2.6: kamerada hata yazısı görünmez, boş sayfa görünür.
    return <div className="h-full" style={{ background: "var(--zemin)" }} />;
  }

  return (
    <div className="flex h-full flex-col" style={{ background: "var(--zemin)" }}>
      {skin !== "desktop" && <TelefonAdresSeridi veri={sayfa.veri} />}
      <div className="min-h-0 flex-1 overflow-auto">
        <Sablon veri={sayfa.veri} />
      </div>
    </div>
  );
}

/** Telefon tarayıcısının üst şeridi — sadece adres, düğme yok. */
function TelefonAdresSeridi({ veri }: { veri: WebSayfasiVerisi }) {
  return (
    <div
      className="flex shrink-0 items-center gap-[7px] px-[13px] py-[7px]"
      style={{ background: "var(--zemin-ikincil)", borderBottom: "1px solid var(--ayrac)" }}
    >
      <Kilit />
      <span className="truncate text-[12px]" style={{ color: "var(--metin-soluk)" }}>
        {veri.adres}
      </span>
    </div>
  );
}

function Kilit() {
  return (
    <svg width="10" height="11" viewBox="0 0 11 12" aria-hidden="true" className="shrink-0" style={{ color: "var(--metin-soluk)" }}>
      <rect x="1" y="5" width="9" height="6.4" rx="1.6" fill="currentColor" />
      <path d="M3.2 5V3.4a2.3 2.3 0 0 1 4.6 0V5" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  );
}
