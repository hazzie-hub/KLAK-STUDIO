"use client";

import { useEffect, useRef, useState } from "react";

import { useSahne } from "@/engine";
import { useKutuphane } from "@/icerik/kutuphane";
import { ARAMA_ZEMINI, Ahize, AramaDugmesi, sureMetni } from "@/shared/arama-parcalari";
import { Medya } from "@/shared/medya";
import { useSkin } from "@/shell";

/**
 * Gelen arama ekranı. CLAUDE.md §3.1 (4. katman)
 *
 * Hangi modül açık olursa olsun her şeyin üstünü kaplar — gerçek telefonlarda
 * olduğu gibi. Oyuncu reddedince kapanır; kabul edince konuşma ekranına geçer.
 *
 * Kapanma oyuncunun dokunuşuyla olur ve olay listesinde iz bırakmaz; başa
 * sarınca `aramaGeldi` olayı yine listede olduğu için ekran tekrar açılır.
 */
export function AramaEkrani() {
  const { olanlar } = useSahne();
  const kutuphane = useKutuphane();
  const skin = useSkin();

  // Gerçekleşen son `aramaGeldi` olayı.
  let arama: { arayan: string; numara?: string; gorselRef?: string; anahtar: string } | null = null;
  olanlar.forEach((olay, i) => {
    if (olay.aksiyon.tur === "aramaGeldi") {
      arama = {
        arayan: olay.aksiyon.arayan,
        numara: olay.aksiyon.numara,
        gorselRef: olay.aksiyon.gorselRef,
        anahtar: `${olay.id}-${i}`,
      };
    }
  });

  const [kapatilan, setKapatilan] = useState<string | null>(null);
  const [konusuluyor, setKonusuluyor] = useState(false);
  const [saniye, setSaniye] = useState(0);
  const oncekiRef = useRef<string | null>(null);

  const anahtar = arama === null ? null : (arama as { anahtar: string }).anahtar;

  // Yeni arama gelince (ya da başa sarınca) durum sıfırlanır.
  useEffect(() => {
    if (oncekiRef.current !== anahtar) {
      oncekiRef.current = anahtar;
      setKapatilan(null);
      setKonusuluyor(false);
      setSaniye(0);
    }
  }, [anahtar]);

  useEffect(() => {
    if (!konusuluyor) return;
    const z = setInterval(() => setSaniye((n) => n + 1), 1000);
    return () => clearInterval(z);
  }, [konusuluyor]);

  if (arama === null || anahtar === null || kapatilan === anahtar) return null;

  const a = arama as { arayan: string; numara?: string; gorselRef?: string };
  const foto = a.gorselRef === undefined ? null : kutuphane.icerikler.get(a.gorselRef);
  const fotoDosya = foto?.tur === "foto" ? foto.veri.dosya : null;

  return (
    <div
      className="absolute inset-0 z-[55] flex flex-col items-center text-white"
      style={{ background: ARAMA_ZEMINI }}
    >
      <div className="mt-[16%] flex flex-col items-center px-8 text-center">
        <div className="h-[104px] w-[104px] overflow-hidden rounded-full bg-white/15">
          {fotoDosya !== null && (
            <Medya kaynak={`/ornek/${fotoDosya}`} alt="" className="h-full w-full" />
          )}
        </div>
        <div className="mt-[18px] text-[30px] font-light leading-tight">{a.arayan}</div>
        <div className="mt-[5px] text-[15px] opacity-65">
          {konusuluyor ? sureMetni(saniye) : (a.numara ?? (skin === "ios" ? "iPhone" : "Cep"))}
        </div>
        {!konusuluyor && <div className="mt-[3px] text-[14px] opacity-45">gelen arama…</div>}
      </div>

      <div className="mt-auto mb-[13%] flex w-full items-center justify-around px-12">
        <AramaDugmesi
          renk="#ff3b30"
          etiket={konusuluyor ? "Bitir" : "Reddet"}
          onBas={() => setKapatilan(anahtar)}
        >
          <Ahize kapali />
        </AramaDugmesi>
        {!konusuluyor && (
          <AramaDugmesi renk="#34c759" etiket="Kabul et" onBas={() => setKonusuluyor(true)}>
            <Ahize />
          </AramaDugmesi>
        )}
      </div>
    </div>
  );
}
