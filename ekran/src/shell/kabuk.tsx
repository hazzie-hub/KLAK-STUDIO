import type { ReactNode } from "react";

import type { Skin } from "@/schema";
import { DurumCubugu } from "./durum-cubugu";
import { GezinmeCubugu } from "./gezinme-cubugu";
import type { GorunenDurum } from "./gorunen-durum";
import { Pencere } from "./pencere";
import { temaStili } from "./temalar";

/**
 * Cihaz kabuğu — oynatıcının en alt katmanı. CLAUDE.md §3.1
 *
 * İKİ MOD:
 *  - Sette (varsayılan): ekranı tamamen doldurur. Çentik ÇİZİLMEZ, çünkü
 *    gerçek cihazın çentiği zaten fiziksel olarak oradadır; çizersek iki tane olur.
 *    Durum çubuğu `env(safe-area-inset-*)` ile gerçek çentiğin yanına yerleşir.
 *  - Önizleme (`?onizleme=1`): bilgisayarda bakarken cihaz şeklinde bir çerçeve
 *    çizer, çentiği/kamera deliğini de gösterir. Sadece bizim içindir.
 */
export function Kabuk({
  skin,
  durum,
  onizleme = false,
  adresMetni,
  sekmeBasligi,
  children,
}: {
  skin: Skin;
  durum: GorunenDurum;
  onizleme?: boolean;
  adresMetni?: string;
  sekmeBasligi?: string;
  children: ReactNode;
}) {
  const icerik =
    skin === "desktop" ? (
      <Pencere adresMetni={adresMetni} sekmeBasligi={sekmeBasligi}>
        {children}
      </Pencere>
    ) : (
      <div className="flex h-full w-full flex-col" style={{ background: "var(--zemin)" }}>
        {onizleme && <Centik skin={skin} />}
        <DurumCubugu skin={skin} durum={durum} cerceveli={onizleme} />
        <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
        <GezinmeCubugu skin={skin} cerceveli={onizleme} />
      </div>
    );

  if (!onizleme) {
    return (
      <div
        className="fixed inset-0 overflow-hidden"
        style={{ ...temaStili(skin), fontFamily: "var(--yazi-tipi)", background: "var(--zemin)" }}
      >
        {icerik}
      </div>
    );
  }

  const olculer = onizlemeOlculeri(skin);
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-[#1c1c1e] p-6"
      style={{ ...temaStili(skin), fontFamily: "var(--yazi-tipi)" }}
    >
      <div
        className="relative overflow-hidden shadow-2xl"
        style={{
          height: olculer.yukseklik,
          aspectRatio: olculer.oran,
          borderRadius: olculer.yaricap,
          border: olculer.cerceve,
          background: "var(--zemin)",
        }}
      >
        {icerik}
      </div>
    </div>
  );
}

function onizlemeOlculeri(skin: Skin) {
  switch (skin) {
    case "ios":
      return { yukseklik: "min(844px, 86vh)", oran: "390 / 844", yaricap: "46px", cerceve: "10px solid #0b0b0d" };
    case "android":
      return { yukseklik: "min(915px, 86vh)", oran: "412 / 915", yaricap: "34px", cerceve: "8px solid #0b0b0d" };
    case "desktop":
      return { yukseklik: "min(800px, 86vh)", oran: "1280 / 800", yaricap: "10px", cerceve: "1px solid #3a3a3c" };
  }
}

/** Sadece önizlemede çizilir — gerçek cihazda donanım zaten oradadır. */
function Centik({ skin }: { skin: Skin }) {
  if (skin === "ios") {
    return (
      <div className="pointer-events-none absolute left-1/2 top-[11px] z-40 h-[32px] w-[118px] -translate-x-1/2 rounded-full bg-black" />
    );
  }
  return (
    <div className="pointer-events-none absolute left-1/2 top-[8px] z-40 h-[11px] w-[11px] -translate-x-1/2 rounded-full bg-black" />
  );
}
