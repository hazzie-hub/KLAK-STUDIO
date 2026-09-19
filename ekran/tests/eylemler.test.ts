import { describe, expect, it } from "vitest";

import { sahneKaydet, sahneyiKilitle, yeniVersiyon, yayinla } from "../src/studio/eylemler";

/**
 * Formdan gelen veri kaydedilmeden önce Zod'dan geçer. Buradaki testler
 * DOĞRULAMA dalını sabitler: hatalı sahne veritabanına hiç ulaşmamalı ve
 * kullanıcı Türkçe, alan bazlı hata görmeli.
 *
 * Başarı dalı (veritabanına yazma) burada test edilmez; veritabanı ister.
 */
const gecerli = {
  kod: "eg-b03-s90",
  cihaz: "nergis-telefon",
  baslangic: { modul: "kilit", ekran: "kilit" },
  talimat: "Telefon kilitli, masada duruyor.",
  olaylar: [],
};

describe("sahneKaydet — doğrulama", () => {
  it("talimatsız sahne reddedilir", async () => {
    const sonuc = await sahneKaydet({ ...gecerli, talimat: "" });
    expect(sonuc.ok).toBe(false);
    if (!sonuc.ok) {
      expect(sonuc.hatalar.some((h) => h.yol === "talimat")).toBe(true);
      expect(sonuc.hatalar[0]?.mesaj).toMatch(/talimat/i);
    }
  });

  it("geçersiz sahne kodu reddedilir ve hata kodu alanını gösterir", async () => {
    const sonuc = await sahneKaydet({ ...gecerli, kod: "RASTGELE" });
    expect(sonuc.ok).toBe(false);
    if (!sonuc.ok) expect(sonuc.hatalar.some((h) => h.yol === "kod")).toBe(true);
  });

  it("aynı id'li iki olay reddedilir", async () => {
    const sonuc = await sahneKaydet({
      ...gecerli,
      olaylar: [
        { id: "ayni", ad: "Bir", tetik: { tur: "elle" }, aksiyon: { tur: "takipGeldi", hesap: "nergis" } },
        { id: "ayni", ad: "İki", tetik: { tur: "elle" }, aksiyon: { tur: "takipGeldi", hesap: "nergis" } },
      ],
    });
    expect(sonuc.ok).toBe(false);
    if (!sonuc.ok) expect(sonuc.hatalar.some((h) => h.mesaj.includes("benzersiz"))).toBe(true);
  });

  it("var olmayan olaya bağlanan zincir reddedilir", async () => {
    const sonuc = await sahneKaydet({
      ...gecerli,
      olaylar: [
        {
          id: "ikinci",
          ad: "İkinci olay",
          tetik: { tur: "sonra", olayId: "olmayan", gecikme: 1000 },
          aksiyon: { tur: "takipGeldi", hesap: "nergis" },
        },
      ],
    });
    expect(sonuc.ok).toBe(false);
    if (!sonuc.ok) expect(sonuc.hatalar.some((h) => h.mesaj.includes("diye bir olay yok"))).toBe(true);
  });

  it("tanınmayan aksiyon türü reddedilir", async () => {
    const sonuc = await sahneKaydet({
      ...gecerli,
      olaylar: [{ id: "bir", ad: "Bir", tetik: { tur: "elle" }, aksiyon: { tur: "uydurma" } }],
    });
    expect(sonuc.ok).toBe(false);
  });

  it("adsız olay reddedilir — kumandada boş satır görünmesin", async () => {
    const sonuc = await sahneKaydet({
      ...gecerli,
      olaylar: [{ id: "bir", ad: "", tetik: { tur: "elle" }, aksiyon: { tur: "takipGeldi", hesap: "nergis" } }],
    });
    expect(sonuc.ok).toBe(false);
    if (!sonuc.ok) expect(sonuc.hatalar.some((h) => h.yol === "olaylar.0.ad")).toBe(true);
  });

  it("hata listesi boş dönmez — kullanıcı sebepsiz kalmaz", async () => {
    const sonuc = await sahneKaydet({});
    expect(sonuc.ok).toBe(false);
    if (!sonuc.ok) expect(sonuc.hatalar.length).toBeGreaterThan(0);
  });
});

describe("yayınla", () => {
  it("sahne kodu boşsa ne eksik olduğunu söyler", async () => {
    const sonuc = await yayinla("");
    expect(sonuc.ok).toBe(false);
    if (!sonuc.ok) expect(sonuc.mesaj).toContain("belli değil");
  });
});

describe("kilit ve versiyon — veritabanı yokken", () => {
  /**
   * Bu eylemler veritabanı ister. Testte veritabanı yok; beklenen davranış
   * ÇÖKMEK DEĞİL, ne eksik olduğunu söyleyen bir sonuç dönmek. Stüdyo'nun
   * hiçbir düğmesi kullanıcıya boş ekran göstermemeli.
   */
  it("kilitleme, bağlantı yokken açıklayıcı hata döner", async () => {
    const sonuc = await sahneyiKilitle("eg-b03-s12");
    expect(sonuc.ok).toBe(false);
    if (!sonuc.ok) {
      expect(sonuc.hatalar).toHaveLength(1);
      expect(sonuc.hatalar[0]?.mesaj).toContain("veritabanına bağlı değil");
    }
  });

  it("yeni versiyon, bağlantı yokken açıklayıcı hata döner", async () => {
    const sonuc = await yeniVersiyon("eg-b03-s12");
    expect(sonuc.ok).toBe(false);
    if (!sonuc.ok) expect(sonuc.hatalar[0]?.mesaj).toContain("veritabanına bağlı değil");
  });
});
