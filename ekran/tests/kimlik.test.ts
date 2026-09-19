import { describe, expect, it } from "vitest";

import { addanKimlik, benzersizKimlik, kimlikBitir, kimlikYaz } from "../src/studio/kimlik";
import { SlugSchema } from "../src/schema";

describe("kimlik temizleme", () => {
  it("Türkçe harfleri çevirir", () => {
    expect(addanKimlik("Şişli Güneş Çınar")).toBe("sisli-gunes-cinar");
    expect(addanKimlik("İpek ışık")).toBe("ipek-isik");
    expect(addanKimlik("Öğle Üstü")).toBe("ogle-ustu");
  });

  it("büyük I ve İ ikisi de i olur", () => {
    expect(addanKimlik("Islak")).toBe("islak");
    expect(addanKimlik("İlk")).toBe("ilk");
  });

  it("boşlukları tireye çevirir, fazlalıkları teke indirir", () => {
    expect(addanKimlik("  Sezai   yorum   yapar  ")).toBe("sezai-yorum-yapar");
    expect(addanKimlik("alt_çizgi.nokta")).toBe("alt-cizgi-nokta");
  });

  it("tanınmayan işaretleri atar", () => {
    expect(addanKimlik("Sezai'nin mesajı!")).toBe("sezainin-mesaji");
    expect(addanKimlik("%50 pil")).toBe("50-pil");
  });

  it("YAZARKEN sondaki tireyi korur — yoksa kelime ayrılamaz", () => {
    expect(kimlikYaz("sezai ")).toBe("sezai-");
    expect(kimlikYaz("sezai yorum ")).toBe("sezai-yorum-");
  });

  it("BİTİRİRKEN sondaki tire silinir", () => {
    expect(kimlikBitir("sezai-")).toBe("sezai");
    expect(kimlikBitir("-sezai--")).toBe("sezai");
  });

  it("boş girdi boş döner", () => {
    expect(addanKimlik("")).toBe("");
    expect(addanKimlik("   ")).toBe("");
    expect(addanKimlik("!!!")).toBe("");
  });

  it("ürettiği her kimlik şemadan geçer", () => {
    const ornekler = [
      "Sezai'den ilk mesaj düşer",
      "Nergis ARAR",
      "  çift   boşluk  ",
      "Pil %5'e düşer",
      "İkinci mesaj",
    ];
    for (const ad of ornekler) {
      const kimlik = addanKimlik(ad);
      expect({ ad, gecerli: SlugSchema.safeParse(kimlik).success }).toEqual({ ad, gecerli: true });
    }
  });
});

describe("benzersiz kimlik", () => {
  it("çakışma yoksa olduğu gibi", () => {
    expect(benzersizKimlik("ilk-mesaj", ["baska"])).toBe("ilk-mesaj");
  });

  it("çakışınca -2 ekler", () => {
    expect(benzersizKimlik("ilk-mesaj", ["ilk-mesaj"])).toBe("ilk-mesaj-2");
  });

  it("üst üste çakışmada sayıyı artırır", () => {
    expect(benzersizKimlik("ilk-mesaj", ["ilk-mesaj", "ilk-mesaj-2"])).toBe("ilk-mesaj-3");
  });

  it("boş tabandan boş döner — uydurma kimlik üretmez", () => {
    expect(benzersizKimlik("", ["a"])).toBe("");
  });

  it("türetilen kimlik de şemadan geçer", () => {
    const k = benzersizKimlik("Sezai ısrar eder", ["sezai-israr-eder"]);
    expect(k).toBe("sezai-israr-eder-2");
    expect(SlugSchema.safeParse(k).success).toBe(true);
  });
});
