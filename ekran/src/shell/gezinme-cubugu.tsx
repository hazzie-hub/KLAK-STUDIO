import type { Skin } from "@/schema";

/**
 * Alt gezinme çubuğu. CLAUDE.md §3.1
 * iOS: ana ekran çizgisi. Android: hareket çubuğu. Desktop: yok.
 */
export function GezinmeCubugu({
  skin,
  cerceveli,
  yazi = "koyu",
}: {
  skin: Skin;
  cerceveli: boolean;
  yazi?: "koyu" | "acik";
}) {
  if (skin === "desktop") return null;

  return (
    <div
      className="relative z-30 flex shrink-0 items-center justify-center"
      style={{
        height: "var(--alt-cubuk-yukseklik)",
        paddingBottom: cerceveli ? "0" : "env(safe-area-inset-bottom)",
      }}
    >
      <div
        className="rounded-full bg-current"
        style={{
          width: skin === "ios" ? "140px" : "108px",
          height: skin === "ios" ? "5px" : "3px",
          color: yazi === "acik" ? "#ffffff" : "var(--metin)",
          opacity: yazi === "acik" ? 0.75 : 0.3,
        }}
      />
    </div>
  );
}
