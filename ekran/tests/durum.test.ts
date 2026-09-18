import { describe, expect, it } from "vitest";

import { durumEzmeleri, etkinGorsel, gecikmeHesapla, sinyalCubugu } from "../src/durum";
import type { GorunenDurum } from "../src/shell/gorunen-durum";

const temel: GorunenDurum = {
  baglanti: "normal",
  gorsel: "normal",
  saat: "21:04",
  tarih: "18 Eylül Perşembe",
  pil: 68,
  sarjda: false,
};

describe("etkinGorsel — bağlantı ile görsel ayarının birleşimi", () => {
  it("bağlantı yoksa görsel hiç gelmez, sahne ne derse desin", () => {
    expect(etkinGorsel("yok", "normal")).toBe("yuklenmez");
    expect(etkinGorsel("yok", "gec")).toBe("yuklenmez");
    expect(etkinGorsel("yok", "yuklenmez")).toBe("yuklenmez");
  });

  it("bağlantı yavaşsa ve sahne bir şey demediyse görseller gecikir", () => {
    expect(etkinGorsel("yavas", "normal")).toBe("gec");
  });

  it("sahne görsel için açıkça bir şey dediyse o kazanır", () => {
    expect(etkinGorsel("yavas", "yuklenmez")).toBe("yuklenmez");
    expect(etkinGorsel("normal", "gec")).toBe("gec");
    expect(etkinGorsel("normal", "yuklenmez")).toBe("yuklenmez");
  });

  it("her şey normalse görsel normal gelir", () => {
    expect(etkinGorsel("normal", "normal")).toBe("normal");
  });
});

describe("gecikmeHesapla — DETERMİNİSTİK (CLAUDE.md §2.4)", () => {
  it("aynı görsel her çağrıda aynı gecikmeyi verir", () => {
    const a = gecikmeHesapla("/ornek/cicekci.svg");
    for (let i = 0; i < 50; i++) {
      expect(gecikmeHesapla("/ornek/cicekci.svg")).toBe(a);
    }
  });

  it("farklı görseller farklı gecikmeler alır (hepsi aynı anda düşmez)", () => {
    const sureler = new Set(
      ["/ornek/cicekci.svg", "/ornek/sokak.svg", "/ornek/masa.svg", "/ornek/deniz.svg"].map((k) =>
        gecikmeHesapla(k),
      ),
    );
    expect(sureler.size).toBeGreaterThan(1);
  });

  it("gecikme verilen aralığın dışına çıkmaz", () => {
    for (const k of ["a", "bb", "uzun-bir-gorsel-adi.jpg", "", "ş-ğ-ü"]) {
      const s = gecikmeHesapla(k, 700, 1100);
      expect(s).toBeGreaterThanOrEqual(700);
      expect(s).toBeLessThan(1800);
    }
  });
});

describe("sinyalCubugu — bağlantı profili ikona yansır", () => {
  it("profilleri çubuk sayısına çevirir", () => {
    expect(sinyalCubugu("normal")).toBe(4);
    expect(sinyalCubugu("yavas")).toBe(2);
    expect(sinyalCubugu("yok")).toBe(0);
  });
});

describe("durumEzmeleri — adres çubuğundan test ezmeleri", () => {
  it("hiçbir ezme yoksa durum aynen kalır", () => {
    expect(durumEzmeleri({}, temel)).toEqual(temel);
  });

  it("geçerli değerleri uygular", () => {
    const d = durumEzmeleri({ baglanti: "yavas", gorsel: "yuklenmez", pil: "5", saat: "07:30" }, temel);
    expect(d.baglanti).toBe("yavas");
    expect(d.gorsel).toBe("yuklenmez");
    expect(d.pil).toBe(5);
    expect(d.saat).toBe("07:30");
  });

  it("şarj durumunu 1/0 ile alır", () => {
    expect(durumEzmeleri({ sarjda: "1" }, temel).sarjda).toBe(true);
    expect(durumEzmeleri({ sarjda: "0" }, temel).sarjda).toBe(false);
  });

  it("tarihi serbest metin olarak alır", () => {
    expect(durumEzmeleri({ tarih: "3 Mart Pazartesi" }, temel).tarih).toBe("3 Mart Pazartesi");
    expect(durumEzmeleri({ tarih: "   " }, temel).tarih).toBe(temel.tarih);
  });

  it("GEÇERSİZ değerleri sessizce yok sayar, sahneyi bozmaz (CLAUDE.md §2.6)", () => {
    const d = durumEzmeleri(
      { baglanti: "kotu", gorsel: "hizli", pil: "200", saat: "25:99", sarjda: "belki" },
      temel,
    );
    expect(d).toEqual(temel);
  });

  it("aynı anahtar birden çok kez verilirse ilkini alır", () => {
    expect(durumEzmeleri({ gorsel: ["gec", "yuklenmez"] }, temel).gorsel).toBe("gec");
  });
});
