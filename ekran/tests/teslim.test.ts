import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  cihazHazirligi,
  kodCoz,
  kumandaLinki,
  oynaticiLinki,
  sahneBasligi,
  teslimMetni,
} from "../src/studio/teslim";
import { CihazSchema, SahneSchema, type Cihaz, type Sahne } from "../src/schema";

const KOK = join(import.meta.dirname, "..");
const oku = (yol: string) => JSON.parse(readFileSync(join(KOK, yol), "utf-8")) as unknown;
const klasor = (ad: string) =>
  readdirSync(join(KOK, "content", ad))
    .filter((d) => d.endsWith(".json"))
    .sort()
    .map((d) => oku(`content/${ad}/${d}`));

const sahneler = klasor("sahneler").map((s) => SahneSchema.parse(s) as Sahne);
const cihazlar = klasor("cihazlar").map((c) => CihazSchema.parse(c) as Cihaz);
const sahne = sahneler.find((s) => s.kod === "eg-b03-s58")!;
const cihaz = cihazlar.find((c) => c.kod === sahne.cihaz) ?? null;
const dizi = { kod: "eg", ad: "Evlilik Güzeldir" };

describe("sahne kodu çözümleme", () => {
  it("dizi, bölüm ve sahne numarasını ayırır", () => {
    expect(kodCoz("eg-b03-s58")).toEqual({ dizi: "eg", bolum: 3, sahne: 58, ek: undefined });
  });

  it("ikinci cihaz ekini tanır", () => {
    expect(kodCoz("eg-b03-s41-nergis")).toMatchObject({ bolum: 3, sahne: 41, ek: "nergis" });
  });

  it("baştaki sıfırları sayıya çevirir", () => {
    expect(kodCoz("eg-b03-s07")?.sahne).toBe(7);
  });

  it("geçersiz kodda null döner", () => {
    expect(kodCoz("rastgele")).toBeNull();
    expect(kodCoz("EG-B03-S58")).toBeNull();
  });

  it("gerçek sahnelerin hepsi çözülebiliyor", () => {
    for (const s of sahneler) expect(kodCoz(s.kod)).not.toBeNull();
  });
});

describe("linkler", () => {
  it("oynatıcı ve kumanda adresleri doğru", () => {
    expect(oynaticiLinki("https://ornek.app", "eg-b03-s58")).toBe("https://ornek.app/p/eg-b03-s58");
    expect(kumandaLinki("https://ornek.app", "eg-b03-s58")).toBe("https://ornek.app/k/eg-b03-s58");
  });

  it("sondaki eğik çizgi çift çizgiye dönüşmez", () => {
    expect(oynaticiLinki("https://ornek.app/", "eg-b03-s58")).toBe("https://ornek.app/p/eg-b03-s58");
    expect(oynaticiLinki("https://ornek.app///", "eg-b03-s58")).toBe(
      "https://ornek.app/p/eg-b03-s58",
    );
  });
});

describe("cihaz hazırlığı", () => {
  it("iOS'ta Rehberli Erişim, Android'de Ekran Sabitleme yazar", () => {
    expect(cihazHazirligi("ios", false).join(" ")).toContain("Rehberli Erişim");
    expect(cihazHazirligi("android", false).join(" ")).toContain("Ekran Sabitleme");
  });

  it("bilgisayarda tam ekran uyarısı var, otomatik kilit yok", () => {
    const maddeler = cihazHazirligi("desktop", false).join(" ");
    expect(maddeler).toContain("tam ekran");
    expect(maddeler).not.toContain("Otomatik kilit");
  });

  it("kumanda kullanılacaksa uçak modu denmez", () => {
    expect(cihazHazirligi("ios", true).join(" ")).not.toContain("Uçak modu");
    expect(cihazHazirligi("ios", false).join(" ")).toContain("Uçak modu");
  });
});

describe("teslim metni", () => {
  const temel = { sahne, cihaz, dizi, karakter: null, taban: "https://ornek.app" };

  it("başlıkta dizi adı, bölüm ve sahne numarası var", () => {
    expect(sahneBasligi(sahne, dizi)).toBe("Evlilik Güzeldir · Bölüm 3, Sahne 58");
  });

  it("oynatıcı linkini içerir", () => {
    const metin = teslimMetni({ ...temel, kumandaVar: false });
    expect(metin).toContain("https://ornek.app/p/eg-b03-s58");
  });

  it("sahnenin talimatını birebir içerir", () => {
    const metin = teslimMetni({ ...temel, kumandaVar: false });
    expect(metin).toContain(sahne.talimat);
  });

  it("kumanda kapalıyken kumanda linki GEÇMEZ", () => {
    const metin = teslimMetni({ ...temel, kumandaVar: false });
    expect(metin).not.toContain("/k/eg-b03-s58");
  });

  it("kumanda açıkken kumanda linki geçer", () => {
    const metin = teslimMetni({ ...temel, kumandaVar: true });
    expect(metin).toContain("https://ornek.app/k/eg-b03-s58");
  });

  it("çekimden önce yapılacaklar her zaman var — sette en çok unutulan adım", () => {
    const metin = teslimMetni({ ...temel, kumandaVar: true });
    expect(metin.toLocaleLowerCase("tr")).toContain("bir kez yenileyin");
  });

  it("TELEFONDA ana ekrana ekleme adımı var — tarayıcı çubuğu kameraya girmesin", () => {
    for (const skin of ["ios", "android"] as const) {
      const metin = teslimMetni({
        ...temel,
        cihaz: { ...(cihaz ?? { kod: "x", skin, rehber: [], aramaGecmisi: [] }), skin },
        kumandaVar: false,
      });
      expect({ skin, var: metin.includes("Ana Ekrana Ekle") || metin.includes("Ana ekrana ekle") }).toEqual({
        skin,
        var: true,
      });
      expect(metin).toContain("ikondan");
    }
  });

  it("BİLGİSAYARDA ana ekrana ekleme değil, tam ekran yazar", () => {
    const metin = teslimMetni({
      ...temel,
      cihaz: { ...(cihaz ?? { kod: "x", skin: "desktop", rehber: [], aramaGecmisi: [] }), skin: "desktop" },
      kumandaVar: false,
    });
    expect(metin).not.toContain("Ana ekrana ekle");
    expect(metin).toContain("F11");
  });

  it("karakter adı verilirse cihaz satırında o yazar", () => {
    const metin = teslimMetni({
      ...temel,
      karakter: { id: "nergis", dizi: "eg", ad: "Nergis Aydın" },
      kumandaVar: false,
    });
    expect(metin).toContain("Nergis Aydın");
  });

  it("her sahne için metin üretilebiliyor ve boş değil", () => {
    for (const s of sahneler) {
      const c = cihazlar.find((x) => x.kod === s.cihaz) ?? null;
      const metin = teslimMetni({
        sahne: s,
        cihaz: c,
        dizi,
        karakter: null,
        taban: "https://ornek.app",
        kumandaVar: true,
      });
      expect(metin.length).toBeGreaterThan(120);
      expect(metin).toContain(s.kod);
    }
  });
});
