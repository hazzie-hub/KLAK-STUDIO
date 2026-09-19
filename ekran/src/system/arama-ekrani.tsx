"use client";

import { useEffect, useRef, useState } from "react";

import { useSahne } from "@/engine";
import { useKutuphane } from "@/icerik/kutuphane";
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

  const dakika = Math.floor(saniye / 60);
  const kalanSn = saniye % 60;

  return (
    <div
      className="absolute inset-0 z-[55] flex flex-col items-center text-white"
      style={{
        background:
          "linear-gradient(170deg, #4a4f57 0%, #2a2d33 45%, #17191d 100%)",
      }}
    >
      <div className="mt-[16%] flex flex-col items-center px-8 text-center">
        <div className="h-[104px] w-[104px] overflow-hidden rounded-full bg-white/15">
          {fotoDosya !== null && (
            <Medya kaynak={`/ornek/${fotoDosya}`} alt="" className="h-full w-full" />
          )}
        </div>
        <div className="mt-[18px] text-[30px] font-light leading-tight">{a.arayan}</div>
        <div className="mt-[5px] text-[15px] opacity-65">
          {konusuluyor
            ? `${dakika}:${String(kalanSn).padStart(2, "0")}`
            : (a.numara ?? (skin === "ios" ? "iPhone" : "Cep"))}
        </div>
        {!konusuluyor && <div className="mt-[3px] text-[14px] opacity-45">gelen arama…</div>}
      </div>

      <div className="mt-auto mb-[13%] flex w-full items-center justify-around px-12">
        <Dugme
          renk="#ff3b30"
          etiket={konusuluyor ? "Bitir" : "Reddet"}
          onBas={() => setKapatilan(anahtar)}
        >
          <Ahize kapali />
        </Dugme>
        {!konusuluyor && (
          <Dugme renk="#34c759" etiket="Kabul et" onBas={() => setKonusuluyor(true)}>
            <Ahize />
          </Dugme>
        )}
      </div>
    </div>
  );
}

function Dugme({
  renk,
  etiket,
  onBas,
  children,
}: {
  renk: string;
  etiket: string;
  onBas: () => void;
  children: React.ReactNode;
}) {
  return (
    <button onClick={onBas} className="flex flex-col items-center gap-[9px]" aria-label={etiket}>
      <span
        className="flex h-[68px] w-[68px] items-center justify-center rounded-full active:opacity-80"
        style={{ background: renk }}
      >
        {children}
      </span>
      <span className="text-[13px] opacity-80">{etiket}</span>
    </button>
  );
}

function Ahize({ kapali = false }: { kapali?: boolean }) {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ transform: kapali ? "rotate(135deg)" : undefined }}
    >
      <path
        d="M6.6 3.5c.7-.3 1.5 0 1.9.7l1.5 2.7c.3.6.2 1.4-.3 1.9l-1.1 1c-.2.2-.3.6-.1.9a13 13 0 0 0 4.8 4.8c.3.2.7.1.9-.1l1-1.1c.5-.5 1.3-.6 1.9-.3l2.7 1.5c.7.4 1 1.2.7 1.9l-.8 1.9c-.3.7-1 1.2-1.8 1.1C11.6 20.6 3.4 12.4 2.5 5.6c-.1-.8.4-1.5 1.1-1.8l3-.3Z"
        fill="#fff"
      />
    </svg>
  );
}
