"use client";

import { useMemo } from "react";

import { useDurum } from "@/durum";
import { useSahne } from "@/engine";
import type { AramaKaydi, Cihaz, Olay } from "@/schema";

/**
 * `telefon` modülünün verisi. CLAUDE.md §3.2
 *
 * Rehber ve geçmiş cihazdan gelir. Sahne SIRASINDA gelen aramalar geçmişin
 * başına eklenir — ama saklanmaz, gerçekleşen olaylardan TÜRETİLİR. Başa
 * sarınca olay listesi boşalır ve geçmiş sahnenin başındaki haline döner.
 */
export type TelefonVerisi = {
  gecmis: Array<AramaKaydi & { yeni: boolean }>;
  rehber: Cihaz["rehber"];
};

export function telefonVeriTuret(
  cihaz: Cihaz | null,
  olanlar: Olay[],
  /** Cihazın o anki saati — sahne içinde gelen aramalara bu yazılır. */
  saat: string,
): TelefonVerisi {
  const sahneIcinde: Array<AramaKaydi & { yeni: boolean }> = [];

  for (const olay of olanlar) {
    const a = olay.aksiyon;
    if (a.tur !== "aramaGeldi") continue;
    sahneIcinde.unshift({
      ad: a.arayan,
      numara: a.numara,
      yon: "gelen",
      zaman: saat,
      yeni: true,
    });
  }

  const onceki = (cihaz?.aramaGecmisi ?? []).map((k) => ({ ...k, yeni: false }));

  return {
    gecmis: [...sahneIcinde, ...onceki],
    rehber: cihaz?.rehber ?? [],
  };
}

export function useTelefonVeri(cihaz: Cihaz | null): TelefonVerisi {
  const { olanlar } = useSahne();
  const { durum } = useDurum();
  return useMemo(
    () => telefonVeriTuret(cihaz, olanlar, durum.saat),
    [cihaz, olanlar, durum.saat],
  );
}

/** Rehberde ada göre sıralama — Türkçe harfler doğru sıralansın. */
export function rehberSirala(rehber: Cihaz["rehber"]): Cihaz["rehber"] {
  return [...rehber].sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
}

/**
 * Aranan şey kayıtlı bir kişi mi, çevrilen çıplak numara mı?
 *
 * Numarada harf olmaz. Ayrım görünüşü değiştirir: kişide baş harf, numarada
 * kişi ikonu gösterilir — yoksa avatar dairesinde "0" yazar.
 */
export function rehberAdiMi(ad: string): boolean {
  return /\p{L}/u.test(ad);
}

/** Avatar dairesinde görünecek baş harf. */
export function basHarf(ad: string): string {
  return (ad.trim()[0] ?? "?").toLocaleUpperCase("tr");
}
