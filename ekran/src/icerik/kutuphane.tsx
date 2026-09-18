"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import type { Hesap, Icerik, PostVerisi } from "@/schema";

/**
 * İçerik kütüphanesi — hesaplar ve içerikler.
 * Sunucuda dosyadan okunur, buradan modüllere dağıtılır. Faz 4'te kaynak
 * Supabase olacak; modüllerin gördüğü arayüz değişmeyecek.
 */

export type Post = { id: string; veri: PostVerisi };

type Kutuphane = {
  hesaplar: Map<string, Hesap>;
  icerikler: Map<string, Icerik>;
  hesap: (id: string) => Hesap | null;
  post: (id: string) => Post | null;
  /** Kütüphanedeki tüm postlar, dosya sırasına göre. */
  postlar: Post[];
};

const Baglam = createContext<Kutuphane | null>(null);

export function KutuphaneSaglayici({
  hesaplar,
  icerikler,
  children,
}: {
  hesaplar: Hesap[];
  icerikler: Icerik[];
  children: ReactNode;
}) {
  const deger = useMemo<Kutuphane>(() => {
    const hesapHaritasi = new Map(hesaplar.map((h) => [h.id, h]));
    const icerikHaritasi = new Map(icerikler.map((i) => [i.id, i]));
    const postlar: Post[] = icerikler.flatMap((i) =>
      i.tur === "post" ? [{ id: i.id, veri: i.veri }] : [],
    );

    return {
      hesaplar: hesapHaritasi,
      icerikler: icerikHaritasi,
      hesap: (id) => hesapHaritasi.get(id) ?? null,
      post: (id) => {
        const i = icerikHaritasi.get(id);
        return i !== undefined && i.tur === "post" ? { id: i.id, veri: i.veri } : null;
      },
      postlar,
    };
  }, [hesaplar, icerikler]);

  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}

export function useKutuphane(): Kutuphane {
  const b = useContext(Baglam);
  if (b === null) throw new Error("useKutuphane, <KutuphaneSaglayici> içinde çağrılmalı.");
  return b;
}
