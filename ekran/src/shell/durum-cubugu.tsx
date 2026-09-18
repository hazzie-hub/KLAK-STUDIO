"use client";

import { sinyalCubugu, useDurum } from "@/durum";
import { useHazirlik } from "@/platform/hazirlik";
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
  yazi = "koyu",
}: {
  skin: Skin;
  /** Önizleme çerçevesi içinde mi? Çentik payı buna göre verilir. */
  cerceveli: boolean;
  /** Koyu zemin (kilit ekranı, duvar kâğıdı) üstünde yazı beyaz olur. */
  yazi?: "koyu" | "acik";
}) {
  const { durum } = useDurum();
  const { isaretVer } = useHazirlik();

  if (skin === "desktop") return null;

  const cubuk = sinyalCubugu(durum.baglanti);
  const wifiAcik = durum.baglanti !== "yok";
  const renk = yazi === "acik" ? "#ffffff" : "var(--durum-cubugu-yazi)";
  const golge = yazi === "acik" ? "0 1px 6px rgba(0,0,0,0.35)" : undefined;

  if (skin === "ios") {
    return (
      <div
        className="relative z-30 flex shrink-0 items-end justify-between px-[26px] pb-[6px] text-[15px] font-semibold tabular-nums"
        style={{
          height: "var(--durum-cubugu-yukseklik)",
          color: renk,
          textShadow: golge,
          paddingTop: cerceveli ? "14px" : "max(14px, env(safe-area-inset-top))",
        }}
      >
        <span className="tracking-tight">
          <Saat saat={durum.saat} isaretVer={isaretVer} />
        </span>
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
        color: renk,
        textShadow: golge,
        paddingTop: cerceveli ? "0" : "env(safe-area-inset-top)",
      }}
    >
      <span>
        <Saat saat={durum.saat} isaretVer={isaretVer} />
      </span>
      <div className="flex items-center gap-[6px]">
        <WifiIkonu acik={wifiAcik} />
        <SinyalIkonu cubuk={cubuk} />
        <PilIkonu seviye={durum.pil} sarjda={durum.sarjda} skin={skin} />
      </div>
    </div>
  );
}

/**
 * Saat — hazır göstergesi burada. CLAUDE.md §6
 *
 * Tüm varlıklar önbelleğe alınınca iki nokta BİR KEZ yanıp söner. Operatör
 * bunu bilir; kameranın gördüğü şey normal bir saattir.
 */
function Saat({ saat, isaretVer }: { saat: string; isaretVer: boolean }) {
  const [sa, dk] = saat.split(":");
  return (
    <>
      {sa}
      <span className={isaretVer ? "animate-[hazirIsareti_900ms_ease-in-out]" : undefined}>:</span>
      {dk}
    </>
  );
}
