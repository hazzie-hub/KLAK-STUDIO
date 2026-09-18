import { useSahne } from "@/engine";
import { markaAl } from "@brands";
import type { Aksiyon } from "@/schema";

export type BildirimAksiyonu = Extract<Aksiyon, { tur: "bildirim" }>;

export type Bildirim = BildirimAksiyonu & {
  /** Aynı bildirim iki kez gelirse ayırt etmek için. */
  anahtar: string;
};

/**
 * Gerçekleşen `bildirim` olayları, sırayla.
 * Hem üstteki banner katmanı hem kilit ekranı listesi bunu okur.
 */
export function useBildirimler(): Bildirim[] {
  const { olanlar } = useSahne();
  return olanlar.flatMap((olay, i) =>
    olay.aksiyon.tur === "bildirim" ? [{ ...olay.aksiyon, anahtar: `${olay.id}-${i}` }] : [],
  );
}

/**
 * Uygulama adının ekranda görünecek hali. Önce /brands'e bakar (CLAUDE.md §2.1:
 * marka isimleri tek yerden yönetilir); kayıtlı değilse slug insanlaştırılır.
 */
export function uygulamaAdi(slug: string): string {
  const marka = markaAl(slug);
  if (marka !== null) return marka.ad;

  return slug
    .split("-")
    .map((p) => p.charAt(0).toLocaleUpperCase("tr") + p.slice(1))
    .join(" ");
}

/** Uygulama ikonunun rengi — /brands'ten, yoksa slug'dan deterministik. */
export function uygulamaRengi(slug: string): string {
  const marka = markaAl(slug);
  if (marka !== null) return marka.ikonRengi;

  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return `hsl(${h % 360} 46% 52%)`;
}
