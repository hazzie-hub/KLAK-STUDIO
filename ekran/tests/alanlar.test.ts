import { describe, expect, it } from "vitest";

import {
  AKSIYON_ADLARI,
  AKSIYON_ALANLARI,
  TETIK_ADLARI,
  TETIK_ALANLARI,
} from "../src/studio/alanlar";
import { AksiyonSchema, TetikSchema } from "../src/schema";

/**
 * Form alan tablosu ile Zod şeması AYRIŞMAMALI.
 *
 * Tablo elle yazılıyor; şemaya yeni bir aksiyon ya da alan eklenip tablo
 * güncellenmezse Stüdyo o alanı hiç sormaz ve kimse fark etmez. Bu testler
 * ikisini birbirine bağlar.
 */

type Sekil = Record<string, { isOptional?: () => boolean }>;

function birlesenler(sema: unknown): Array<{ tur: string; sekil: Sekil }> {
  const secenekler =
    (sema as { options?: unknown[] }).options ??
    (sema as { def?: { options?: unknown[] } }).def?.options ??
    [];
  return (secenekler as unknown[]).map((secenek) => {
    const sekil =
      ((secenek as { shape?: Sekil }).shape ??
        (secenek as { def?: { shape?: Sekil } }).def?.shape ??
        {}) as Sekil;
    // `tur` alanı literal; değerini okumak için küçük bir deneme yapıyoruz.
    const turAlani = sekil.tur as unknown as { value?: string; def?: { values?: string[] } };
    const tur =
      turAlani?.value ??
      turAlani?.def?.values?.[0] ??
      ((): string => {
        throw new Error("Aksiyon türü okunamadı — Zod sürümü değişmiş olabilir.");
      })();
    return { tur, sekil };
  });
}

describe("aksiyon alan tablosu şemayla uyumlu", () => {
  const birlesim = birlesenler(AksiyonSchema);

  it("şemadaki her aksiyon türü tabloda var", () => {
    expect(birlesim.length).toBeGreaterThan(0);
    for (const { tur } of birlesim) {
      expect(AKSIYON_ALANLARI[tur as keyof typeof AKSIYON_ALANLARI]).toBeDefined();
      expect(AKSIYON_ADLARI[tur as keyof typeof AKSIYON_ADLARI]).toBeTruthy();
    }
  });

  it("tabloda şemada olmayan aksiyon türü yok", () => {
    const semadakiler = new Set(birlesim.map((b) => b.tur));
    for (const tur of Object.keys(AKSIYON_ALANLARI)) {
      expect(semadakiler.has(tur)).toBe(true);
    }
  });

  it("her aksiyonun alanları şemadaki alanlarla birebir aynı", () => {
    for (const { tur, sekil } of birlesim) {
      const semaAlanlari = Object.keys(sekil)
        .filter((a) => a !== "tur")
        .sort();
      const tabloAlanlari = [...AKSIYON_ALANLARI[tur as keyof typeof AKSIYON_ALANLARI]]
        .map((a) => a.ad)
        .sort();
      expect({ tur, alanlar: tabloAlanlari }).toEqual({ tur, alanlar: semaAlanlari });
    }
  });

  it("şemada zorunlu olan alan tabloda da zorunlu işaretli", () => {
    for (const { tur, sekil } of birlesim) {
      for (const [ad, alan] of Object.entries(sekil)) {
        if (ad === "tur") continue;
        const opsiyonelMi = typeof alan.isOptional === "function" ? alan.isOptional() : false;
        const tabloAlani = AKSIYON_ALANLARI[tur as keyof typeof AKSIYON_ALANLARI].find(
          (x) => x.ad === ad,
        );
        expect(tabloAlani, `${tur}.${ad} tabloda yok`).toBeDefined();
        expect(
          { alan: `${tur}.${ad}`, zorunlu: tabloAlani?.zorunlu === true },
          `${tur}.${ad} zorunluluğu şemayla uyuşmuyor`,
        ).toEqual({ alan: `${tur}.${ad}`, zorunlu: !opsiyonelMi });
      }
    }
  });
});

describe("tetik alan tablosu şemayla uyumlu", () => {
  const birlesim = birlesenler(TetikSchema);

  it("şemadaki her tetik türü tabloda var", () => {
    for (const { tur } of birlesim) {
      expect(TETIK_ALANLARI[tur as keyof typeof TETIK_ALANLARI]).toBeDefined();
      expect(TETIK_ADLARI[tur as keyof typeof TETIK_ADLARI]).toBeTruthy();
    }
  });

  it("her tetiğin alanları şemadakiyle birebir aynı", () => {
    for (const { tur, sekil } of birlesim) {
      const semaAlanlari = Object.keys(sekil)
        .filter((a) => a !== "tur")
        .sort();
      const tabloAlanlari = [...TETIK_ALANLARI[tur as keyof typeof TETIK_ALANLARI]]
        .map((a) => a.ad)
        .sort();
      expect({ tur, alanlar: tabloAlanlari }).toEqual({ tur, alanlar: semaAlanlari });
    }
  });
});
