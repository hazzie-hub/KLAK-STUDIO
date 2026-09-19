"use client";

import { useMemo } from "react";

import { markalar } from "@brands";
import { useKutuphane } from "@/icerik/kutuphane";
import type { AramaSonucuVerisi } from "@/schema";

export const MARKA = markalar.look;

/** Ghost typing hedefi — sahne dosyaları bu adı kullanır. */
export const GHOST_HEDEF = "arama-cubugu";

export type GorunenArama = {
  id: string;
  veri: AramaSonucuVerisi;
};

/**
 * `arama` modülünün verisi.
 *
 * Arama sonucu sayfaları içerik kütüphanesinden gelir; modül kendi listesini
 * tutmaz (CLAUDE.md §3.2). Sahnede hangi sayfanın açılacağı `baslangic` ya da
 * `ekranAc` aksiyonuyla belirlenir.
 */
export function useAramalar(): GorunenArama[] {
  const k = useKutuphane();
  return useMemo(
    () =>
      [...k.icerikler.values()].flatMap((i) =>
        i.tur === "aramaSonucu" ? [{ id: i.id, veri: i.veri }] : [],
      ),
    [k],
  );
}
