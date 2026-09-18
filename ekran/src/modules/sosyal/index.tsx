"use client";

import { useEffect, useRef, useState } from "react";

import { markalar } from "@brands";
import { useSahne } from "@/engine";
import { useKutuphane } from "@/icerik/kutuphane";
import { useGhostTyping } from "@/shared/ghost-typing";
import { AktiviteEkrani, Feed, Kesfet, PostDetay, Profil, Yorumlar } from "./ekranlar";
import { GHOST_HEDEF, HOTSPOT } from "./hotspotlar";
import { Arti, Avatar, Buyutec, Ev, Kalp } from "./parcalar";
import { useSosyalVeri } from "./veri";
import { YuklemeAkisi } from "./yukle";

const MARKA = markalar.akis;

type Ekran = "feed" | "kesfet" | "aktivite" | "profil" | "post" | "yorumlar" | "yukle";

const SEKMELER: Ekran[] = ["feed", "kesfet", "yukle", "aktivite", "profil"];

/**
 * `sosyal` modülü — Akış. CLAUDE.md §3.2
 *
 * Ekranda ne varsa gerçekleşen olaylardan türer (bkz. `veri.ts`); modül kendi
 * sayacını ya da zamanlayıcısını tutmaz.
 */
export function SosyalModulu({ baslangicEkrani, hesapId }: { baslangicEkrani: string; hesapId?: string }) {
  const { sahne, olanlar, dokun } = useSahne();
  const kutuphane = useKutuphane();
  const veri = useSosyalVeri();

  const benimHesabim = hesapId ?? sahne.baslangic.hesap ?? kutuphane.postlar[0]?.veri.hesap ?? "";
  const [ekran, setEkran] = useState<Ekran>(ekranCoz(baslangicEkrani));
  const [param, setParam] = useState<string | null>(sahne.baslangic.icerikRef ?? null);

  const git = (yeni: string, yeniParam?: string) => {
    setEkran(ekranCoz(yeni));
    setParam(yeniParam ?? null);
  };

  // Derin link: `ekranAc` aksiyonu bu modülü hedeflerse oraya geç (CLAUDE.md §3.3).
  const islenenRef = useRef(0);
  useEffect(() => {
    if (olanlar.length === 0) {
      islenenRef.current = 0;
      return;
    }
    for (let i = islenenRef.current; i < olanlar.length; i++) {
      const a = olanlar[i]?.aksiyon;
      if (a?.tur === "ekranAc" && a.modul === "sosyal") {
        setEkran(ekranCoz(a.ekran));
        setParam(a.icerikRef ?? a.hesap ?? null);
      }
    }
    islenenRef.current = olanlar.length;
  }, [olanlar]);

  const govde = () => {
    switch (ekran) {
      case "kesfet":
        return <Kesfet veri={veri} git={git} />;
      case "aktivite":
        return <AktiviteEkrani veri={veri} />;
      case "profil":
        return <Profil hesapId={param ?? benimHesabim} veri={veri} git={git} />;
      case "post":
        return <PostDetay post={param === null ? null : veri.postAl(param)} git={git} geri={() => git("feed")} />;
      case "yorumlar":
        return (
          <Yorumlar
            post={param === null ? null : veri.postAl(param)}
            geri={() => git("feed")}
            benimHesabim={benimHesabim}
            gonderildi={yorumGonderildi}
          />
        );
      case "yukle":
        return <YuklemeAkisi kapat={() => git("feed")} />;
      default:
        return <Feed veri={veri} git={git} />;
    }
  };

  // Klavye açıkken alt sekme çubuğu görünmez — gerçek telefonlarda klavye onu örter.
  // Yorum listeye düştüğünde klavye kapanır, çubuk geri gelir.
  const yorumGhost = useGhostTyping(GHOST_HEDEF.yorum);
  const acikPost = ekran === "yorumlar" && param !== null ? veri.postAl(param) : null;
  const yorumGonderildi =
    yorumGhost.hedefMetin !== "" &&
    (acikPost?.yorumlar.some((y) => y.metin === yorumGhost.hedefMetin) ?? false);
  const klavyeAcik = ekran === "yorumlar" && yorumGhost.aktif && !yorumGonderildi;
  const sekmeGoster = ekran !== "yukle" && !klavyeAcik;

  return (
    <div className="flex h-full w-full flex-col" style={{ background: "var(--zemin)", color: "var(--metin)" }}>
      <div className="min-h-0 flex-1 overflow-hidden">{govde()}</div>

      {sekmeGoster && (
        <nav
          className="flex h-[49px] shrink-0 items-center justify-around"
          style={{ borderTop: "1px solid var(--ayrac)" }}
        >
          {SEKMELER.map((s) => (
            <button
              key={s}
              aria-label={s}
              onClick={() => {
                if (s === "yukle") dokun(HOTSPOT.postAkisiBasladi);
                git(s === "profil" ? "profil" : s, s === "profil" ? benimHesabim : undefined);
              }}
              style={{ color: ekran === s ? MARKA.renk : "var(--metin)" }}
            >
              {sekmeIkonu(s, ekran === s, kutuphane.hesap(benimHesabim))}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

function sekmeIkonu(sekme: Ekran, aktif: boolean, ben: ReturnType<ReturnType<typeof useKutuphane>["hesap"]>) {
  switch (sekme) {
    case "feed":
      return <Ev dolu={aktif} />;
    case "kesfet":
      return <Buyutec dolu={aktif} />;
    case "yukle":
      return <Arti />;
    case "aktivite":
      return <Kalp dolu={aktif} boyut={25} />;
    default:
      return <Avatar hesap={ben} boyut={25} />;
  }
}

function ekranCoz(ad: string): Ekran {
  const bilinen: Ekran[] = ["feed", "kesfet", "aktivite", "profil", "post", "yorumlar", "yukle"];
  return bilinen.includes(ad as Ekran) ? (ad as Ekran) : "feed";
}

export { HOTSPOT } from "./hotspotlar";
