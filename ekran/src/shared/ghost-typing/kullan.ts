"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useSahne } from "@/engine";
import type { Aksiyon } from "@/schema";
import { harfSayisi, ilkHarfler } from "./harfler";

export type GhostAksiyonu = Extract<Aksiyon, { tur: "ghostTypingBaslat" }>;

/** Otomatik modda harf başına varsayılan süre (ms). */
const VARSAYILAN_HIZ = 95;

export type GhostDurumu = {
  /** Sahne bu hedef için ghost typing başlattı mı? */
  aktif: boolean;
  mod: GhostAksiyonu["mod"];
  /** Senaryodaki tam metin. */
  hedefMetin: string;
  /** O ana kadar yazılmış kısım. */
  yazilan: string;
  tamamlandi: boolean;
  /** Bir tuşa basıldı — sıradaki harfi yaz. Hangi tuş olduğu ÖNEMSİZ (§7). */
  tusaBas: () => void;
  /** Son harfi sil (oyuncu backspace'e basarsa). */
  geriAl: () => void;
};

/**
 * Ghost typing. CLAUDE.md §7
 *
 * Senaryolu mod: oyuncu hangi tuşa basarsa bassın senaryodaki metnin sıradaki
 * harfi yazılır. Metin bitince tuşlar etkisizleşir, "gönder" aktifleşir.
 * Otomatik mod: kimse dokunmadan verilen hızda kendi kendine yazar.
 */
export function useGhostTyping(hedef: string): GhostDurumu {
  const { olanlar } = useSahne();

  // Bu hedef için başlatılmış EN SON ghost typing olayı.
  const aksiyon = useMemo(() => {
    let sonuncu: GhostAksiyonu | null = null;
    for (const olay of olanlar) {
      if (olay.aksiyon.tur === "ghostTypingBaslat" && olay.aksiyon.hedef === hedef) {
        sonuncu = olay.aksiyon;
      }
    }
    return sonuncu;
  }, [olanlar, hedef]);

  const [sayi, setSayi] = useState(0);
  const toplam = aksiyon === null ? 0 : harfSayisi(aksiyon.metin);

  // Yeni bir ghost typing başlarsa baştan; başa sarılırsa sıfırlanır.
  const anahtar = aksiyon === null ? "" : `${aksiyon.hedef}|${aksiyon.metin}`;
  const oncekiAnahtarRef = useRef(anahtar);
  useEffect(() => {
    if (oncekiAnahtarRef.current !== anahtar) {
      oncekiAnahtarRef.current = anahtar;
      setSayi(0);
    }
  }, [anahtar]);

  const tusaBas = useCallback(() => {
    setSayi((n) => Math.min(n + 1, toplam));
  }, [toplam]);

  const geriAl = useCallback(() => {
    setSayi((n) => Math.max(0, n - 1));
  }, []);

  // Otomatik mod: kendi kendine yazar (insert çekimler için).
  const otomatik = aksiyon?.mod === "otomatik";
  const hiz = aksiyon?.hiz ?? VARSAYILAN_HIZ;
  useEffect(() => {
    if (!otomatik || sayi >= toplam) return;
    const z = setTimeout(() => setSayi((n) => Math.min(n + 1, toplam)), hiz);
    return () => clearTimeout(z);
  }, [otomatik, hiz, sayi, toplam]);

  return {
    aktif: aksiyon !== null,
    mod: aksiyon?.mod ?? "senaryolu",
    hedefMetin: aksiyon?.metin ?? "",
    yazilan: aksiyon === null ? "" : ilkHarfler(aksiyon.metin, sayi),
    tamamlandi: aksiyon !== null && sayi >= toplam && toplam > 0,
    tusaBas,
    geriAl,
  };
}
