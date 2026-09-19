import { describe, expect, it } from "vitest";

import { SABLONLAR, sablonAl } from "../src/studio/sablonlar";
import { SahneSchema } from "../src/schema";

/**
 * Şablonlar YAPI vaat eder: doğru modül, doğru olay sırası, geçerli zincir.
 * İçerik referansları (hangi sohbet, hangi post) boş bırakılır; onları
 * kullanıcı formdan seçer.
 *
 * Bu testler şablonun boşlukları doldurulduğunda GEÇERLİ bir sahne verdiğini
 * denetler — yoksa kullanıcı şablonu seçer, doldurur ve ancak kaydederken
 * yapısal bir hata olduğunu öğrenir.
 */
function boslukDoldur<T>(deger: T): T {
  if (typeof deger === "string") return (deger === "" ? "yer-tutucu" : deger) as T;
  if (Array.isArray(deger)) return deger.map(boslukDoldur) as T;
  if (deger !== null && typeof deger === "object") {
    const o: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(deger)) o[k] = boslukDoldur(v);
    return o as T;
  }
  return deger;
}

describe("sahne şablonları", () => {
  it("en az CLAUDE.md §8'deki kadar şablon var", () => {
    expect(SABLONLAR.length).toBeGreaterThanOrEqual(6);
  });

  it("id'ler benzersiz", () => {
    const idler = SABLONLAR.map((s) => s.id);
    expect(new Set(idler).size).toBe(idler.length);
  });

  it("hepsinin adı ve açıklaması var", () => {
    for (const s of SABLONLAR) {
      expect(s.ad.trim()).not.toBe("");
      expect(s.aciklama.trim()).not.toBe("");
    }
  });

  it("sablonAl id ile bulur, olmayanda null döner", () => {
    expect(sablonAl(SABLONLAR[0]!.id)?.id).toBe(SABLONLAR[0]!.id);
    expect(sablonAl("olmayan-sablon")).toBeNull();
  });

  it("BOŞLUKLAR DOLDURULUNCA hepsi geçerli sahne veriyor", () => {
    for (const s of SABLONLAR) {
      const taslak = boslukDoldur(s.uret("eg-b03-s90", "nergis-telefon"));
      const sonuc = SahneSchema.safeParse(taslak);
      const sebep = sonuc.success
        ? ""
        : sonuc.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" | ");
      expect({ sablon: s.id, gecerli: sonuc.success, sebep }).toEqual({
        sablon: s.id,
        gecerli: true,
        sebep: "",
      });
    }
  });

  it("verilen sahne kodu ve cihaz taslağa geçiyor", () => {
    for (const s of SABLONLAR) {
      const taslak = s.uret("eg-b07-s21", "sezai-telefon") as Record<string, unknown>;
      expect(taslak.kod).toBe("eg-b07-s21");
      expect(taslak.cihaz).toBe("sezai-telefon");
    }
  });

  it("her şablonun talimatı dolu — teslim paketinde bu metin çıkar", () => {
    for (const s of SABLONLAR) {
      const taslak = s.uret("eg-b03-s90", "nergis-telefon") as { talimat?: string };
      expect((taslak.talimat ?? "").length).toBeGreaterThan(40);
    }
  });

  it("olay id'leri şablon içinde benzersiz", () => {
    for (const s of SABLONLAR) {
      const taslak = s.uret("eg-b03-s90", "nergis-telefon") as { olaylar?: Array<{ id: string }> };
      const idler = (taslak.olaylar ?? []).map((o) => o.id);
      expect(new Set(idler).size).toBe(idler.length);
    }
  });

  it("boş bırakılan alanlar kullanıcıya önceden söyleniyor", () => {
    // Tek yönlü kural: taslakta boş alan BIRAKAN şablon neyin doldurulacağını
    // listelemek ZORUNDA. Tersi zorunlu değil — bir şablon, taslakta boş dize
    // olarak görünmeyen bir alanın seçilmesini de isteyebilir (örn. açılış
    // içeriği, taslakta hiç bulunmaz, formdaki açılır listeden seçilir).
    for (const s of SABLONLAR) {
      const bosluklu = JSON.stringify(s.uret("eg-b03-s90", "nergis-telefon")).includes('""');
      if (!bosluklu) continue;
      expect({ sablon: s.id, listeDolu: s.doldurulacak.length > 0 }).toEqual({
        sablon: s.id,
        listeDolu: true,
      });
    }
  });
});
