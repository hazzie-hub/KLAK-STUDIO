import type { BaglantiProfili, GorselYukleme } from "@/schema";

/**
 * Bağlantı profili ile görsel yükleme ayarını tek bir sonuca indirger.
 *
 * KURAL (CLAUDE.md §3.1 — modüller kendi "yavaş yükleme" mantığını yazmaz):
 *  - Bağlantı yoksa görseller hiç gelmez, sahne ne derse desin.
 *  - Bağlantı yavaşsa ve sahne görsel için özel bir şey demediyse, görseller gecikir.
 *  - Sahne görsel için açıkça bir şey dediyse, o kazanır.
 */
export function etkinGorsel(
  baglanti: BaglantiProfili,
  gorsel: GorselYukleme,
): GorselYukleme {
  if (baglanti === "yok") return "yuklenmez";
  if (baglanti === "yavas" && gorsel === "normal") return "gec";
  return gorsel;
}

/**
 * Bir görselin gecikmesi — DETERMİNİSTİK (CLAUDE.md §2.4).
 *
 * Hepsi aynı anda gelirse sahte durur, rastgele olursa her tekrarda değişir.
 * Bu yüzden gecikme, görselin kaynağından hesaplanır: aynı görsel her zaman
 * aynı süre sonra gelir, farklı görseller farklı sürelerde.
 */
export function gecikmeHesapla(kaynak: string, taban = 700, aralik = 1100): number {
  let h = 2166136261;
  for (let i = 0; i < kaynak.length; i++) {
    h ^= kaynak.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return taban + (h % aralik);
}
