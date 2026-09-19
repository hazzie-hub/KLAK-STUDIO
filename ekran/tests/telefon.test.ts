import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { basHarf, rehberAdiMi, rehberSirala, telefonVeriTuret } from "../src/modules/telefon/veri";
import { CihazSchema, SahneSchema, type Cihaz, type Olay, type Sahne } from "../src/schema";

const KOK = join(import.meta.dirname, "..");
const oku = (yol: string) => JSON.parse(readFileSync(join(KOK, yol), "utf-8")) as unknown;
const klasor = (ad: string) =>
  readdirSync(join(KOK, "content", ad))
    .filter((d) => d.endsWith(".json"))
    .sort()
    .map((d) => oku(`content/${ad}/${d}`));

const cihazlar = klasor("cihazlar").map((c) => CihazSchema.parse(c) as Cihaz);
const sahneler = klasor("sahneler").map((s) => SahneSchema.parse(s) as Sahne);
const nergis = cihazlar.find((c) => c.kod === "nergis-telefon")!;

const olay = (id: string, aksiyon: Olay["aksiyon"]): Olay =>
  ({ id, tetik: { tur: "elle" }, aksiyon }) as Olay;

describe("arama geçmişi olaylardan türer", () => {
  it("hiç olay yokken cihazdaki geçmiş görünür", () => {
    const v = telefonVeriTuret(nergis, [], "23:44");
    expect(v.gecmis).toHaveLength(nergis.aramaGecmisi.length);
    expect(v.gecmis.every((k) => !k.yeni)).toBe(true);
  });

  it("sahne içinde gelen arama geçmişin BAŞINA düşer", () => {
    const v = telefonVeriTuret(
      nergis,
      [olay("cagri", { tur: "aramaGeldi", arayan: "Sezai", numara: "cep" })],
      "23:44",
    );
    expect(v.gecmis[0]).toMatchObject({ ad: "Sezai", yon: "gelen", zaman: "23:44", yeni: true });
    expect(v.gecmis).toHaveLength(nergis.aramaGecmisi.length + 1);
  });

  it("birden çok arama en yeniden eskiye sıralanır", () => {
    const v = telefonVeriTuret(
      nergis,
      [
        olay("bir", { tur: "aramaGeldi", arayan: "Anne" }),
        olay("iki", { tur: "aramaGeldi", arayan: "Elif" }),
      ],
      "23:50",
    );
    expect(v.gecmis[0]?.ad).toBe("Elif");
    expect(v.gecmis[1]?.ad).toBe("Anne");
  });

  it("BAŞA SAR: olaylar boşalınca geçmiş sahnenin başındaki haline döner", () => {
    const gezinilmis = telefonVeriTuret(
      nergis,
      [olay("cagri", { tur: "aramaGeldi", arayan: "Sezai" })],
      "23:44",
    );
    const basa = telefonVeriTuret(nergis, [], "23:44");
    expect(gezinilmis.gecmis.length).toBe(basa.gecmis.length + 1);
    expect(basa.gecmis.every((k) => !k.yeni)).toBe(true);
  });

  it("arama dışındaki olaylar geçmişi değiştirmez", () => {
    const v = telefonVeriTuret(nergis, [olay("pil", { tur: "pilDegisti", seviye: 8 })], "23:44");
    expect(v.gecmis).toHaveLength(nergis.aramaGecmisi.length);
  });

  it("cihaz yoksa çökmez", () => {
    const v = telefonVeriTuret(null, [], "12:00");
    expect(v.gecmis).toEqual([]);
    expect(v.rehber).toEqual([]);
  });
});

describe("rehber", () => {
  it("Türkçe alfabeye göre sıralanır", () => {
    const sirali = rehberSirala([
      { ad: "Zeynep" },
      { ad: "Çağla" },
      { ad: "Ali" },
      { ad: "İpek" },
    ]);
    expect(sirali.map((k) => k.ad)).toEqual(["Ali", "Çağla", "İpek", "Zeynep"]);
  });

  it("kaynağı değiştirmez", () => {
    const kaynak = [{ ad: "Zeynep" }, { ad: "Ali" }];
    rehberSirala(kaynak);
    expect(kaynak[0]?.ad).toBe("Zeynep");
  });

  it("baş harf Türkçe kurallarına göre büyütülür", () => {
    expect(basHarf("işıl")).toBe("İ");
    expect(basHarf("Sezai")).toBe("S");
    expect(basHarf("")).toBe("?");
  });
});

describe("kişi mi numara mı", () => {
  it("kayıtlı kişi adında harf vardır", () => {
    expect(rehberAdiMi("Sezai")).toBe(true);
    expect(rehberAdiMi("Anne")).toBe(true);
  });

  it("çevrilen numara harf içermez — avatarda rakam görünmemeli", () => {
    expect(rehberAdiMi("0532 000 00 12")).toBe(false);
    expect(rehberAdiMi("0216 000 00 09")).toBe(false);
    expect(rehberAdiMi("+90 532 000 00 12")).toBe(false);
  });

  it("Türkçe harfleri de tanır", () => {
    expect(rehberAdiMi("Çağla")).toBe(true);
    expect(rehberAdiMi("İpek")).toBe(true);
  });
});

describe("cihaz şeması — arama geçmişi", () => {
  const temel = { kod: "test-telefon", skin: "ios" };

  it("geçmiş verilmezse boş liste olur", () => {
    expect(CihazSchema.parse(temel).aramaGecmisi).toEqual([]);
  });

  it("tanınmayan yön kabul edilmez", () => {
    const sonuc = CihazSchema.safeParse({
      ...temel,
      aramaGecmisi: [{ ad: "Sezai", yon: "belirsiz", zaman: "dün" }],
    });
    expect(sonuc.success).toBe(false);
  });

  it("zamanı olmayan kayıt kabul edilmez — listede boş sütun görünmesin", () => {
    const sonuc = CihazSchema.safeParse({
      ...temel,
      aramaGecmisi: [{ ad: "Sezai", yon: "gelen" }],
    });
    expect(sonuc.success).toBe(false);
  });
});

describe("telefon sahnesi", () => {
  const sahne = sahneler.find((s) => s.baslangic.modul === "telefon") ?? null;

  it("telefon modülünü kullanan bir sahne var", () => {
    expect(sahne).not.toBeNull();
  });

  it("ghost typing hedefi modülün beklediği ad", () => {
    const hedefler = (sahne?.olaylar ?? []).flatMap((o) =>
      o.aksiyon.tur === "ghostTypingBaslat" ? [o.aksiyon.hedef] : [],
    );
    expect(hedefler).toContain("telefon-numara");
  });

  it("sekme dokunuşları modüldeki adlarla eşleşiyor", () => {
    const gecerli = new Set(["telefon-gecmis", "telefon-rehber", "telefon-tus", "telefon-ara"]);
    for (const o of sahne?.olaylar ?? []) {
      if (o.tetik.tur !== "dokunma") continue;
      if (!o.tetik.hedef.startsWith("telefon-")) continue;
      expect(gecerli.has(o.tetik.hedef)).toBe(true);
    }
  });
});
