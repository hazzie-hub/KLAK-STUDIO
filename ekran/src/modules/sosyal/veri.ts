"use client";

import { useMemo } from "react";

import { useSahne } from "@/engine";
import { useKutuphane } from "@/icerik/kutuphane";
import type { Hesap, Olay, PostVerisi, Sahne } from "@/schema";

/**
 * Ekranda görünecek her şey, GERÇEKLEŞEN OLAYLARDAN türetilir.
 *
 * Modül kendi sayacını tutmaz: beğeni sayısı = temel sayı + gerçekleşen
 * `begeniGeldi` olayları. Böylece başa sar tek satır ve her tekrar birebir aynı
 * (CLAUDE.md §2.4).
 */

export type GorunenYorum = {
  hesap: Hesap | null;
  metin: string;
  /** Sahne sırasında geldi mi? (animasyon için) */
  yeni: boolean;
};

export type GorunenPost = {
  id: string;
  hesap: Hesap | null;
  gorsel: string;
  aciklama: string;
  konum?: string;
  tarih?: string;
  begeni: number;
  yorumlar: GorunenYorum[];
  /** Sahne sırasında yüklendi mi? */
  yeniYuklendi: boolean;
};

export type Aktivite =
  | { tur: "begeni"; hesap: Hesap | null; postId: string | null }
  | { tur: "yorum"; hesap: Hesap | null; metin: string; postId: string | null }
  | { tur: "takip"; hesap: Hesap | null };

export type SosyalVeri = {
  feed: GorunenPost[];
  postAl: (id: string) => GorunenPost | null;
  aktiviteler: Aktivite[];
  takipEdenler: Hesap[];
};

/** Modüllerin kütüphaneden ihtiyaç duyduğu kadarı — test etmeyi kolaylaştırır. */
export type KutuphaneGorunumu = {
  hesap: (id: string) => Hesap | null;
  post: (id: string) => { id: string; veri: PostVerisi } | null;
  postlar: Array<{ id: string; veri: PostVerisi }>;
};

export function useSosyalVeri(): SosyalVeri {
  const { sahne, olanlar } = useSahne();
  const kutuphane = useKutuphane();

  return useMemo(
    () => sosyalVeriTuret(sahne, olanlar, kutuphane),
    [sahne, olanlar, kutuphane],
  );
}

/**
 * Saf türetme — React'siz, bu yüzden testi kolay.
 * Aynı sahne + aynı olay listesi her zaman aynı ekranı verir (CLAUDE.md §2.4).
 */
export function sosyalVeriTuret(
  sahne: Sahne,
  olanlar: Olay[],
  kutuphane: KutuphaneGorunumu,
): SosyalVeri {
  {
    // Sahnede yüklenecek postlar: olay gerçekleşene kadar feed'de görünmezler.
    const yuklenecekler = new Set(
      sahne.olaylar.flatMap((o) => (o.aksiyon.tur === "postYukle" ? [o.aksiyon.icerikRef] : [])),
    );

    const yuklenenler: string[] = [];
    const begeniler = new Map<string | null, Olay[]>();
    const yorumlar = new Map<string | null, Olay[]>();
    const takipler: Olay[] = [];

    const ekle = (harita: Map<string | null, Olay[]>, anahtar: string | null, olay: Olay) => {
      const liste = harita.get(anahtar) ?? [];
      liste.push(olay);
      harita.set(anahtar, liste);
    };

    for (const olay of olanlar) {
      const a = olay.aksiyon;
      if (a.tur === "postYukle") yuklenenler.push(a.icerikRef);
      else if (a.tur === "begeniGeldi") ekle(begeniler, a.postRef ?? null, olay);
      else if (a.tur === "yorumGeldi") ekle(yorumlar, a.postRef ?? null, olay);
      else if (a.tur === "takipGeldi") takipler.push(olay);
    }

    // Feed: sahnede yüklenenler en üstte (en yenisi başta), sonra kütüphane.
    const temelPostlar = kutuphane.postlar.filter((p) => !yuklenecekler.has(p.id));
    const sira = [
      ...[...yuklenenler].reverse(),
      ...temelPostlar.map((p) => p.id),
    ];

    /** postRef verilmemiş olaylar hangi posta yazılır? */
    const varsayilanPost = yuklenenler.at(-1) ?? sira[0] ?? null;

    const kur = (postId: string): GorunenPost | null => {
      const post = kutuphane.post(postId);
      if (post === null) return null;

      const hedefBegeni = [
        ...(begeniler.get(postId) ?? []),
        ...(varsayilanPost === postId ? (begeniler.get(null) ?? []) : []),
      ];
      const hedefYorum = [
        ...(yorumlar.get(postId) ?? []),
        ...(varsayilanPost === postId ? (yorumlar.get(null) ?? []) : []),
      ];

      return {
        id: postId,
        hesap: kutuphane.hesap(post.veri.hesap),
        gorsel: post.veri.gorsel,
        aciklama: post.veri.aciklama,
        konum: post.veri.konum,
        tarih: post.veri.tarih,
        begeni: (post.veri.begeniSayisi ?? 0) + hedefBegeni.length,
        yorumlar: [
          ...post.veri.yorumlar.map((y) => ({
            hesap: kutuphane.hesap(y.hesap),
            metin: y.metin,
            yeni: false,
          })),
          ...hedefYorum.map((olay) => ({
            hesap:
              olay.aksiyon.tur === "yorumGeldi" ? kutuphane.hesap(olay.aksiyon.hesap) : null,
            metin: olay.aksiyon.tur === "yorumGeldi" ? olay.aksiyon.metin : "",
            yeni: true,
          })),
        ],
        yeniYuklendi: yuklenenler.includes(postId),
      };
    };

    const feed = sira.flatMap((id) => {
      const p = kur(id);
      return p === null ? [] : [p];
    });

    // Aktivite: en yeni üstte.
    const aktiviteler: Aktivite[] = [...olanlar]
      .reverse()
      .flatMap((olay): Aktivite[] => {
        const a = olay.aksiyon;
        if (a.tur === "begeniGeldi") {
          return [{ tur: "begeni", hesap: kutuphane.hesap(a.hesap), postId: a.postRef ?? varsayilanPost }];
        }
        if (a.tur === "yorumGeldi") {
          return [
            { tur: "yorum", hesap: kutuphane.hesap(a.hesap), metin: a.metin, postId: a.postRef ?? varsayilanPost },
          ];
        }
        if (a.tur === "takipGeldi") {
          return [{ tur: "takip", hesap: kutuphane.hesap(a.hesap) }];
        }
        return [];
      });

    const takipEdenler = takipler.flatMap((o) =>
      o.aksiyon.tur === "takipGeldi" ? [kutuphane.hesap(o.aksiyon.hesap)] : [],
    ).filter((h): h is Hesap => h !== null);

    return {
      feed,
      postAl: (id: string) => feed.find((p) => p.id === id) ?? kur(id),
      aktiviteler,
      takipEdenler,
    };
  }
}
