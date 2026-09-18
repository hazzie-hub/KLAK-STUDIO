"use client";

import { sinyalCubugu, useDurum } from "@/durum";
import type { Skin } from "@/schema";
import { PilIkonu, SinyalIkonu, WifiIkonu } from "./ikonlar";

/**
 * Durum çubuğu. CLAUDE.md §3.1
 *
 * Değerleri prop olarak almaz — cihaz durumu katmanından okur. Böylece
 * zaman çizelgesi pili ya da bağlantıyı değiştirdiğinde kendiliğinden güncellenir.
 * `desktop` kabuğunda durum çubuğu yoktur; onun yerine pencere çerçevesi gelir.
 */
export function DurumCubugu({
  skin,
  cerceveli,
}: {
  skin: Skin;
  /** Önizleme çerçevesi içinde mi? Çentik payı buna göre verilir. */
  cerceveli: boolean;
}) {
  const { durum } = useDurum();

  if (skin === "desktop") return null;

  const cubuk = sinyalCubugu(durum.baglanti);
  const wifiAcik = durum.baglanti !== "yok";

  if (skin === "ios") {
    return (
      <div
        className="relative z-30 flex shrink-0 items-end justify-between px-[26px] pb-[6px] text-[15px] font-semibold tabular-nums"
        style={{
          height: "var(--durum-cubugu-yukseklik)",
          color: "var(--durum-cubugu-yazi)",
          paddingTop: cerceveli ? "14px" : "max(14px, env(safe-area-inset-top))",
        }}
      >
        <span className="tracking-tight">{durum.saat}</span>
        <div className="flex items-center gap-[5px]">
          <SinyalIkonu cubuk={cubuk} />
          <WifiIkonu acik={wifiAcik} />
          <PilIkonu seviye={durum.pil} sarjda={durum.sarjda} skin={skin} />
        </div>
      </div>
    );
  }

  // android: saat solda, ikonlar sağda
  return (
    <div
      className="relative z-30 flex shrink-0 items-center justify-between px-4 text-[13px] font-medium tabular-nums"
      style={{
        height: "var(--durum-cubugu-yukseklik)",
        color: "var(--durum-cubugu-yazi)",
        paddingTop: cerceveli ? "0" : "env(safe-area-inset-top)",
      }}
    >
      <span>{durum.saat}</span>
      <div className="flex items-center gap-[6px]">
        <WifiIkonu acik={wifiAcik} />
        <SinyalIkonu cubuk={cubuk} />
        <PilIkonu seviye={durum.pil} sarjda={durum.sarjda} skin={skin} />
      </div>
    </div>
  );
}
