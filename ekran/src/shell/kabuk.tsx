import type { ReactNode } from "react";

import type { Skin } from "@/schema";
import { DurumCubugu } from "./durum-cubugu";
import { GezinmeCubugu } from "./gezinme-cubugu";
import { Pencere } from "./pencere";
import { SkinSaglayici } from "./skin-baglami";
import { temaStili } from "./temalar";

/**
 * Cihaz kabuğu — oynatıcının en alt katmanı. CLAUDE.md §3.1
 *
 * Durum değerlerini prop olarak almaz; cihaz durumu katmanından okunur
 * (bkz. `src/durum`), böylece sahne içinde değiştiğinde kendiliğinden güncellenir.
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
  onizleme = false,
  ustKatman = "koyu",
  icerikUste = false,
  adresMetni,
  sekmeBasligi,
  children,
}: {
  skin: Skin;
  onizleme?: boolean;
  /** Durum çubuğu ve alt çubuk yazısının rengi. Koyu duvar kâğıdı üstünde "acik". */
  ustKatman?: "koyu" | "acik";
  /** İçerik durum çubuğunun ALTINDAN geçsin mi? Kilit ekranı gibi tam ekranlarda evet. */
  icerikUste?: boolean;
  adresMetni?: string;
  sekmeBasligi?: string;
  children: ReactNode;
}) {
  const icerik =
    skin === "desktop" ? (
      <Pencere adresMetni={adresMetni} sekmeBasligi={sekmeBasligi}>
        {children}
      </Pencere>
    ) : icerikUste ? (
      // İçerik tüm ekranı kaplar; çubuklar üstüne biner (kilit ekranı, tam ekran fotoğraf).
      <div className="relative h-full w-full overflow-hidden" style={{ background: "var(--zemin)" }}>
        <div className="absolute inset-0">{children}</div>
        {onizleme && <Centik skin={skin} />}
        <div className="absolute inset-x-0 top-0">
          <DurumCubugu skin={skin} cerceveli={onizleme} yazi={ustKatman} />
        </div>
        <div className="absolute inset-x-0 bottom-0">
          <GezinmeCubugu skin={skin} cerceveli={onizleme} yazi={ustKatman} />
        </div>
      </div>
    ) : (
      <div className="flex h-full w-full flex-col" style={{ background: "var(--zemin)" }}>
        {onizleme && <Centik skin={skin} />}
        <DurumCubugu skin={skin} cerceveli={onizleme} yazi={ustKatman} />
        <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
        <GezinmeCubugu skin={skin} cerceveli={onizleme} yazi={ustKatman} />
      </div>
    );

  const sarilmis = <SkinSaglayici skin={skin}>{icerik}</SkinSaglayici>;

  if (!onizleme) {
    return (
      <div
        data-oynatici
        className="fixed inset-0 overflow-hidden"
        style={{ ...temaStili(skin), fontFamily: "var(--yazi-tipi)", background: "var(--zemin)" }}
      >
        {sarilmis}
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
        data-oynatici
        className="relative overflow-hidden shadow-2xl"
        style={{
          height: olculer.yukseklik,
          aspectRatio: olculer.oran,
          borderRadius: olculer.yaricap,
          border: olculer.cerceve,
          background: "var(--zemin)",
        }}
      >
        {sarilmis}
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
