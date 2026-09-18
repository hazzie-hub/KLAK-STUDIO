import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { harfSayisi, harflereBol, ilkHarfler } from "../src/shared/ghost-typing/harfler";
import { SahneSchema, type Sahne } from "../src/schema";

const KOK = join(import.meta.dirname, "..");

describe("harflereBol — Türkçe ve emoji (CLAUDE.md §7, §2.8)", () => {
  it("Türkçe karakterleri tek tek ayırır", () => {
    expect(harflereBol("İşığüöçÇŞĞÜÖ")).toEqual(
      ["İ", "ş", "ı", "ğ", "ü", "ö", "ç", "Ç", "Ş", "Ğ", "Ü", "Ö"],
    );
  });

  it("emojiyi BÖLMEZ — tek harf sayar", () => {
    expect(harflereBol("a🌿b")).toEqual(["a", "🌿", "b"]);
    expect(harfSayisi("🌿")).toBe(1);
  });

  it("birleşik emojiyi de tek parça sayar", () => {
    expect(harfSayisi("👩‍👧")).toBe(1);
    expect(harfSayisi("👍🏽")).toBe(1);
  });

  it("boş metin boş dizi verir", () => {
    expect(harflereBol("")).toEqual([]);
    expect(harfSayisi("")).toBe(0);
  });
});

describe("ilkHarfler — yazılan kısım", () => {
  const metin = "Teşekkürler, çok naziksiniz 🌿";

  it("harf harf ilerler ve hiçbir adımda bozuk karakter çıkmaz", () => {
    const toplam = harfSayisi(metin);
    for (let i = 0; i <= toplam; i++) {
      const parca = ilkHarfler(metin, i);
      expect(metin.startsWith(parca)).toBe(true);
      expect(parca).not.toContain("�");
      // Yarım kalmış vekil karakter olmamalı
      expect(/[\uD800-\uDBFF]$/.test(parca)).toBe(false);
    }
  });

  it("son adımda metnin tamamını verir", () => {
    expect(ilkHarfler(metin, harfSayisi(metin))).toBe(metin);
  });

  it("emoji tek adımda gelir, yarısı görünmez", () => {
    const toplam = harfSayisi(metin);
    expect(ilkHarfler(metin, toplam - 1)).toBe("Teşekkürler, çok naziksiniz ");
    expect(ilkHarfler(metin, toplam)).toBe(metin);
  });

  it("sayı taşarsa metni aşmaz", () => {
    expect(ilkHarfler("abc", 99)).toBe("abc");
    expect(ilkHarfler("abc", 0)).toBe("");
    expect(ilkHarfler("abc", -5)).toBe("");
  });

  it("Türkçe metinde her adım doğru", () => {
    expect(ilkHarfler("İyi geceler", 1)).toBe("İ");
    expect(ilkHarfler("şığ", 2)).toBe("şı");
  });
});

describe("eg-b03-s59 — ghost typing sahnesi", () => {
  const sahne = (): Sahne =>
    SahneSchema.parse(JSON.parse(readFileSync(join(KOK, "content/sahneler/eg-b03-s59.json"), "utf-8")));

  it("ghostTypingBaslat olayı var ve senaryolu modda", () => {
    const olay = sahne().olaylar.find((o) => o.aksiyon.tur === "ghostTypingBaslat");
    expect(olay).toBeDefined();
    if (olay?.aksiyon.tur === "ghostTypingBaslat") {
      expect(olay.aksiyon.mod).toBe("senaryolu");
      expect(olay.aksiyon.hedef).toBe("yorum-yaz");
    }
  });

  it("yazılan metin ile paylaşılan yorum AYNI", () => {
    const s = sahne();
    const yazilan = s.olaylar.flatMap((o) =>
      o.aksiyon.tur === "ghostTypingBaslat" ? [o.aksiyon.metin] : [],
    )[0];
    const paylasilan = s.olaylar.flatMap((o) =>
      o.aksiyon.tur === "yorumGeldi" && o.aksiyon.hesap === "nergis" ? [o.aksiyon.metin] : [],
    )[0];
    expect(paylasilan).toBe(yazilan);
  });

  it("metin Türkçe karakter ve emoji içeriyor (gerçek sınama)", () => {
    const metin = sahne().olaylar.flatMap((o) =>
      o.aksiyon.tur === "ghostTypingBaslat" ? [o.aksiyon.metin] : [],
    )[0];
    expect(metin).toMatch(/[şçöüğıİ]/);
    expect(harfSayisi(metin ?? "")).toBeLessThan((metin ?? "").length);
  });
});
