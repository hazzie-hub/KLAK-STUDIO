"use client";

import { useDurum } from "@/durum";
import { useSkin } from "@/shell";
import { BildirimKarti, useBildirimler } from "@/system";

/**
 * `kilit` modülü — kilit ekranı ve üzerindeki bildirimler. CLAUDE.md §3.2
 *
 * Bildirimler burada banner olarak düşmez, listede birikir; gerçek
 * telefonlarda kilit ekranı böyle davranır.
 */
export function KilitModulu({ duvarKagidi }: { duvarKagidi?: string }) {
  const skin = useSkin();
  const { durum } = useDurum();
  const bildirimler = useBildirimler();

  const kaynak = duvarKagidi ?? "gece-sahil";

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Duvar kâğıdı: Medya bileşeninden GEÇMEZ — bu cihazın kendi arka planı,
          internetten gelen bir içerik değil, "yavaş yüklenmesi" anlamsız olur. */}
      <img
        src={`/duvar/${kaynak}.svg`}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.12)" }} />

      {/* İçerik durum çubuğunun altından geçiyor; payları buradan veriyoruz. */}
      <div
        className="relative flex h-full flex-col px-[14px] text-white"
        style={{
          paddingTop: "var(--durum-cubugu-yukseklik)",
          paddingBottom: "var(--alt-cubuk-yukseklik)",
        }}
      >
        {skin === "ios" ? (
          <div className="pt-[14px] text-center" style={{ textShadow: "0 1px 12px rgba(0,0,0,0.3)" }}>
            <div className="text-[15px] font-medium opacity-90">{durum.tarih}</div>
            <div className="mt-[-4px] text-[74px] font-semibold leading-[1.06] tracking-[-0.02em] tabular-nums">
              {durum.saat}
            </div>
          </div>
        ) : (
          <div className="pt-[26px] text-center" style={{ textShadow: "0 1px 12px rgba(0,0,0,0.3)" }}>
            <div className="text-[64px] font-light leading-none tabular-nums">{durum.saat}</div>
            <div className="mt-[6px] text-[14px] opacity-90">{durum.tarih}</div>
          </div>
        )}

        <div className="mt-[26px] flex flex-col gap-[7px] overflow-auto">
          {bildirimler.map((b) => (
            <BildirimKarti key={b.anahtar} bildirim={b} saat={durum.saat} />
          ))}
        </div>

        <div className="mt-auto pb-[14px] text-center text-[13px] opacity-70">
          {skin === "ios" ? "Kilidi açmak için yukarı kaydır" : "Kilidi açmak için yukarı kaydır"}
        </div>
      </div>
    </div>
  );
}
