/**
 * Metni EKRANDA GÖRÜNEN harflere böler. CLAUDE.md §7
 *
 * Neden basit `split("")` olmuyor: emoji ve bazı birleşik karakterler birden
 * fazla kod biriminden oluşur; tek tek bölünürse ekranda bozuk kare çıkar.
 * `Intl.Segmenter` bunları tek parça sayar.
 */
export function harflereBol(metin: string): string[] {
  if (metin === "") return [];

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const bolucu = new Intl.Segmenter("tr", { granularity: "grapheme" });
    return [...bolucu.segment(metin)].map((p) => p.segment);
  }

  // Segmenter yoksa: en azından vekil çiftleri bölme.
  return [...metin];
}

/** Metnin ilk `sayi` harfi. */
export function ilkHarfler(metin: string, sayi: number): string {
  if (sayi <= 0) return "";
  const harfler = harflereBol(metin);
  return harfler.slice(0, sayi).join("");
}

export function harfSayisi(metin: string): number {
  return harflereBol(metin).length;
}
